import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Support both local development and Netlify deployment
const getWhalesFile = () => {
  // Try local development first
  const localFile = path.join(process.cwd(), '.cache', 'whales.json');
  if (fs.existsSync(localFile)) {
    return localFile;
  }
  
  // Try Netlify temp directory
  const netlifyFile = '/tmp/.cache/whales.json';
  if (fs.existsSync(netlifyFile)) {
    return netlifyFile;
  }
  
  return null;
};

export async function GET(request: NextRequest) {
  try {
    console.log(`🐋 Reading whale data from persistent storage...`);
    
    const whalesFile = getWhalesFile();
    
    if (!whalesFile) {
      console.warn('⚠️ Whales file not found. Make sure Python stream is running.');
      return NextResponse.json({ 
        whales: [],
        message: 'Python stream not running. Start it with: python3 scripts/stream_orders.py'
      }, { status: 200 });
    }
    
    // Read file
    const fileContent = fs.readFileSync(whalesFile, 'utf-8');
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
