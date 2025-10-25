#!/usr/bin/env node
/**
 * Test script to verify Python fetch_orders.py works correctly
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function testPythonScript() {
  try {
    console.log('🧪 Testing Python fetch_orders.py script...');
    
    const command = 'python3 scripts/fetch_orders.py --blocks-back 10';
    console.log(`Executing: ${command}`);
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 30000
    });

    if (stderr) {
      console.log('Python stderr:', stderr);
    }

    const result = JSON.parse(stdout);
    
    console.log('✅ Python script executed successfully!');
    console.log(`📊 Results:`);
    console.log(`  - Orders found: ${result.count}`);
    console.log(`  - Block range: ${result.startBlock} to ${result.endBlock}`);
    console.log(`  - Last update: ${new Date(result.lastUpdate).toISOString()}`);
    
    if (result.orders && result.orders.length > 0) {
      console.log(`\n📋 Sample order:`);
      const sampleOrder = result.orders[0];
      console.log(`  - Side: ${sampleOrder.side}`);
      console.log(`  - Price: ${sampleOrder.price}¢`);
      console.log(`  - Volume: $${sampleOrder.volumeUsd}`);
      console.log(`  - Block: ${sampleOrder.blockNumber}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing Python script:', error.message);
    process.exit(1);
  }
}

testPythonScript();
