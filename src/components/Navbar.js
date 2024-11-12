import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const Navbar = ({ projects, financialYears, onYearChange, onInvoiceProjectChange }) => {
  const { userRole, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    if (projectId) {
      navigate(`/project/${projectId}`);
      e.target.value = '';
    }
  };

  const handleYearChange = (e) => {
    const year = e.target.value;
    if (year) {
      onYearChange(year);
      navigate(`/financial-year-summary/${year}`);
      e.target.value = '';
    }
  };

  const handleInvoiceProjectChange = (e) => {
    const projectId = e.target.value;
    if (projectId) {
      onInvoiceProjectChange(projectId);
      navigate(`/invoice/${projectId}`);
      e.target.value = '';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-gray-700 to-gray-900 shadow-lg py-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Summary Link for All Roles */}
          <Link
            to="/summary"
            className="text-white px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-500 hover:from-blue-600 hover:to-indigo-600 font-semibold shadow-lg transform transition duration-200 hover:scale-105 text-[1rem]"
          >
            Summary
          </Link>

          {/* Project Selection Dropdown */}
          <select
            className="bg-gray-700 text-white px-3 py-1.5 rounded-lg font-semibold shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-transform duration-200 transform hover:scale-105 text-[0.9rem]"
            onChange={handleProjectChange}
            style={{ width: '12rem' }}
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id} className="text-white-800">
                {project.name}
              </option>
            ))}
          </select>

          {/* Financial Year Selection Dropdown */}
          <select
            className="bg-gray-700 text-white px-3 py-1.5 rounded-lg font-semibold shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-transform duration-200 transform hover:scale-105 text-[0.9rem]"
            onChange={handleYearChange}
            style={{ width: '12rem' }}
          >
            <option value="">Select a financial year</option>
            {financialYears.map((year) => (
              <option key={year.financial_year} value={year.financial_year} className="text-white-800">
                {year.financial_year}
              </option>
            ))}
          </select>

          {/* Invoice Project Selection Dropdown */}
          <select
            className="bg-gray-700 text-white px-3 py-1.5 rounded-lg font-semibold shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-transform duration-200 transform hover:scale-105 text-[0.9rem]"
            onChange={handleInvoiceProjectChange}
            style={{ width: '12rem' }}
          >
            <option value="">Invoice for a Project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id} className="text-white-800">
                {project.name}
              </option>
            ))}
          </select>

          {/* Add Project Link for Admin and PMO */}
          {(userRole === 'admin' || userRole === 'PMO') && (
            <Link
              to="/add-project"
              className="text-white px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 font-semibold shadow-lg transform transition duration-200 hover:scale-105 text-[1rem]"
            >
              Add Project
            </Link>
          )}

          {/* User List Link for Admin and PMO */}
          {(userRole === 'admin' || userRole === 'PMO') && (
            <Link
              to="/user-list"
              className="text-white px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 font-semibold shadow-lg transform transition duration-200 hover:scale-105 text-[1rem]"
            >
              User List
            </Link>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transform transition duration-200 hover:scale-105 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 text-[1rem]"
          style={{ minWidth: '6rem' }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
