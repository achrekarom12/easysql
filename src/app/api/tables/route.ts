import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/mysql';

export async function GET() {
  try {
    const connection = getConnection();
    if (!connection) {
      return NextResponse.json(
        { success: false, message: 'No active connection' },
        { status: 400 }
      );
    }

    // Query to get all tables in the public schema
    const query = `
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    
    const result = await connection.query(query);
    const tables = result.rows.map(row => row.tablename);

    return NextResponse.json({
      success: true,
      tables
    });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
} 