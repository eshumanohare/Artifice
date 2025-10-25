import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const now = new Date();
  const timestamp = Date.now();
  
  return NextResponse.json({
    serverTime: now.toISOString(),
    serverTimeLocal: now.toLocaleString(),
    timestamp: timestamp,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    utcOffset: now.getTimezoneOffset(),
    currentHour: now.getHours(),
    currentMinute: now.getMinutes()
  });
}
