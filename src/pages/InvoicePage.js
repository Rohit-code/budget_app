import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import InvoiceTable from '../components/InvoiceTable';
import PageWrapper from './PageWrapper'; // Adjust the path if necessary

const InvoicePage = ({ projectId }) => {
  const { projectId: urlProjectId } = useParams();
  const [project, setProject] = useState(null);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`http://192.168.0.147:5000/projects/${projectId || urlProjectId}`);
        setProject(response.data);
      } catch (error) {
        console.error('Error fetching project:', error);
      }
    };

    const fetchInvoices = async () => {
      try {
        const response = await axios.get(`http://192.168.0.147:5000/invoices?projectId=${projectId || urlProjectId}`);
        setInvoices(response.data);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      }
    };

    fetchProject();
    fetchInvoices();
  }, [projectId, urlProjectId]);

  if (!project) {
    return <div className="text-center py-10 text-gray-500">Project details not available.</div>;
  }

  return (
    <PageWrapper title={`Project Budget Management System - Invoices`}>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6 text-center">
          {project.name} - Invoices
        </h1>
        <InvoiceTable
          projectId={project.id}
          projectStartDate={project.start_date}
          projectEndDate={project.end_date}
          invoiceActual={invoices.reduce((acc, invoice) => ({ ...acc, [invoice.month]: invoice.amount }), {})}
          onInvoiceBudgetSave={() => {}}
        />
      </div>
    </PageWrapper>
  );
};

export default InvoicePage;
