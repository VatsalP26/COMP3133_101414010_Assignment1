require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { graphqlUploadExpress } = require('graphql-upload');
const connectDB = require('./config/db');
const typeDefs = require('./schema/typeDefs');
const resolvers = require('./schema/resolvers');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');

connectDB();

const app = express();

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true,
}));

app.use(express.json());

app.use(graphqlUploadExpress({ maxFileSize: 5 * 1024 * 1024, maxFiles: 1 }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const token = req.headers.authorization || '';
      let user = null;
      if (token) {
        try {
          const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
          user = decoded;
        } catch (error) {
          console.error('Invalid token:', error.message);
        }
      }
      return { req, user };
    },
  });

  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();