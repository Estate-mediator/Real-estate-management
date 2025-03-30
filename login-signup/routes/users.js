const express = require('express');
const router = express.Router();

module.exports = function(connection) {
  // Get user profile
  router.get('/profile/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const [users] = await connection.promise().query(
        'SELECT id, first_name, last_name, email, phone, address, city, pincode, user_type FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = users[0];
      let roleDetails = null;

      // Get role-specific details
      if (user.user_type === 'tenant') {
        const [details] = await connection.promise().query(
          'SELECT * FROM tenant_details WHERE user_id = ?',
          [userId]
        );
        if (details.length > 0) {
          roleDetails = details[0];
        }
      } else if (user.user_type === 'landlord') {
        const [details] = await connection.promise().query(
          'SELECT * FROM landlord_details WHERE user_id = ?',
          [userId]
        );
        if (details.length > 0) {
          roleDetails = details[0];
        }
      } else if (user.user_type === 'custodian') {
        const [details] = await connection.promise().query(
          'SELECT * FROM custodian_details WHERE user_id = ?',
          [userId]
        );
        if (details.length > 0) {
          roleDetails = details[0];
        }
      }

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
      console.error('Error fetching user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user profile'
      });
    }
  });

  // Update user profile
  router.put('/profile/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
      const {
        firstName, lastName, phone, address, city, pincode,
        occupation, budget, preferredLocation,
        propertyCount, propertyType, businessName,
        experience, skills, availability
      } = req.body;

      // Update user basic information
      await connection.promise().query(
        'UPDATE users SET first_name = ?, last_name = ?, phone = ?, address = ?, city = ?, pincode = ? WHERE id = ?',
        [firstName, lastName, phone, address, city, pincode, userId]
      );

      // Get user type
      const [users] = await connection.promise().query(
        'SELECT user_type FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userType = users[0].user_type;

      // Update role-specific information
      if (userType === 'tenant' && occupation && budget && preferredLocation) {
        await connection.promise().query(
          'UPDATE tenant_details SET occupation = ?, monthly_budget = ?, preferred_location = ? WHERE user_id = ?',
          [occupation, budget, preferredLocation, userId]
        );
      } else if (userType === 'landlord' && propertyCount && propertyType) {
        await connection.promise().query(
          'UPDATE landlord_details SET property_count = ?, property_type = ?, business_name = ? WHERE user_id = ?',
          [propertyCount, propertyType, businessName || '', userId]
        );
      } else if (userType === 'custodian' && experience && skills && availability) {
        await connection.promise().query(
          'UPDATE custodian_details SET experience = ?, skills = ?, availability = ? WHERE user_id = ?',
          [experience, skills, availability, userId]
        );
      }

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating profile'
      });
    }
  });

  // Delete user account
  router.delete('/profile/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;

      // Due to foreign key constraints with ON DELETE CASCADE,
      // deleting from the users table will automatically delete related records
      await connection.promise().query(
        'DELETE FROM users WHERE id = ?',
        [userId]
      );

      res.json({
        success: true,
        message: 'User account deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting user account:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting user account'
      });
    }
  });

  // Get all users (admin functionality)
  router.get('/all', async (req, res) => {
    try {
      const [users] = await connection.promise().query(
        'SELECT id, first_name, last_name, email, user_type, created_at FROM users'
      );

      res.json({
        success: true,
        users: users.map(user => ({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          userType: user.user_type,
          createdAt: user.created_at
        }))
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching users'
      });
    }
  });

  // Get users by type (admin functionality)
  router.get('/by-type/:userType', async (req, res) => {
    try {
      const userType = req.params.userType;
      
      if (!['tenant', 'landlord', 'custodian'].includes(userType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user type'
        });
      }

      const [users] = await connection.promise().query(
        'SELECT id, first_name, last_name, email, phone, city, created_at FROM users WHERE user_type = ?',
        [userType]
      );

      res.json({
        success: true,
        users: users.map(user => ({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phone: user.phone,
          city: user.city,
          createdAt: user.created_at
        }))
      });
    } catch (error) {
      console.error(`Error fetching ${req.params.userType} users:`, error);
      res.status(500).json({
        success: false,
        message: `Error fetching ${req.params.userType} users`
      });
    }
  });

  // Get user count statistics
  router.get('/stats', async (req, res) => {
    try {
      const [totalUsers] = await connection.promise().query(
        'SELECT COUNT(*) as count FROM users'
      );
      
      const [usersByType] = await connection.promise().query(
        'SELECT user_type, COUNT(*) as count FROM users GROUP BY user_type'
      );
      
      const [recentUsers] = await connection.promise().query(
        'SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
      );

      res.json({
        success: true,
        stats: {
          totalUsers: totalUsers[0].count,
          usersByType: usersByType.reduce((acc, curr) => {
            acc[curr.user_type] = curr.count;
            return acc;
          }, {}),
          recentUsers: recentUsers[0].count
        }
      });
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user statistics'
      });
    }
  });

  return router;
};