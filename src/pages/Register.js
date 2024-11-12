// src/pages/Register.js
import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../components/AuthContext';
import PageWrapper from './PageWrapper';

const Register = () => {
  const [name, setName] = useState('');
  const [dept, setDept] = useState('');
  const [emailid, setEmailId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // Default role is 'user'
  const { userRole } = useContext(AuthContext); // Get the current user's role from AuthContext
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 9 || !/[!@#$%^&*(),.?":{}|<>]/g.test(password)) {
      alert('Password must be at least 9 characters long and contain one special character');
      return;
    }
    try {
      const requestData = {
        name,
        dept,
        emailid,
        password,
        role: userRole === 'admin' ? role : 'user', // Force 'user' role for non-admin users
      };
      await axios.post('http://192.168.0.147:5000/register', requestData);
      navigate('/login');
    } catch (error) {
      console.error('Error registering:', error);
      alert('Error registering');
    }
  };

  return (
    <PageWrapper title="Register">
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-3xl font-bold mb-6 text-center text-indigo-700">Register</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-700 placeholder-gray-400
                       focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition duration-200"
            placeholder="Enter your name"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">Department</label>
          <input
            type="text"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-700 placeholder-gray-400
                       focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition duration-200"
            placeholder="Enter your department"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
          <input
            type="email"
            value={emailid}
            onChange={(e) => setEmailId(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-700 placeholder-gray-400
                       focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition duration-200"
            placeholder="Enter your email"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-semibold mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-700 placeholder-gray-400
                       focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition duration-200"
            placeholder="Enter your password"
          />
        </div>
        
        {userRole === 'admin' && ( // Show the role selection only if the current user is an admin
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-semibold mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white
                         focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition duration-200"
            >
              <option value="admin">Admin</option>
              <option value="PMO">PMO</option>
              <option value="manager">Manager</option>
              <option value="user">User</option>
            </select>
          </div>
        )}
        
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 
                     focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 transition duration-200"
        >
          Register
        </button>
      </form>
    </PageWrapper>
  );
};

export default Register;
