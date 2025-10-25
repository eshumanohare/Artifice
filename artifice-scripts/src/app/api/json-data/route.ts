import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Return the raw JSON data that the main webapp should be fetching
  const response = await fetch(`${process.env.VERCEL_URL || 'https://artifice-scripts-mqvw5vcvl-eshumanohare-8126s-projects.vercel.app'}/api/orders`);
  const data = await response.json();
  
  return NextResponse.json({
    message: "Raw JSON data that main webapp fetches",
    timestamp: new Date().toISOString(),
    data: data,
    note: "This is exactly what the main webapp receives when it fetches /api/orders"
  });
}
