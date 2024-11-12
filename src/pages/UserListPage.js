import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageWrapper from './PageWrapper'; // Adjust the path if necessary

const UserListPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('role');
    setUserRole(role);

    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://192.168.0.147:5000/users', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setUsers(response.data);
        setFilteredUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on role, department, and search query
  useEffect(() => {
    const filtered = users.filter(user => {
      const matchesRole = roleFilter ? user.role === roleFilter : true;
      const matchesDepartment = departmentFilter ? user.dept === departmentFilter : true;
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            user.emailid.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRole && matchesDepartment && matchesSearch;
    });
    setFilteredUsers(filtered);
  }, [roleFilter, departmentFilter, searchQuery, users]);

  const handleDeleteUser = async (userId) => {
    if (userRole !== 'admin' && userRole !== 'PMO') {
      alert('You do not have permission to delete users.');
      return;
    }

    const firstConfirmation = window.confirm('Are you sure you want to delete this user?');
    if (!firstConfirmation) return;

    const secondConfirmation = window.confirm('This action is irreversible. Are you absolutely sure?');
    if (!secondConfirmation) return;

    try {
      await axios.delete(`http://192.168.0.147:5000/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  return (
    <PageWrapper title="User List">
      <div className="container mx-auto p-8 bg-[#f9f4f0] min-h-screen">
        <h2 className="text-3xl font-bold text-center text-[#8b6f47] mb-10">User List</h2>

        {/* Filters Section */}
        <div className="mb-6 flex flex-wrap justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8b6f47]"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="PMO">PMO</option>
              <option value="manager">Manager</option>
              <option value="user">User</option>
            </select>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8b6f47]"
            >
              <option value="">All Departments</option>
              {[...new Set(users.map((user) => user.dept))].map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            {/* Search Filter */}
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8b6f47]"
            />
          </div>

          {/* Add User Button */}
          {(userRole === 'admin' || userRole === 'PMO') && (
            <button
              onClick={() => navigate('/add-user')}
              className="bg-[#8b6f47] hover:bg-[#725c3b] text-white py-2 px-4 rounded-md font-medium transition duration-200 transform hover:scale-105"
            >
              Add New User
            </button>
          )}
        </div>

        {/* User Table */}
        <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full bg-white rounded-lg">
            <thead>
              <tr className="bg-[#8b6f47] text-white text-left">
                <th className="py-4 px-6 font-semibold text-lg text-center">Name</th>
                <th className="py-4 px-6 font-semibold text-lg text-center">Department</th>
                <th className="py-4 px-6 font-semibold text-lg text-center">Email</th>
                <th className="py-4 px-6 font-semibold text-lg text-center">Role</th>
                {(userRole === 'admin' || userRole === 'PMO') && (
                  <th className="py-4 px-6 font-semibold text-lg text-center">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user.id} className={`text-center border-b transition-colors duration-150 ${index % 2 === 0 ? 'bg-gray-100' : 'bg-white'} hover:bg-[#f0e5da]`}>
                  <td className="py-4 px-6 text-gray-800 text-base">{user.name}</td>
                  <td className="py-4 px-6 text-gray-800 text-base">{user.dept}</td>
                  <td className="py-4 px-6 text-gray-800 text-base">{user.emailid}</td>
                  <td className="py-4 px-6 text-gray-800 text-base capitalize">{user.role}</td>
                  {(userRole === 'admin' || userRole === 'PMO') && (
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800 font-semibold bg-red-100 rounded-full px-3 py-1 transition-colors duration-150"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
};

export default UserListPage;
