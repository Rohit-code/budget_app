import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../components/AuthContext';

const generateMonthsArray = (start, end) => {
  const months = [];
  const startDate = new Date(start);
  const endDate = new Date(end);

  let currentDate = startDate;
  while (currentDate <= endDate) {
    const monthYear = currentDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    months.push(monthYear);
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return months;
};

const InvoiceTable = ({ projectId, projectStartDate, projectEndDate, onInvoiceBudgetSave }) => {
  const { userRole } = useContext(AuthContext);
  const [localInvoiceBudget, setLocalInvoiceBudget] = useState({});
  const [invoiceActual, setInvoiceActual] = useState({});
  const [months, setMonths] = useState(generateMonthsArray(projectStartDate, projectEndDate));
  const [isEditing, setIsEditing] = useState(false);
  const [initialOrderValue, setInitialOrderValue] = useState(0);
  const [originalInvoiceBudget, setOriginalInvoiceBudget] = useState({});
  const [originalInvoiceActual, setOriginalInvoiceActual] = useState({});
  const [totalBudget, setTotalBudget] = useState(0);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const projectResponse = await axios.get(`http://192.168.0.147:5000/projects/${projectId}`);
        const projectData = projectResponse.data;
        setInitialOrderValue(parseFloat(projectData.order_value) || 0);
        const initialBudget = parseFloat(projectData.budget) || 0;
        setTotalBudget(initialBudget);

        const invoiceResponse = await axios.get(`http://192.168.0.147:5000/projects/${projectId}/invoices`);
        const invoiceData = invoiceResponse.data[0] || {};

        setOriginalInvoiceBudget(invoiceData.invoice_budget || {});
        setOriginalInvoiceActual(invoiceData.invoice_actual || {});

        setLocalInvoiceBudget(invoiceData.invoice_budget || {});
        setInvoiceActual(invoiceData.invoice_actual || {});

        setTotalBudget(initialBudget - Object.values(invoiceData.invoice_budget || {}).reduce((a, b) => a + b, 0));
      } catch (error) {
        console.error('Error fetching project or invoice data:', error);
      }
    };

    fetchProjectData();
  }, [projectId]);

  const handleBudgetChange = (month, value) => {
    const newBudgetValue = parseFloat(value) || 0;
    const currentMonthBudget = localInvoiceBudget[month] || 0;

    const newTotalBudget = totalBudget + currentMonthBudget - newBudgetValue;

    if (newTotalBudget >= 0) {
      setLocalInvoiceBudget(prev => ({
        ...prev,
        [month]: newBudgetValue,
      }));
      setTotalBudget(newTotalBudget);
    } else {
      alert('Total budget exceeded!');
    }
  };

  const handleActualChange = (month, value) => {
    setInvoiceActual(prev => ({
      ...prev,
      [month]: parseFloat(value) || 0,
    }));
  };

  const handleSave = async () => {
    try {
      await axios.post(`http://192.168.0.147:5000/projects/${projectId}/invoices`, {
        invoiceBudget: localInvoiceBudget,
        invoiceActual,
      });
      onInvoiceBudgetSave(localInvoiceBudget);
      setIsEditing(false);
      alert('Invoice budget and actual saved successfully!');
    } catch (error) {
      console.error('Error saving invoice budget and actual:', error);
      alert('Error saving invoice budget and actual.');
    }
  };

  const handleCancel = () => {
    setLocalInvoiceBudget(originalInvoiceBudget);
    setInvoiceActual(originalInvoiceActual);
    setIsEditing(false);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-white shadow-lg rounded-lg max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Invoice Budgets</h2>
        <div className="text-right">
          <p className="text-gray-600">Order Value: <span className="text-gray-800 font-semibold">Rs. {initialOrderValue.toFixed(2)}</span></p>
          <p className="text-gray-600">Total Remaining Budget: <span className="text-green-600 font-semibold">Rs. {totalBudget.toFixed(2)}</span></p>
        </div>
      </div>
      <table className="w-full bg-white rounded-lg shadow border border-gray-200">
        <thead>
          <tr className="bg-indigo-600 text-white">
            <th className="py-4 px-5 font-semibold text-center">Month</th>
            <th className="py-4 px-5 font-semibold text-center">Invoice Budget</th>
            <th className="py-4 px-5 font-semibold text-center">Invoice Actual</th>
          </tr>
        </thead>
        <tbody>
          {months.map((month) => (
            <tr key={month} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-5 text-gray-800 font-medium">{month}</td>
              <td className="py-3 px-5">
                {isEditing ? (
                  <input
                    type="number"
                    value={localInvoiceBudget[month] || 0}
                    onChange={(e) => handleBudgetChange(month, e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                ) : (
                  <span className="text-blue-600 font-medium">{localInvoiceBudget[month] || 0}</span>
                )}
              </td>
              <td className="py-3 px-5">
                {isEditing ? (
                  <input
                    type="number"
                    value={invoiceActual[month] || 0}
                    onChange={(e) => handleActualChange(month, e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                ) : (
                  <span className="text-red-600 font-medium">{invoiceActual[month] || 0}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end mt-6 space-x-4">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-5 py-2 bg-gray-400 text-white font-semibold rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancel
            </button>
          </>
        ) : (
          userRole !== 'user' && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-2 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              Edit
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default InvoiceTable;
