import React from 'react';
import ProjectForm from '../components/ProjectForm';
import PageWrapper from './PageWrapper';

function AddProjectPage({ onProjectAdded }) {
  return (
    <PageWrapper title="Budget Management System - Project Addition">
      <div className="w-full max-w-lg mx-auto bg-white shadow-2xl rounded-lg p-8 border border-[#d1c2a7]">
        <h2 className="text-3xl font-extrabold text-[#8b6f47] mb-6 text-center">
          Add New Project
        </h2>
        <ProjectForm onProjectAdded={onProjectAdded} />
      </div>
    </PageWrapper>
  );
}

export default AddProjectPage;
