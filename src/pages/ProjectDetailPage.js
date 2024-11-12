import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DynamicTable from '../components/DynamicTable';

function ProjectDetailPage({ onDeleteProject }) {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`http://192.168.0.147:5000/projects/${projectId}`);
        setProject(response.data);
      } catch (error) {
        setError(error.response ? error.response.data.error : 'Error fetching project');
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center py-8 px-4">
      {error ? (
        <div className="text-red-700 font-semibold text-lg bg-red-100 p-6 rounded-md shadow-md max-w-lg w-full text-center">
          {error}
        </div>
      ) : project ? (
        <div className="w-full max-w-[90%] bg-white shadow-2xl rounded-lg p-8 md:p-12 h-full flex flex-col">
          <h2 className="text-4xl font-extrabold text-indigo-700 text-center mb-8">
            {project.name}
          </h2>
  
          {/* Project Start and End Dates Section */}
          <div className="flex justify-around items-center bg-indigo-50 p-6 rounded-md mb-8 shadow-inner">
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-600">Start Date</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Date(project.start_date).toLocaleDateString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-600">End Date</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Date(project.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>
  
          {/* Wider DynamicTable Container */}
          <div className="flex-grow w-full overflow-x-auto overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg mb-8">
            <DynamicTable
              projectId={project.id}
              projectStartDate={project.start_date}
              projectEndDate={project.end_date}
            />
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-lg">Loading project details...</p>
      )}
    </div>
  );
}

export default ProjectDetailPage;
