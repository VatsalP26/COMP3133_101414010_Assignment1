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

  Employee: {
    date_of_joining: (parent) => {
      return parent.date_of_joining.toISOString();
    },
  },

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

    getAllEmployees: async (_, __, { user }) => {
      if (!user) throw new Error("You must be logged in to access this resource");

      try {
        return await Employee.find();
      } catch (error) {
        throw new Error("Error retrieving employees");
      }
    },

    searchEmployeeById: async (_, { id }, { user }) => {
      if (!user) throw new Error("You must be logged in to access this resource");

      try {
        const employee = await Employee.findById(id);
        if (!employee) throw new Error("Employee not found");
        return employee;
      } catch (error) {
        throw new Error("Invalid Employee ID");
      }
    },

    searchEmployeeByDesignationOrDepartment: async (_, { designation, department }, { user }) => {
      if (!user) throw new Error("You must be logged in to access this resource");

      try {
        let filter = {};
        if (designation) filter.designation = designation;
        if (department) filter.department = department;

        const employees = await Employee.find(filter);
        return employees;
      } catch (error) {
        throw new Error("Error retrieving employees");
      }
    },
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

    addEmployee: async (_, { input }, { user }) => {
      if (!user) throw new Error("You must be logged in to access this resource");

      try {
        const { employee_photo, ...employeeData } = input;
        let photoPath = null;

        if (employee_photo) {
          const { createReadStream, filename, mimetype } = await employee_photo;

          const allowedTypes = /jpeg|jpg|png/;
          const extname = allowedTypes.test(path.extname(filename).toLowerCase());
          const mimeTypeValid = allowedTypes.test(mimetype);
          if (!extname || !mimeTypeValid) {
            throw new Error('Only JPEG, JPG, and PNG images are allowed!');
          }

          const stream = createReadStream();
          let fileSize = 0;
          stream.on('data', (chunk) => {
            fileSize += chunk.length;
            if (fileSize > 5 * 1024 * 1024) {
              stream.destroy();
              throw new Error('File size exceeds 5MB limit!');
            }
          });

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

    updateEmployee: async (_, { id, input }, { user }) => {
      if (!user) throw new Error("You must be logged in to access this resource");

      try {
        const employee = await Employee.findById(id);
        if (!employee) throw new Error("Employee not found");

        const { employee_photo, ...updateData } = input;
        let photoPath = null;

        if (employee_photo) {
          const { createReadStream, filename, mimetype } = await employee_photo;

          const allowedTypes = /jpeg|jpg|png/;
          const extname = allowedTypes.test(path.extname(filename).toLowerCase());
          const mimeTypeValid = allowedTypes.test(mimetype);
          if (!extname || !mimeTypeValid) {
            throw new Error('Only JPEG, JPG, and PNG images are allowed!');
          }

          const stream = createReadStream();
          let fileSize = 0;
          stream.on('data', (chunk) => {
            fileSize += chunk.length;
            if (fileSize > 5 * 1024 * 1024) {
              stream.destroy();
              throw new Error('File size exceeds 5MB limit!');
            }
          });

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

          photoPath = `uploads/${uniqueFileName}`;
        }

        const updatedData = { ...updateData };
        if (photoPath) {
          updatedData.employee_photo = photoPath;
        }

        const updatedEmployee = await Employee.findByIdAndUpdate(id, updatedData, { new: true });
        return updatedEmployee;
      } catch (error) {
        throw new Error("Error updating employee");
      }
    },

    deleteEmployee: async (_, { id }, { user }) => {
      if (!user) throw new Error("You must be logged in to access this resource");

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
    },
  },
};

module.exports = resolvers;