const { gql } = require('apollo-server-express');

const typeDefs = gql`

scalar Upload

    type User {
        id: ID!
        username: String!
        email: String!
        password: String!
    }

    
    type Employee {
        id: ID!
        first_name: String!
        last_name: String!
        email: String!
        gender: String!
        designation: String!
        salary: Float!
        date_of_joining: String!
        department: String!
        employee_photo: String
    }

    type AuthPayload {
        token: String
        user: User
    }

    type Query {
        login(email: String!, password: String!): AuthPayload
        getAllEmployees: [Employee]
        searchEmployeeById(id: ID!): Employee
        searchEmployeeByDesignationOrDepartment(designation: String, department: String): [Employee]
    }

    type Mutation {
        signup(username: String!, email: String!, password: String!): User
        addEmployee(
            first_name: String!,
            last_name: String!,
            email: String!,
            gender: String!,
            designation: String!,
            salary: Float!,
            date_of_joining: String!,
            department: String!,
            file: Upload
        ): Employee
        updateEmployee(
            id: ID!,
            first_name: String,
            last_name: String,
            email: String,
            designation: String,
            salary: Float,
            department: String,
            file: Upload
        ): Employee
        deleteEmployee(id: ID!): String
    }
`;

module.exports = typeDefs;
