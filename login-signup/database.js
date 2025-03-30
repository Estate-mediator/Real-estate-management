const mysql = require('mysql2');

/**
 * Database connection and configuration module
 */
class Database {
  constructor(config) {
    this.config = config;
    this.connection = null;
  }

  /**
   * Establish connection to the MySQL database
   */
  connect() {
    this.connection = mysql.createConnection(this.config);
    
    return new Promise((resolve, reject) => {
      this.connection.connect(err => {
        if (err) {
          console.error('Error connecting to database:', err);
          reject(err);
          return;
        }
        console.log('Connected to MySQL database');
        resolve();
      });
    });
  }

  /**
   * Initialize database tables
   */
  async initDatabase() {
    try {
      await this.createUsersTable();
      await this.createTenantDetailsTable();
      await this.createLandlordDetailsTable();
      await this.createCustodianDetailsTable();
      await this.createPropertiesTable();
      console.log('All database tables initialized successfully');
      return true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      return false;
    }
  }

  /**
   * Create users table
   */
  createUsersTable() {
    return new Promise((resolve, reject) => {
      this.connection.query(`
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
          reject(err);
        } else {
          console.log('Users table created or already exists');
          resolve();
        }
      });
    });
  }

  /**
   * Create tenant_details table
   */
  createTenantDetailsTable() {
    return new Promise((resolve, reject) => {
      this.connection.query(`
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
          reject(err);
        } else {
          console.log('Tenant details table created or already exists');
          resolve();
        }
      });
    });
  }

  /**
   * Create landlord_details table
   */
  createLandlordDetailsTable() {
    return new Promise((resolve, reject) => {
      this.connection.query(`
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
          reject(err);
        } else {
          console.log('Landlord details table created or already exists');
          resolve();
        }
      });
    });
  }

  /**
   * Create custodian_details table
   */
  createCustodianDetailsTable() {
    return new Promise((resolve, reject) => {
      this.connection.query(`
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
          reject(err);
        } else {
          console.log('Custodian details table created or already exists');
          resolve();
        }
      });
    });
  }

  /**
   * Create properties table
   */
  createPropertiesTable() {
    return new Promise((resolve, reject) => {
      this.connection.query(`
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
          reject(err);
        } else {
          console.log('Properties table created or already exists');
          resolve();
        }
      });
    });
  }

  /**
   * Get database connection
   */
  getConnection() {
    return this.connection;
  }

  /**
   * Close database connection
   */
  close() {
    if (this.connection) {
      return new Promise((resolve, reject) => {
        this.connection.end(err => {
          if (err) {
            console.error('Error closing database connection:', err);
            reject(err);
            return;
          }
          console.log('Database connection closed');
          resolve();
        });
      });
    }
    return Promise.resolve();
  }
}

module.exports = Database;