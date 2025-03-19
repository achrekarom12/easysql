import { Client } from 'pg';

interface ConnectionConfig {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
}

let pgClient: Client;

export async function createConnection(config: ConnectionConfig) {
  try {
    // If there's an existing connection, close it first
    if (pgClient) {
      await pgClient.end();
    }

    pgClient = new Client({
      host: config.host,
      port: parseInt(config.port),
      user: config.user,
      password: config.password,
      database: config.database
    });

    await pgClient.connect();
    const result = await pgClient.query('SELECT NOW();');
    console.log("Connection test result:", result.rows[0]);
    return { success: true, message: 'Connected to PostgreSQL successfully' };
  } catch (error) {
    console.error("Connection error:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to connect' 
    };
  }
}

export async function getAvailableDatabases() {
  if (!pgClient) {
    console.error("No active connection in getAvailableDatabases");
    return { success: false, message: 'No active connection' };
  }

  try {
    // Test the connection and reconnect if needed
    try {
      await pgClient.query('SELECT 1');
    } catch (error) {
      console.log("Connection lost, attempting to reconnect..." + error);
      await pgClient.connect();
    }
    
    const result = await pgClient.query(`
      SELECT datname 
      FROM pg_database 
      WHERE datistemplate = false 
      ORDER BY datname;
    `);
    
    console.log("Available Databases:", result.rows.map(row => row.datname));
    
    return { 
      success: true, 
      databases: result.rows.map(row => row.datname)
    };
  } catch (error) {
    console.error("Error fetching databases:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to fetch databases' 
    };
  }
}

export async function getAvailableTables() {
  if (!pgClient) {
    console.error("No active connection in getAvailableTables");
    return { success: false, message: 'No active connection' };
  }

  try {
    // Test the connection and reconnect if needed
    try {
      await pgClient.query('SELECT 1');
    } catch (error) {
      console.log("Connection lost, attempting to reconnect..." + error);
      await pgClient.connect();
    }

    const result = await pgClient.query(`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    
    console.log("Tables in the database:", result.rows.map(row => row.tablename));
    
    return { 
      success: true, 
      tables: result.rows.map(row => row.tablename)
    };
  } catch (error) {
    console.error("Error fetching tables:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to fetch tables' 
    };
  }
}

export async function pingServer(config: ConnectionConfig) {
  try {
    const testClient = new Client({
      host: config.host,
      port: parseInt(config.port),
      user: config.user,
      password: config.password,
      database: config.database,
      connectionTimeoutMillis: 5000,
    });

    await testClient.connect();
    await testClient.query('SELECT NOW();');
    await testClient.end();
    return { success: true, message: 'PostgreSQL server is reachable' };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Server is not reachable' 
    };
  }
}

export function getConnection() {
  return pgClient;
}

export async function closeConnection() {
  if (pgClient) {
    await pgClient.end();
    pgClient = new Client({});
  }
} 