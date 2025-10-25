import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Scripts API Debug Info",
    timestamp: new Date().toISOString(),
    currentTime: Date.now(),
    apiUrl: "https://artifice-scripts-mqvw5vcvl-eshumanohare-8126s-projects.vercel.app",
    endpoints: {
      orders: "/api/orders",
      whales: "/api/whales", 
      health: "/api/health",
      timeTest: "/api/time-test"
    },
    status: "✅ Working with fresh data"
  });
}
