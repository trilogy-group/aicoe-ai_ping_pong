import React from 'react';
import { LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AuthButton: React.FC = () => {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-gray-400">
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <button
        onClick={login}
        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        <LogIn className="w-4 h-4" />
        <span>Sign in with Google</span>
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-300" />
          </div>
        )}
        <div className="text-sm">
          <div className="text-white">{user?.name}</div>
          <div className="text-gray-400 text-xs">{user?.email}</div>
        </div>
      </div>
      <button
        onClick={logout}
        className="flex items-center space-x-1 text-gray-400 hover:text-white px-2 py-1 rounded transition-colors"
        title="Sign out"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AuthButton;