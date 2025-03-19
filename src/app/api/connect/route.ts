import { NextResponse } from 'next/server';
import { createConnection } from '@/lib/mysql';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { host, port, user, password, database } = body;

    if (!host || !port || !user || !password || !database) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await createConnection({ host, port, user, password, database });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error },
      { status: 500 }
    );
  }
} 