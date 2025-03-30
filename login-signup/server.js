// server.js

const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve your HTML files from here

// Database connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'your-password',
  database: 'dream_estate'
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Database setup function
// Database setup function
function setupDatabase() {
  // Create users table if not exists
  connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      address VARCHAR(255) NOT NULL,
      city VARCHAR(100) NOT NULL,
      pincode VARCHAR(20) NOT NULL,
      user_type ENUM('tenant', 'landlord', 'custodian') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table created or already exists');
    }
  });

  // Create tenant_details table if not exists
  connection.query(`
    CREATE TABLE IF NOT EXISTS tenant_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      occupation VARCHAR(100) NOT NULL,
      monthly_budget DECIMAL(10, 2) NOT NULL,
      preferred_location VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating tenant_details table:', err);
    } else {
      console.log('Tenant details table created or already exists');
    }
  });

  // Create landlord_details table if not exists
  connection.query(`
    CREATE TABLE IF NOT EXISTS landlord_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      property_count INT NOT NULL,
      property_type VARCHAR(100) NOT NULL,
      business_name VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating landlord_details table:', err);
    } else {
      console.log('Landlord details table created or already exists');
    }
  });

  // Create custodian_details table if not exists
  connection.query(`
    CREATE TABLE IF NOT EXISTS custodian_details (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      experience INT NOT NULL,
      skills TEXT NOT NULL,
      availability VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating custodian_details table:', err);
    } else {
      console.log('Custodian details table created or already exists');
    }
  });

  // Create properties table if not exists
  connection.query(`
    CREATE TABLE IF NOT EXISTS properties (
      id INT AUTO_INCREMENT PRIMARY KEY,
      landlord_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      address VARCHAR(255) NOT NULL,
      city VARCHAR(100) NOT NULL,
      pincode VARCHAR(20) NOT NULL,
      property_type VARCHAR(100) NOT NULL,
      bedrooms INT NOT NULL,
      bathrooms INT NOT NULL,
      area DECIMAL(10, 2) NOT NULL,
      rent DECIMAL(10, 2) NOT NULL,
      is_available BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (landlord_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating properties table:', err);
    } else {
      console.log('Properties table created or already exists');
    }
  });
}

setupDatabase();

// Signup endpoint
app.post('/api/signup', async (req, res) => {
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

// Login endpoint - ADD THIS SECTION HERE
app.post('/api/login', async (req, res) => {
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

    // In a real app, you would generate a JWT token here
    // For simplicity, we're just returning user data
    res.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        userType: user.user_type
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

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
// In server.js
const authRoutes = require('./routes/auth')(connection);
app.use('/api', authRoutes);