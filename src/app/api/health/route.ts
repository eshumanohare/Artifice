import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Artifice Main Webapp is running',
    timestamp: new Date().toISOString(),
    scriptsApiUrl: process.env.NEXT_PUBLIC_SCRIPTS_API_URL || 'https://artifice-scripts-pfordniji-eshumanohare-8126s-projects.vercel.app'
  });
}
