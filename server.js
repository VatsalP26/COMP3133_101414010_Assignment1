require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { graphqlUploadExpress } = require('graphql-upload');
const connectDB = require('./config/db');
const typeDefs = require('./schema/typeDefs');
const resolvers = require('./schema/resolvers');
const path = require('path');

connectDB();

const app = express();
app.use(express.json());

// Enable GraphQL File Uploads Middleware
app.use(graphqlUploadExpress({ maxFileSize: 5 * 1024 * 1024, maxFiles: 1 }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

async function startServer() {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req }) => ({ req }), // Pass request to resolvers
    });

    await server.start();
    server.applyMiddleware({ app });

    const PORT = process.env.PORT;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}${server.graphqlPath}`);
    });
}

startServer();
