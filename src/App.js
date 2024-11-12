// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import AddProjectPage from './pages/AddProjectPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import SummaryPage from './pages/SummaryPage';
import FinancialYearSummary from './pages/FinancialYearSummary';
import InvoicePage from './pages/InvoicePage';
import Navbar from './components/Navbar';
import AuthNavbar from './components/AuthNavbar';
import Login from './pages/Login';
import Register from './pages/Register';
import UserListPage from './pages/UserListPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './components/AuthContext';
import AddUserPage from './pages/AddUserPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

// Separate component for App content
function AppContent() {
  const [projects, setProjects] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedInvoiceProject, setSelectedInvoiceProject] = useState(null);
  const location = useLocation();

  // Check if the current route is an auth page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

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

  useEffect(() => {
    const fetchFinancialYears = async () => {
      try {
        const response = await axios.get('http://192.168.0.147:5000/financial-years');
        setFinancialYears(response.data);
      } catch (error) {
        console.error('Error fetching financial years:', error);
      }
    };
    fetchFinancialYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      const fetchProjectsForYear = async () => {
        try {
          const response = await axios.get(`http://192.168.0.147:5000/projects?year=${selectedYear}`);
          console.log('Fetched projects for year:', response.data);
          setProjects(response.data);
        } catch (error) {
          console.error('Error fetching projects for the selected year:', error);
        }
      };
      fetchProjectsForYear();
    }
  }, [selectedYear]);

  const handleProjectAdded = (newProject) => {
    setProjects((prevProjects) => [...prevProjects, newProject]);
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await axios.delete(`http://192.168.0.147:5000/projects/${projectId}`);
      setProjects((prevProjects) => prevProjects.filter((project) => project.id !== projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  const handleInvoiceProjectChange = (projectId) => {
    setSelectedInvoiceProject(projectId);
  };

  return (
    <div className="App">
      {/* Render AuthNavbar on login and register pages; Navbar on other pages */}
      {isAuthPage ? (
        <AuthNavbar />
      ) : (
        <Navbar
          projects={projects}
          financialYears={financialYears}
          onYearChange={handleYearChange}
          onInvoiceProjectChange={handleInvoiceProjectChange}
        />
      )}
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/add-project" element={<ProtectedRoute><AddProjectPage onProjectAdded={handleProjectAdded} /></ProtectedRoute>} />
        <Route path="/summary" element={<ProtectedRoute><SummaryPage /></ProtectedRoute>} />
        <Route path="/project/:projectId" element={<ProtectedRoute><ProjectDetailPage onDeleteProject={handleDeleteProject} /></ProtectedRoute>} />
        <Route path="/financial-year-summary/:year" element={<ProtectedRoute><FinancialYearSummary selectedYear={selectedYear} /></ProtectedRoute>} />
        <Route path="/invoice/:projectId" element={<ProtectedRoute><InvoicePage projectId={selectedInvoiceProject} /></ProtectedRoute>} />
        <Route path="/user-list" element={<ProtectedRoute><UserListPage /></ProtectedRoute>} />
        <Route path = "/add-user" element={<ProtectedRoute><AddUserPage/></ProtectedRoute>}/>

        {/* Redirect to summary if route does not match */}
        <Route path="*" element={<Navigate to="/summary" />} />
      </Routes>
    </div>
  );
}

export default App;
