import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ORDERS_FILE = path.join(process.cwd(), '.cache', 'live_orders.json');

export async function GET(request: NextRequest) {
  try {
    console.log(`🔍 Reading live orders from Python stream...`);
    
    // Check if file exists
    if (!fs.existsSync(ORDERS_FILE)) {
      console.warn('⚠️ Orders file not found. Make sure Python stream is running.');
      return NextResponse.json({ 
        orders: [],
        message: 'Python stream not running. Start it with: python3 scripts/stream_orders.py'
      }, { status: 200 });
    }
    
    // Read file
    const fileContent = fs.readFileSync(ORDERS_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    
    console.log(`✅ Loaded ${data.orders?.length || 0} orders from file (last update: ${new Date(data.lastUpdate).toLocaleString()})`);
    
    // Return top 20 orders
    const orders = data.orders?.slice(0, 20) || [];
    
    return NextResponse.json({ 
      orders,
      lastUpdate: data.lastUpdate,
      blockHeight: data.blockHeight
    });
  } catch (error) {
    console.error('❌ Error reading orders file:', error);
    return NextResponse.json({ 
      orders: [],
      error: 'Failed to read orders. Make sure Python stream is running.'
    }, { status: 200 });
  }
}

