import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PageWrapper from './PageWrapper'; // Adjust path as needed

function SummaryPage() {
  const [projects, setProjects] = useState([]);
  const [summaryData, setSummaryData] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('http://192.168.0.147:5000/projects');
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const summaries = await Promise.all(
          projects.map(async (project) => {
            const responseSummary = await axios.get(`http://192.168.0.147:5000/projects/${project.id}/summary`);
            const responseProject = await axios.get(`http://192.168.0.147:5000/projects/${project.id}`);

            return {
              projectId: project.id,
              projectName: project.name,
              start_date: formatDate(responseProject.data.start_date),
              end_date: formatDate(responseProject.data.end_date),
              summary: responseSummary.data,
            };
          })
        );
        setSummaryData(summaries);
      } catch (error) {
        console.error('Error fetching summary data:', error);
      }
    };

    if (projects.length > 0) {
      fetchSummaryData();
    }
  }, [projects]);

  return (
    <PageWrapper title="Project Budget Management System - Summary">
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-semibold text-teal-700 mb-6 text-center">Summary</h2>
        <div className="w-full max-w-6xl overflow-x-auto shadow-lg rounded-lg">
          <table className="min-w-full bg-white rounded-lg overflow-hidden text-center">
            <thead>
              <tr className="bg-teal-600 text-white">
                <th className="p-4 font-semibold border-b border-gray-200">Project Name</th>
                <th className="p-4 font-semibold border-b border-gray-200">Start Date</th>
                <th className="p-4 font-semibold border-b border-gray-200">End Date</th>
                <th className="p-4 font-semibold border-b border-gray-200">Total Budget</th>
                <th className="p-4 font-semibold border-b border-gray-200">Total Actual</th>
                <th className="p-4 font-semibold border-b border-gray-200">Remaining Actual</th>
                <th className="p-4 font-semibold border-b border-gray-200">Consumed Budget</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map((summary, index) => (
                <tr
                  key={summary.projectId}
                  className={`${index % 2 === 0 ? 'bg-gray-100' : 'bg-white'} text-gray-800`}
                >
                  <td className="p-4 border-b border-gray-200">{summary.projectName}</td>
                  <td className="p-4 border-b border-gray-200">{summary.start_date}</td>
                  <td className="p-4 border-b border-gray-200">{summary.end_date}</td>
                  <td className="p-4 border-b border-gray-200 text-blue-600 font-semibold">
                    Rs.{summary.summary.totalBudget}
                  </td>
                  <td className="p-4 border-b border-gray-200 text-red-600 font-semibold">
                    Rs.{summary.summary.consumedActual}
                  </td>
                  <td className="p-4 border-b border-gray-200 text-green-600 font-semibold">
                    Rs.{summary.summary.remainingActual}
                  </td>
                  <td className="p-4 border-b border-gray-200 text-orange-600 font-semibold">
                    Rs.{summary.summary.consumedBudget}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
}

export default SummaryPage;
