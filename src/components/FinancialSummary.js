import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FinancialSummary = ({ fiscalYear }) => {
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState({
    totalBudget: 0,
    actualExpenses: 0,
    savedBudget: 0,
  });

  useEffect(() => {
    const fetchProjects = async () => {
      if (fiscalYear) {
        try {
          const response = await axios.get(`http://192.168.0.147:5000/projects/financial-year/${fiscalYear}`);
          const projects = response.data;
          setProjects(projects);

          // Calculate the summary
          let totalBudget = 0;
          let actualExpenses = 0;

          projects.forEach(project => {
            totalBudget += parseFloat(project.budget);
            actualExpenses += parseFloat(project.expenses);
          });

          setSummary({
            totalBudget,
            actualExpenses,
            savedBudget: totalBudget - actualExpenses,
          });
        } catch (error) {
          console.error('Error fetching projects for fiscal year:', error);
        }
      }
    };

    fetchProjects();
  }, [fiscalYear]);

  return (
    <div className="p-8 bg-gradient-to-br from-white to-blue-50 min-h-screen">
      <h2 className="text-4xl font-extrabold text-gray-800 mb-10 text-center">
        {fiscalYear} Financial Summary
      </h2>
  
      {/* Summary Card */}
      <div className="bg-white shadow-lg rounded-lg p-8 mb-12 max-w-4xl mx-auto border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-6 bg-blue-50 rounded-lg shadow-md">
            <p className="text-xl font-semibold text-gray-700">Total Budget</p>
            <p className="text-3xl font-bold text-blue-600">${summary.totalBudget.toFixed(2)}</p>
          </div>
          <div className="p-6 bg-red-50 rounded-lg shadow-md">
            <p className="text-xl font-semibold text-gray-700">Actual Expenses</p>
            <p className="text-3xl font-bold text-red-600">${summary.actualExpenses.toFixed(2)}</p>
          </div>
          <div className="p-6 bg-green-50 rounded-lg shadow-md">
            <p className="text-xl font-semibold text-gray-700">Saved Budget</p>
            <p className="text-3xl font-bold text-green-600">${summary.savedBudget.toFixed(2)}</p>
          </div>
        </div>
      </div>
  
      <h3 className="text-3xl font-semibold text-gray-700 mb-8 text-center">Projects</h3>
      
      {/* Project List */}
      <ul className="space-y-6 max-w-4xl mx-auto">
        {projects.map((project) => (
          <li
            key={project.id}
            className="bg-white shadow-md rounded-lg p-6 border border-gray-100 transition-shadow duration-300 hover:shadow-xl"
          >
            <p className="text-xl font-semibold text-gray-800 mb-4">{project.name}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
                <p className="text-gray-600">Start Date:</p>
                <p className="text-lg font-medium text-gray-700">{new Date(project.start_date).toLocaleDateString()}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
                <p className="text-gray-600">End Date:</p>
                <p className="text-lg font-medium text-gray-700">{new Date(project.end_date).toLocaleDateString()}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg shadow-sm">
                <p className="text-gray-600">Budget:</p>
                <p className="text-lg font-medium text-blue-600">${project.budget.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg shadow-sm">
                <p className="text-gray-600">Expenses:</p>
                <p className="text-lg font-medium text-red-600">${project.expenses.toFixed(2)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );  
};

export default FinancialSummary;
