import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'react-datepicker/dist/react-datepicker.css';

function ProjectForm({ onProjectAdded }) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [orderValue, setOrderValue] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !startDate || !endDate || !budget || !orderValue) {
      setError('All fields are required.');
      return;
    }

    setError('');
    setSuccessMessage('');

    try {
      const response = await axios.post('http://192.168.0.147:5000/projects', {
        name,
        start_date: startDate,
        end_date: endDate,
        budget: parseFloat(budget),
        order_value: parseFloat(orderValue),
      });

      onProjectAdded(response.data);
      setName('');
      setStartDate('');
      setEndDate('');
      setBudget('');
      setOrderValue('');

      setSuccessMessage('✔ Project added successfully!');
      setTimeout(() => {
        setSuccessMessage('');
        navigate('/summary'); // Navigate to /summary after success
      }, 3000); // Show message for 3 seconds before navigating
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto bg-white shadow-md rounded-lg p-8">
      <h2 className="text-2xl font-bold text-teal-600 text-center mb-6">Add New Project</h2>
      
      {successMessage && (
        <div className="bg-green-100 text-green-700 font-semibold p-3 rounded-lg text-center mb-4 shadow-sm">
          {successMessage}
        </div>
      )}

      <div>
        <label className="block text-gray-700 font-semibold mb-2">Project Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Enter project name"
        />
      </div>
      <div>
        <label className="block text-gray-700 font-semibold mb-2">Start Date:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      <div>
        <label className="block text-gray-700 font-semibold mb-2">End Date:</label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      <div>
        <label className="block text-gray-700 font-semibold mb-2">Budget:</label>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Enter budget amount"
        />
      </div>
      <div>
        <label className="block text-gray-700 font-semibold mb-2">Order Value:</label>
        <input
          type="number"
          value={orderValue}
          onChange={(e) => setOrderValue(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Enter order value"
        />
      </div>

      {error && <div className="text-red-500 font-semibold text-center mt-4">{error}</div>}
      
      <button
        type="submit"
        className="w-full py-3 mt-4 text-white font-semibold rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
      >
        Add Project
      </button>
    </form>
  );
}

export default ProjectForm;
