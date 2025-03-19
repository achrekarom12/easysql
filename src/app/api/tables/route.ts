import { NextResponse } from 'next/server';
import { getAvailableTables } from '@/lib/mysql';

export async function GET() {
  try {
    const result = await getAvailableTables();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error },
      { status: 500 }
    );
  }
}