import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/mysql';

export async function POST(request: Request) {
  try {
    const { tableName } = await request.json();

    if (!tableName) {
      return NextResponse.json(
        { success: false, message: 'Table name is required' },
        { status: 400 }
      );
    }

    const connection = getConnection();
    if (!connection) {
      return NextResponse.json(
        { success: false, message: 'No active connection' },
        { status: 400 }
      );
    }

    // Get column names
    const columnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `;
    const columnsResult = await connection.query(columnsQuery, [tableName]);
    const columns = columnsResult.rows;

    // Get first 10 records
    const recordsQuery = `SELECT * FROM "${tableName}" LIMIT 10`;
    const recordsResult = await connection.query(recordsQuery);
    const records = recordsResult.rows;

    return NextResponse.json({
      success: true,
      columns,
      records
    });
  } catch (error) {
    console.error('Error fetching table records:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch table records' },
      { status: 500 }
    );
  }
} 