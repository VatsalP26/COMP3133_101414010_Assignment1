# COMP3133_101414010_Assignment1
Name: Vatsal Prajapati <br>
Student Id: 101414010

Overview
This Employee Management System allows administrators to manage employee data. The system includes functionalities for adding, updating, viewing, and deleting employee records, along with uploading employee profile photos. The backend is built using Node.js, Express, and MongoDB. The project uses GraphQL to interact with the data, ensuring flexibility in querying and mutations. The application includes JWT-based authentication for securing the endpoints.
I have used Apollo Server for implementing GraphQL API.

Features <br>
User Authentication: Secure login system using JWT.
Employee Management: Add, update, delete, and view employee records.
File Upload: Employee profile photos are uploaded and stored in the server, with proper handling of file types.
GraphQL API: GraphQL API for querying and mutations of employee data.
Image Handling: Employee photos are stored on the server and accessible via URLs.
Tech Stack
Node.js: JavaScript runtime used for building the server-side logic.
Express: Web framework for building APIs.
MongoDB: NoSQL database for storing employee data.
GraphQL: Query language for APIs used to interact with the backend.
Multer: Middleware for handling multipart/form-data (file uploads).
Bcryptjs: Library for password hashing.
JWT (JSON Web Token): Token-based authentication for securing the API.
Mongoose: ODM (Object Data Modeling) library for MongoDB and Node.js.

Tested GraphQL API using Postman <br>
Endpoints - <br>
Queries <br>
getAllEmployees: Retrieve all employees.
searchEmployeeById: Retrieve an employee by their ID.
searchEmployeeByDesignationOrDepartment: Retrieve employees by designation or department. <br>
Mutations <br>
signup: Create a new user account
login: User authentication to get the JWT token.
addEmployee: Add a new employee, including the profile photo.
updateEmployee: Update an existing employee's details, including the profile photo.
deleteEmployee: Delete an employee by ID.
