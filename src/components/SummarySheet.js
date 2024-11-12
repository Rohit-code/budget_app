import React, { useEffect, useState } from 'react';
import axios from 'axios';

function SummarySheet() {
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axios.get('http://192.168.0.147:5000/project-summary');
        const summaryData = response.data.map(project => {
          const totalActualExpenses = project.expenses.reduce((sum, expense) => sum + parseFloat(expense.actual || 0), 0);
          const totalBudgetExpenses = project.expenses.reduce((sum, expense) => sum + parseFloat(expense.budget || 0), 0);
          const consumedActual = project.budget - totalActualExpenses;
          const consumedBudget = project.budget - totalBudgetExpenses;

          return {
            ...project,
            totalActual: totalActualExpenses,
            totalBudget: totalBudgetExpenses,
            consumedActual,
            consumedBudget,
          };
        });
        setSummary(summaryData);
      } catch (error) {
        console.error('Error fetching project summary:', error);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="p-8 bg-gradient-to-r from-teal-50 to-blue-50 min-h-screen">
      <h2 className="text-4xl font-extrabold text-teal-700 mb-10 text-center">Project Summary</h2>
      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full bg-white rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-teal-600 text-white text-sm uppercase tracking-wide">
              <th className="p-5 text-left font-semibold">Project Name</th>
              <th className="p-5 text-left font-semibold">Start Date</th>
              <th className="p-5 text-left font-semibold">End Date</th>
              <th className="p-5 text-left font-semibold">Total Budget</th>
              <th className="p-5 text-left font-semibold">Total Actual</th>
              <th className="p-5 text-left font-semibold">Remaining Actual</th>
              <th className="p-5 text-left font-semibold">Consumed Budget</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((project, index) => (
              <tr
                key={project.id}
                className={`hover:bg-teal-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
              >
                <td className="p-4 border-b border-gray-200 font-medium text-gray-800">{project.name}</td>
                <td className="p-4 border-b border-gray-200">{new Date(project.start_date).toLocaleDateString()}</td>
                <td className="p-4 border-b border-gray-200">{new Date(project.end_date).toLocaleDateString()}</td>
                <td className="p-4 border-b border-gray-200 text-blue-600 font-semibold">Rs.{project.totalBudget.toFixed(2)}</td>
                <td className="p-4 border-b border-gray-200 text-red-600 font-semibold">Rs.{project.totalActual.toFixed(2)}</td>
                <td className="p-4 border-b border-gray-200 text-green-600 font-semibold">Rs.{project.consumedActual.toFixed(2)}</td>
                <td className="p-4 border-b border-gray-200 text-orange-600 font-semibold">Rs.{project.consumedBudget.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SummarySheet;
