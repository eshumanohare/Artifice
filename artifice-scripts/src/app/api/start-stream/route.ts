import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

let streamProcess: any = null;

export async function POST(request: NextRequest) {
  try {
    // Check if stream is already running
    if (streamProcess && !streamProcess.killed) {
      return NextResponse.json({
        success: true,
        message: 'Stream is already running',
        status: 'running'
      });
    }

    console.log('🚀 Starting Python stream process...');
    
    // Start the Python stream process
    const scriptPath = path.join(process.cwd(), 'scripts', 'stream_orders.py');
    
    streamProcess = spawn('python3', [scriptPath], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    streamProcess.stdout.on('data', (data: Buffer) => {
      console.log(`Python stdout: ${data}`);
    });

    streamProcess.stderr.on('data', (data: Buffer) => {
      console.error(`Python stderr: ${data}`);
    });

    streamProcess.on('close', (code: number) => {
      console.log(`Python stream process exited with code ${code}`);
      streamProcess = null;
    });

    streamProcess.on('error', (error: Error) => {
      console.error(`Python stream process error: ${error}`);
      streamProcess = null;
    });

    return NextResponse.json({
      success: true,
      message: 'Python stream started successfully',
      status: 'started',
      pid: streamProcess.pid
    });

  } catch (error: any) {
    console.error('❌ Error starting stream:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to start stream',
      message: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    status: streamProcess && !streamProcess.killed ? 'running' : 'stopped',
    pid: streamProcess?.pid || null
  });
}

export async function DELETE(request: NextRequest) {
  try {
    if (streamProcess && !streamProcess.killed) {
      streamProcess.kill();
      streamProcess = null;
      return NextResponse.json({
        success: true,
        message: 'Stream stopped successfully'
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'Stream was not running'
      });
    }
  } catch (error: any) {
    console.error('❌ Error stopping stream:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to stop stream',
      message: error.message
    }, { status: 500 });
  }
}
