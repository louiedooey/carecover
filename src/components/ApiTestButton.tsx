import React, { useState } from 'react';
import { testInterfazeConnection } from '../utils/interfazeApi';

interface ApiTestButtonProps {
  className?: string;
}

const ApiTestButton: React.FC<ApiTestButtonProps> = ({ className = '' }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const isConnected = await testInterfazeConnection();
      setTestResult(isConnected ? '✅ API connection successful!' : '❌ API connection failed');
    } catch (error) {
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        onClick={handleTest}
        disabled={isTesting}
        className={`
          px-4 py-2 rounded-lg font-medium transition-colors
          ${isTesting
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
          }
        `}
      >
        {isTesting ? 'Testing...' : 'Test Interfaze API'}
      </button>
      
      {testResult && (
        <div className={`text-sm p-2 rounded ${
          testResult.includes('✅') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {testResult}
        </div>
      )}
    </div>
  );
};

export default ApiTestButton;
