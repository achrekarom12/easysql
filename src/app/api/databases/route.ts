import { NextResponse } from 'next/server';
import { getAvailableDatabases, getConnection } from '@/lib/mysql';

export async function GET() {
  try {
    const client = getConnection();
    if (!client) {
      return NextResponse.json(
        { success: false, message: 'No active connection' },
        { status: 400 }
      );
    }

    const result = await getAvailableDatabases();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in databases route:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 