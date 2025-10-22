import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Support both local development and Netlify deployment
const getOrdersFile = () => {
  // Try local development first
  const localFile = path.join(process.cwd(), '.cache', 'live_orders.json');
  if (fs.existsSync(localFile)) {
    return localFile;
  }
  
  // Try Netlify temp directory
  const netlifyFile = '/tmp/.cache/live_orders.json';
  if (fs.existsSync(netlifyFile)) {
    return netlifyFile;
  }
  
  return null;
};

export async function GET(request: NextRequest) {
  try {
    console.log(`🔍 Reading live orders...`);
    
    const ordersFile = getOrdersFile();
    
    if (!ordersFile) {
      console.warn('⚠️ Orders file not found. Make sure Python stream is running.');
      return NextResponse.json({ 
        orders: [],
        message: 'Python stream not running. Start it with: python3 scripts/stream_orders.py'
      }, { status: 200 });
    }
    
    // Read file
    const fileContent = fs.readFileSync(ordersFile, 'utf-8');
    const data = JSON.parse(fileContent);
    
    console.log(`✅ Loaded ${data.orders?.length || 0} orders from file (last update: ${new Date(data.lastUpdate).toLocaleString()})`);
    
    // Return top 10 orders
    const orders = data.orders?.slice(0, 10) || [];
    
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

