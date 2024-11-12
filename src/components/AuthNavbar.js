import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AuthNavbar = () => {
  const location = useLocation();

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold tracking-wide hover:text-gray-200 transition duration-300">
          Budget Management
        </h1>
        <div className="flex items-center space-x-4">
          {/* Conditionally render Login link */}
          {location.pathname !== '/login' && (
            <Link
              to="/login"
              className="text-white px-5 py-2 rounded-lg font-medium transition-all duration-300 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-teal-600 hover:to-blue-600 shadow-md"
            >
              Login
            </Link>
          )}
          {/* Conditionally render Register link */}
          {location.pathname !== '/register' && (
            <Link
              to="/register"
              className="text-white px-5 py-2 rounded-lg font-medium transition-all duration-300 bg-gradient-to-r from-green-500 to-lime-500 hover:from-lime-600 hover:to-green-600 shadow-md"
            >
              Register
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AuthNavbar;
