const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const upload = require('../middleware/uploadMiddleware');

const resolvers = {
    Query: { // user will login using email & password
        login: async (_, { email, password }) => {
            try {
                const user = await User.findOne({ email });
                if (!user) throw new Error("Invalid credentials"); 

                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) throw new Error("Invalid credentials");

                const token = jwt.sign(
                    { id: user.id, email: user.email },
                    process.env.JWT_SECRET,
                    { expiresIn: "1h" }
                );

                return { token, user };
            } catch (error) {
                throw new Error(error.message);
            }
        },
    // applying the functionality to get all employees or by their id     
        getAllEmployees: async () => {
            try {
                return await Employee.find();
            } catch (error) {
                throw new Error("Error retrieving employees");
            }
        },

        searchEmployeeById: async (_, { id }) => {
            try {
                const employee = await Employee.findById(id);
                if (!employee) throw new Error("Employee not found");
                return employee;
            } catch (error) {
                throw new Error("Invalid Employee ID");
            }
        },
    // applying the functionality to search employees by sedignation or department
        searchEmployeeByDesignationOrDepartment: async (_, { designation, department }) => {
            try {
                let filter = {};
                if (designation) filter.designation = designation;
                if (department) filter.department = department;

                const employees = await Employee.find(filter);
                return employees;
            } catch (error) {
                throw new Error("Error retrieving employees");
            }
        }
    },
    // logining in using mutation and the requirement is username, email, password
    Mutation: {
        signup: async (_, { username, email, password }) => {
            try {
                const existingUser = await User.findOne({ email });
                if (existingUser) throw new Error("Email already registered");

                const hashedPassword = await bcrypt.hash(password, 10);
                const newUser = new User({ username, email, password: hashedPassword });
                await newUser.save();

                return newUser;
            } catch (error) {
                throw new Error(error.message);
            }
        },
    // mutation to add, update and delete employee
        addEmployee: async (_, employeeData, { req }) => {
            try {
                let employeePhotoPath = "uploads/default.jpg"; 

                if (req.file) {
                    employeePhotoPath = `uploads/${req.file.filename}`;
                }

                const existingEmployee = await Employee.findOne({ email: employeeData.email });
                if (existingEmployee) throw new Error("Employee with this email already exists");

                const newEmployee = new Employee({
                    ...employeeData,
                    employee_photo: employeePhotoPath
                });

                await newEmployee.save();
                return newEmployee;
            } catch (error) {
                throw new Error(error.message);
            }
        },

        updateEmployee: async (_, { id, ...updateData }) => {
            try {
                const updatedEmployee = await Employee.findByIdAndUpdate(id, updateData, { new: true });
                if (!updatedEmployee) throw new Error("Employee not found");
                return updatedEmployee;
            } catch (error) {
                throw new Error("Error updating employee");
            }
        },

        deleteEmployee: async (_, { id }) => {
            try {
                const employee = await Employee.findById(id);
                if (!employee) throw new Error("Employee not found");
                await Employee.findByIdAndDelete(id);
                return "Employee deleted successfully";
            } catch (error) {
                throw new Error("Error deleting employee");
            }
        }
    }
};

module.exports = resolvers;
