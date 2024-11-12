import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PageWrapper from './PageWrapper';

const AddUserPage = () => {
  const [newUser, setNewUser] = useState({ name: '', dept: '', emailid: '', password: '', role: '' });
  const [allowedRoles, setAllowedRoles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const userRole = localStorage.getItem('role');

    // Determine allowed roles based on the current user's role
    if (userRole === 'admin') {
      setAllowedRoles(['admin', 'PMO', 'manager', 'user']);
    } else if (userRole === 'PMO') {
      setAllowedRoles(['PMO', 'manager', 'user']);
    } else if (userRole === 'manager') {
      setAllowedRoles(['user']);
    } else {
      setAllowedRoles([]); // No permissions if role is unrecognized
    }
  }, []);

  const handleAddUser = async () => {
    try {
      await axios.post(
        'http://192.168.0.147:5000/add-user',
        newUser,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      navigate('/users');
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  return (
    <PageWrapper title="Add New User">
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-[#f5e3d8] to-[#f9f4f0]">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md border border-[#d1c2a7]">
          <h2 className="text-2xl font-semibold text-center text-[#8b6f47] mb-6">Add New User</h2>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Name" 
              value={newUser.name} 
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} 
              className="w-full p-3 border border-[#d1c2a7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8b6f47]"
            />
            <input 
              type="text" 
              placeholder="Department" 
              value={newUser.dept} 
              onChange={(e) => setNewUser({ ...newUser, dept: e.target.value })} 
              className="w-full p-3 border border-[#d1c2a7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8b6f47]"
            />
            <input 
              type="email" 
              placeholder="Email" 
              value={newUser.emailid} 
              onChange={(e) => setNewUser({ ...newUser, emailid: e.target.value })} 
              className="w-full p-3 border border-[#d1c2a7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8b6f47]"
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={newUser.password} 
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} 
              className="w-full p-3 border border-[#d1c2a7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8b6f47]"
            />
            <select 
              value={newUser.role} 
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} 
              className="w-full p-3 border border-[#d1c2a7] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8b6f47]"
            >
              <option value="">Select Role</option>
              {allowedRoles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
            <button 
              onClick={handleAddUser} 
              className="w-full bg-[#8b6f47] hover:bg-[#725c3b] text-white py-3 rounded-md font-medium transition duration-200 transform hover:scale-105"
            >
              Add User
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default AddUserPage;
