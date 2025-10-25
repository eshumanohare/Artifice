#!/usr/bin/env node

/**
 * Test script to verify Vercel cron setup
 * Run with: node test-vercel-setup.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const VERCEL_URL = process.env.VERCEL_URL || 'https://your-project.vercel.app';
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key-here';

console.log('🧪 Testing Vercel Cron Setup');
console.log('============================');
console.log(`URL: ${VERCEL_URL}`);
console.log(`Secret: ${CRON_SECRET.substring(0, 8)}...`);
console.log('');

// Test the cron function
function testCronFunction() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: VERCEL_URL.replace('https://', '').replace('http://', ''),
      port: 443,
      path: '/api/fetch_orders',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test the orders API
function testOrdersAPI() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: VERCEL_URL.replace('https://', '').replace('http://', ''),
      port: 443,
      path: '/api/orders',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  try {
    console.log('1️⃣ Testing Cron Function...');
    const cronResult = await testCronFunction();
    
    if (cronResult.status === 200) {
      console.log('✅ Cron function working');
      console.log(`   Response: ${JSON.stringify(cronResult.data, null, 2)}`);
    } else {
      console.log('❌ Cron function failed');
      console.log(`   Status: ${cronResult.status}`);
      console.log(`   Response: ${JSON.stringify(cronResult.data, null, 2)}`);
    }
    
    console.log('');
    
    console.log('2️⃣ Testing Orders API...');
    const ordersResult = await testOrdersAPI();
    
    if (ordersResult.status === 200) {
      console.log('✅ Orders API working');
      if (ordersResult.data.orders) {
        console.log(`   Orders count: ${ordersResult.data.orders.length}`);
        console.log(`   Last update: ${new Date(ordersResult.data.lastUpdate).toISOString()}`);
      }
    } else {
      console.log('❌ Orders API failed');
      console.log(`   Status: ${ordersResult.status}`);
      console.log(`   Response: ${JSON.stringify(ordersResult.data, null, 2)}`);
    }
    
    console.log('');
    console.log('🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Check if we have the required environment variables
if (!process.env.VERCEL_URL || !process.env.CRON_SECRET) {
  console.log('⚠️  Missing environment variables:');
  console.log('   VERCEL_URL - Your Vercel deployment URL');
  console.log('   CRON_SECRET - Your cron secret key');
  console.log('');
  console.log('Example:');
  console.log('   VERCEL_URL=https://your-project.vercel.app CRON_SECRET=your-secret node test-vercel-setup.js');
  process.exit(1);
}

runTests();
