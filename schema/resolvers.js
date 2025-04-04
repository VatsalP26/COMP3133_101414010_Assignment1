const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { finished } = require('stream/promises');
const path = require('path');
const fs = require('fs');
const { GraphQLUpload } = require('graphql-upload');

const resolvers = {
    Upload: GraphQLUpload, 

    Query: {
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

        addEmployee: async (_, { file, ...employeeData }) => {
            try {
                let photoPath = null;

                if (file) {
                    const { createReadStream, filename } = await file; 
                    const stream = createReadStream();

                    const uploadDir = path.join(__dirname, '..', 'uploads');
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir);
                    }

                    const uniqueFileName = `${Date.now()}-${filename}`;
                    const filePath = path.join(uploadDir, uniqueFileName);
                    const out = fs.createWriteStream(filePath);
                    stream.pipe(out);
                    await finished(out);

                    photoPath = `uploads/${uniqueFileName}`;
                }

                const existingEmployee = await Employee.findOne({ email: employeeData.email });
                if (existingEmployee) throw new Error("Employee with this email already exists");

                const newEmployee = new Employee({
                    ...employeeData,
                    employee_photo: photoPath,
                });

                await newEmployee.save();
                return newEmployee;
            } catch (error) {
                throw new Error(error.message);
            }
        },

        updateEmployee: async (_, { id, file, ...updateData }) => {
            try {
                const employee = await Employee.findById(id);
                if (!employee) throw new Error("Employee not found");
        
                if (file) {
                    const upload = await file;
                    const { createReadStream, filename } = upload;
                    const stream = createReadStream();
        
                    const uploadDir = path.join(__dirname, '..', 'uploads');
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir);
                    }
        
                    if (employee.employee_photo) {
                        const oldPhotoPath = path.join(__dirname, '..', employee.employee_photo);
                        if (fs.existsSync(oldPhotoPath)) {
                            fs.unlinkSync(oldPhotoPath);
                        }
                    }
        
                    const uniqueFileName = `${Date.now()}-${filename}`;
                    const filePath = path.join(uploadDir, uniqueFileName);
                    const out = fs.createWriteStream(filePath);
                    stream.pipe(out);
                    await finished(out);
        
                    updateData.employee_photo = `uploads/${uniqueFileName}`;
                }
        
                const updatedEmployee = await Employee.findByIdAndUpdate(id, updateData, { new: true });
                return updatedEmployee;
            } catch (error) {
                throw new Error("Error updating employee");
            }
        },
        

        deleteEmployee: async (_, { id }) => {
            try {
                const employee = await Employee.findById(id);
                if (!employee) throw new Error("Employee not found");
        
                if (employee.employee_photo) {
                    const filePath = path.join(__dirname, '..', employee.employee_photo);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath); 
                    }
                }
        
                await Employee.findByIdAndDelete(id);
                return "Employee deleted successfully";
            } catch (error) {
                throw new Error("Error deleting employee");
            }
        }
        
    }
};

module.exports = resolvers;
