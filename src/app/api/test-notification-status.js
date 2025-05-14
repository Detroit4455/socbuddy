/**
 * Test utility to check notification settings status
 * Run with: node src/app/api/test-notification-status.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Setting = require('../../../models/Setting');

const NOTIFICATION_SETTING_KEY = "habit_notifications_enabled";

async function checkNotificationStatus() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database.');
    
    // Get current notification setting
    const notificationSetting = await Setting.findOne({ key: NOTIFICATION_SETTING_KEY });
    
    console.log('\n======= NOTIFICATION SETTINGS STATUS =======');
    if (!notificationSetting) {
      console.log('No notification setting found in database');
      console.log('Default behavior: Notifications ENABLED');
    } else {
      console.log('Setting found:');
      console.log('- Key:', notificationSetting.key);
      console.log('- Value:', notificationSetting.value);
      console.log('- Value type:', typeof notificationSetting.value);
      console.log('- Description:', notificationSetting.description);
      console.log('- Category:', notificationSetting.category);
      console.log('- Last updated:', notificationSetting.updatedAt);
      
      // Check if notifications are enabled using the same logic as the habit tracking endpoint
      const notificationsEnabled = 
        notificationSetting.value === true || 
        notificationSetting.value === "true" || 
        notificationSetting.value === 1;
      
      console.log('\nNotifications are currently:', notificationsEnabled ? 'ENABLED' : 'DISABLED');
      
      if (typeof notificationSetting.value !== 'boolean') {
        console.log('\n⚠️ WARNING: Value is not stored as a boolean!');
        console.log('This could cause inconsistent behavior.');
        console.log('Consider updating the setting with a proper boolean value.');
      }
    }
    console.log('============================================\n');
    
  } catch (error) {
    console.error('Error checking notification status:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

// Run the check
checkNotificationStatus(); 