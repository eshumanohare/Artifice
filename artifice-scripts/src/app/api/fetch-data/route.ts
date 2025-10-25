import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { updateOrders } from '@/lib/dataStore';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting manual data fetch...');

    // Execute Python script to get current block height and fetch orders
    const pythonScript = 'scripts/fetch_orders.py';
    const command = `python3 ${pythonScript} --start-block 50000000`;
    
    console.log(`🐍 Executing: ${command}`);
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 30000 // 30 second timeout
    });

    if (stderr) {
      console.log('Python stderr:', stderr);
    }

    // Parse JSON output from Python script
    const result = JSON.parse(stdout);
    
    if (result.orders && Array.isArray(result.orders)) {
      // Update data store with new orders
      updateOrders(result.orders);
      
      console.log(`✅ Manual fetch completed: fetched ${result.orders.length} orders`);
      
      return NextResponse.json({
        success: true,
        ordersFetched: result.orders.length,
        blockHeight: result.blockHeight,
        lastUpdate: result.lastUpdate,
        message: `Successfully fetched ${result.orders.length} orders`
      });
    } else {
      console.log('⚠️ No orders found in Python script output');
      return NextResponse.json({
        success: true,
        ordersFetched: 0,
        message: 'No orders found in the specified block range'
      });
    }

  } catch (error) {
    console.error('❌ Error in manual data fetch:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to fetch data. Check Python script and dependencies.'
    }, { status: 500 });
  }
}

// Handle GET requests for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Manual data fetch endpoint',
    method: 'POST',
    note: 'Send a POST request to trigger data fetching'
  });
}
