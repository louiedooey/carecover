import React, { useState } from 'react';
import Logo from './Logo';

interface PasswordScreenProps {
  onAuthenticate: () => void;
}

const PasswordScreen: React.FC<PasswordScreenProps> = ({ onAuthenticate }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'woohoo') {
      onAuthenticate();
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <Logo size="lg" className="mx-auto mb-4" />
        </div>

        {/* CareCover Heading */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          CareCover
        </h1>

        {/* Caption */}
        <p className="text-gray-600 mb-8 text-lg">
          A platform to help you navigate healthcare expenses and treatment
        </p>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Enter password for access:
            </label>
            <input
              type="text"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter password"
              autoComplete="off"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Access CareCover
          </button>
        </form>

        {/* Tokens are expensive note */}
        <p className="mt-6 text-sm text-gray-500 italic">
          (Tokens are expensive!)
        </p>
      </div>
    </div>
  );
};

export default PasswordScreen;
