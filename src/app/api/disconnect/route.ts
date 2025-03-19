import { NextResponse } from 'next/server';
import { closeConnection } from '@/lib/mysql';

export async function POST() {
  try {
    await closeConnection();
    return NextResponse.json({ success: true, message: 'Disconnected successfully' });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to disconnect', error: error },
      { status: 500 }
    );
  }
} 