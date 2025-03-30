const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

module.exports = function(connection) {
  // Signup route
  router.post('/signup', async (req, res) => {
    try {
      const { 
        firstName, lastName, email, password, phone, address, city, pincode, 
        userType, occupation, budget, preferredLocation, 
        propertyCount, propertyType, businessName,
        experience, skills, availability
      } = req.body;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user data
      const [result] = await connection.promise().query(
        'INSERT INTO users (first_name, last_name, email, password, phone, address, city, pincode, user_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [firstName, lastName, email, hashedPassword, phone, address, city, pincode, userType]
      );

      const userId = result.insertId;

      // Insert role-specific data
      if (userType === 'tenant') {
        await connection.promise().query(
          'INSERT INTO tenant_details (user_id, occupation, monthly_budget, preferred_location) VALUES (?, ?, ?, ?)',
          [userId, occupation, budget, preferredLocation]
        );
      } else if (userType === 'landlord') {
        await connection.promise().query(
          'INSERT INTO landlord_details (user_id, property_count, property_type, business_name) VALUES (?, ?, ?, ?)',
          [userId, propertyCount, propertyType, businessName]
        );
      } else if (userType === 'custodian') {
        await connection.promise().query(
          'INSERT INTO custodian_details (user_id, experience, skills, availability) VALUES (?, ?, ?, ?)',
          [userId, experience, skills, availability]
        );
      }

      res.status(201).json({ 
        success: true, 
        message: 'User registered successfully' 
      });
    } catch (error) {
      console.error('Error during signup:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already exists' 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: 'Error registering user' 
      });
    }
  });

  // Login route
  router.post('/login', async (req, res) => {
    try {
      const { email, password, userType } = req.body;
      
      // Get user from database
      const [users] = await connection.promise().query(
        'SELECT * FROM users WHERE email = ? AND user_type = ?',
        [email, userType]
      );
      
      if (users.length === 0) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or user type' 
        });
      }

      const user = users[0];

      // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid password' 
        });
      }

      // Get role-specific details based on user type
      let roleDetails = null;
      
      if (userType === 'tenant') {
        const [details] = await connection.promise().query(
          'SELECT * FROM tenant_details WHERE user_id = ?', 
          [user.id]
        );
        if (details.length > 0) {
          roleDetails = details[0];
        }
      } else if (userType === 'landlord') {
        const [details] = await connection.promise().query(
          'SELECT * FROM landlord_details WHERE user_id = ?', 
          [user.id]
        );
        if (details.length > 0) {
          roleDetails = details[0];
        }
      } else if (userType === 'custodian') {
        const [details] = await connection.promise().query(
          'SELECT * FROM custodian_details WHERE user_id = ?', 
          [user.id]
        );
        if (details.length > 0) {
          roleDetails = details[0];
        }
      }

      // In a real app, you would generate a JWT token here
      // For simplicity, we're just returning user data
      res.json({
        success: true,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          city: user.city,
          pincode: user.pincode,
          userType: user.user_type,
          roleDetails: roleDetails
        }
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error during login' 
      });
    }
  });

  return router;
};