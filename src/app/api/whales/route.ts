import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const WHALES_FILE = path.join(process.cwd(), '.cache', 'whales.json');

export async function GET(request: NextRequest) {
  try {
    console.log(`🐋 Reading whale data from persistent storage...`);
    
    // Check if file exists
    if (!fs.existsSync(WHALES_FILE)) {
      console.warn('⚠️ Whales file not found. Make sure Python stream is running.');
      return NextResponse.json({ 
        whales: [],
        message: 'Python stream not running. Start it with: python3 scripts/stream_orders.py'
      }, { status: 200 });
    }
    
    // Read file
    const fileContent = fs.readFileSync(WHALES_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    
    console.log(`✅ Loaded ${data.whales?.length || 0} whales from file (last update: ${new Date(data.lastUpdate).toLocaleString()})`);
    
    // Return all whales (they're already sorted by timestamp desc)
    const whales = data.whales || [];
    
    return NextResponse.json({ 
      whales,
      lastUpdate: data.lastUpdate,
      totalWhales: whales.length
    });
  } catch (error) {
    console.error('❌ Error reading whales file:', error);
    return NextResponse.json({ 
      whales: [],
      error: 'Failed to read whales. Make sure Python stream is running.'
    }, { status: 200 });
  }
}
