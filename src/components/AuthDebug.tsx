import React from 'react';
import { useAuth } from '../hooks/useAuth';

const AuthDebug: React.FC = () => {
  const { user, isLoading, isAuthenticated, refetch } = useAuth();

  const testAuthEndpoint = async () => {
    try {
      const response = await fetch('/auth/user', {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      console.log('Direct auth test:', { response: response.status, data });
      alert(`Auth test: ${response.status} - ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Auth test error:', error);
      alert(`Auth test error: ${error}`);
    }
  };

  return (
    <div className="fixed top-20 right-4 bg-gray-900 border border-gray-600 rounded p-4 text-sm z-50 max-w-xs">
      <h3 className="text-white font-bold mb-2">Auth Debug</h3>
      <div className="text-gray-300 space-y-1">
        <div>Loading: <span className={isLoading ? 'text-yellow-400' : 'text-green-400'}>{isLoading.toString()}</span></div>
        <div>Authenticated: <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>{isAuthenticated.toString()}</span></div>
        <div>User: <span className="text-blue-400">{user ? user.name : 'null'}</span></div>
        <div>Email: <span className="text-blue-400">{user ? user.email : 'null'}</span></div>
      </div>
      <div className="mt-3 space-y-1">
        <button
          onClick={refetch}
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
        >
          Refresh Auth
        </button>
        <button
          onClick={testAuthEndpoint}
          className="block w-full bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
        >
          Test Auth API
        </button>
      </div>
    </div>
  );
};

export default AuthDebug;