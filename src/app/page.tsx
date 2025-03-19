'use client';
import { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState({
    host: 'localhost',
    port: '5432',
    username: '',
    password: '',
    database: ''
  });
  const [pingStatus, setPingStatus] = useState<'idle' | 'pinging' | 'success' | 'error'>('idle');
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([]);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [isLoadingDatabases, setIsLoadingDatabases] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [showConnectionDetails, setShowConnectionDetails] = useState(true);
  const [activeSection, setActiveSection] = useState<'databases' | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableRecords, setTableRecords] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<Array<{ column_name: string; data_type: string }>>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleConnect = async () => {
    if (!connectionDetails.host || !connectionDetails.port || !connectionDetails.username || !connectionDetails.password || !connectionDetails.database) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: connectionDetails.host,
          port: connectionDetails.port,
          user: connectionDetails.username,
          password: connectionDetails.password,
          database: connectionDetails.database
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsConnected(true);
        setShowConnectionDetails(false);
        setActiveSection('databases');
        toast.success(data.message);
        
        // Fetch databases after successful connection
        const dbResponse = await fetch('/api/databases');
        const dbData = await dbResponse.json();
        
        if (dbData.success) {
          setAvailableDatabases(dbData.databases);
          // Fetch tables for the selected database
          if (connectionDetails.database) {
            const tablesResponse = await fetch('/api/tables');
            const tablesData = await tablesResponse.json();
            if (tablesData.success) {
              setAvailableTables(tablesData.tables);
            }
          }
        } else {
          toast.error(dbData.message || 'Failed to fetch databases');
        }
      } else {
        setIsConnected(false);
        toast.error(data.message || 'Failed to connect');
      }
    } catch (error) {
      setIsConnected(false);
      toast.error('Failed to connect to server');
      console.error('Connection error:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/disconnect', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setIsConnected(false);
        setConnectionDetails({
          host: 'localhost',
          port: '5432',
          username: '',
          password: '',
          database: ''
        });
        setAvailableDatabases([]);
        toast.success('Disconnected successfully');
      } else {
        toast.error(data.message || 'Failed to disconnect');
      }
    } catch (error) {
      toast.error('Failed to disconnect');
      console.error('Disconnect error:', error);
    }
  };

  const handlePing = async () => {
    if (!connectionDetails.host || !connectionDetails.port || !connectionDetails.username || !connectionDetails.password || !connectionDetails.database) {
      toast.error('Please fill in all fields');
      return;
    }

    setPingStatus('pinging');

    try {
      const response = await fetch('/api/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: connectionDetails.host,
          port: connectionDetails.port,
          user: connectionDetails.username,
          password: connectionDetails.password,
          database: connectionDetails.database
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPingStatus('success');
        toast.success(data.message);
        setTimeout(() => setPingStatus('idle'), 2000);
      } else {
        setPingStatus('error');
        toast.error(data.message || 'Server is not reachable');
        setTimeout(() => setPingStatus('idle'), 2000);
      }
    } catch (error) {
      setPingStatus('error');
      toast.error('Failed to ping server');
      console.error('Ping error:', error);
      setTimeout(() => setPingStatus('idle'), 2000);
    }
  };

  const fetchAvailableDatabases = async () => {
    if (!isConnected) return;
    
    setIsLoadingDatabases(true);
    try {
      const response = await fetch('/api/databases');
      const data = await response.json();
      
      if (data.success) {
        setAvailableDatabases(data.databases);
        console.log("Fetched databases:", data.databases);
      } else {
        toast.error(data.message || 'Failed to fetch databases');
      }
    } catch (error) {
      console.error('Database fetch error:', error);
      toast.error('Failed to fetch databases');
    } finally {
      setIsLoadingDatabases(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConnectionDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDatabaseChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDatabase = e.target.value;
    setConnectionDetails(prev => ({
      ...prev,
      database: newDatabase
    }));

    if (isConnected && newDatabase) {
      try {
        // Reconnect with the new database
        const response = await fetch('/api/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            host: connectionDetails.host,
            port: connectionDetails.port,
            user: connectionDetails.username,
            password: connectionDetails.password,
            database: newDatabase
          }),
        });

        const data = await response.json();
        if (data.success) {
          toast.success('Connected to new database');
          // Fetch tables for the new database
          const tablesResponse = await fetch('/api/tables');
          const tablesData = await tablesResponse.json();
          if (tablesData.success) {
            setAvailableTables(tablesData.tables);
          }
        } else {
          setIsConnected(false);
          toast.error(data.message || 'Failed to connect to selected database');
        }
      } catch (error) {
        setIsConnected(false);
        console.error('Database change error:', error);
        toast.error('Failed to connect to selected database');
      }
    }
  };

  const handleTableSelect = async (tableName: string) => {
    setSelectedTable(tableName);
    setShowModal(true);
    setIsLoadingRecords(true);

    try {
      const response = await fetch('/api/table-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tableName }),
      });

      const data = await response.json();
      if (data.success) {
        setTableColumns(data.columns);
        setTableRecords(data.records);
      } else {
        toast.error(data.message || 'Failed to fetch table records');
      }
    } catch (error) {
      console.error('Error fetching table records:', error);
      toast.error('Failed to fetch table records');
    } finally {
      setIsLoadingRecords(false);
    }
  };

  return (
    <main className="flex h-screen bg-gray-50">
      <Toaster position="top-right" />
      {/* Left Panel - Server Connection */}
      <div className="w-1/2 border-r border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold mb-6 text-gray-800">EasySQL</h1>
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-medium text-gray-700">Connection Details</h2>
                {isConnected && (
                  <svg 
                    className="w-4 h-4 text-emerald-500" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isConnected && !showConnectionDetails && (
                  <button 
                    onClick={handleDisconnect}
                    className="p-1.5 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                    title="Disconnect"
                  >
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                )}
                <div 
                  className="cursor-pointer p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setShowConnectionDetails(!showConnectionDetails);
                    if (!showConnectionDetails) {
                      setActiveSection(null);
                    }
                  }}
                >
                  <svg 
                    className={`w-4 h-4 transform transition-transform ${showConnectionDetails ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className={`space-y-3 transition-all duration-300 ease-in-out ${showConnectionDetails ? 'mt-4' : 'h-0 overflow-hidden'}`}>
              <input
                type="text"
                name="host"
                placeholder="Host"
                value={connectionDetails.host}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-200 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                name="port"
                placeholder="Port (default: 5432)"
                value={connectionDetails.port}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-200 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                name="database"
                placeholder="Database Name"
                value={connectionDetails.database}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-200 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={connectionDetails.username}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-200 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={connectionDetails.password}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-200 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex gap-2">
                {!isConnected ? (
                  <>
                    <button 
                      onClick={handleConnect}
                      className="flex-1 p-2 rounded-md text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                    >
                      Connect
                    </button>
                    <button 
                      onClick={handlePing}
                      disabled={!connectionDetails.host || !connectionDetails.port || !connectionDetails.username || !connectionDetails.password || !connectionDetails.database || pingStatus === 'pinging'}
                      className={`flex-1 p-2 rounded-md text-white transition-colors ${
                        pingStatus === 'pinging' 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : pingStatus === 'success'
                          ? 'bg-emerald-500 hover:bg-emerald-600'
                          : pingStatus === 'error'
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-gray-500 hover:bg-gray-600'
                      }`}
                    >
                      {pingStatus === 'pinging' ? 'Pinging...' : 'Ping'}
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleConnect}
                      className="flex-1 p-2 rounded-md text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
                    >
                      Connected
                    </button>
                    <button 
                      onClick={handleDisconnect}
                      className="flex-1 p-2 rounded-md text-white bg-red-500 hover:bg-red-600 transition-colors"
                    >
                      Disconnect
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-medium text-gray-700">Database</h2>
                {isConnected && connectionDetails.database && (
                  <svg 
                    className="w-4 h-4 text-emerald-500" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="cursor-pointer p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setActiveSection(activeSection === 'databases' ? null : 'databases');
                    if (activeSection === null) {
                      setShowConnectionDetails(false);
                    }
                  }}
                >
                  <svg 
                    className={`w-4 h-4 transform transition-transform ${activeSection === 'databases' ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className={`space-y-4 transition-all duration-300 ease-in-out ${activeSection === 'databases' ? 'mt-4' : 'h-0 overflow-hidden'}`}>
              {isConnected ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Available Databases</h3>
                    {isLoadingDatabases ? (
                      <div className="text-gray-500 text-sm">Loading databases...</div>
                    ) : availableDatabases.length > 0 ? (
                      <div className="relative">
                        <select
                          value={connectionDetails.database}
                          onChange={handleDatabaseChange}
                          className="w-full p-2 border border-gray-200 rounded-md text-gray-700 bg-white appearance-none cursor-pointer pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select a database</option>
                          {availableDatabases.map((db) => (
                            <option key={db} value={db}>
                              {db}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">No databases found</div>
                    )}
                  </div>

                  {connectionDetails.database && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Available Tables</h3>
                      {isLoadingTables ? (
                        <div className="text-gray-500 text-sm">Loading tables...</div>
                      ) : availableTables.length > 0 ? (
                        <div className="max-h-[200px] overflow-y-auto border border-gray-200 rounded-md p-2">
                          <div className="flex flex-wrap gap-2">
                            {availableTables.map((table) => (
                              <div
                                key={table}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer max-w-[200px] truncate"
                                title={table}
                                onClick={() => handleTableSelect(table)}
                              >
                                {table}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm">No tables found in this database</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-sm text-center py-4">
                  Connect to a database to view available databases
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Chat Interface */}
      <div className="w-1/2 bg-white p-6 flex flex-col">
        <h1 className="text-xl font-medium mb-6 text-gray-800">Chat with your database</h1>
        <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4 overflow-y-auto">
          {/* Chat messages will go here */}
          <div className="text-gray-500 text-sm text-center">
            Start a conversation with your database
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type your SQL query..."
            className="flex-1 p-2 border border-gray-200 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
            Send
          </button>
        </div>
      </div>

      {/* Table Records Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white/95 rounded-lg shadow-xl w-[95%] max-w-6xl max-h-[90vh] overflow-hidden border-2 border-gray-300">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900">
                {selectedTable} - First 10 Records
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-4rem)]">
              {isLoadingRecords ? (
                <div className="text-center py-4">Loading records...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {tableColumns.map((column) => (
                          <th
                            key={column.column_name}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-b border-gray-200"
                          >
                            <div className="font-semibold">{column.column_name}</div>
                            <div className="text-xs text-gray-400">{column.data_type}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tableRecords.map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {tableColumns.map((column) => (
                            <td
                              key={column.column_name}
                              className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap border-b border-gray-100"
                            >
                              {JSON.stringify(record[column.column_name])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
