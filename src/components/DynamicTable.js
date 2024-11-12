import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { AuthContext } from "./AuthContext";

const categories = [
  "Travel Desk",
  "Accommodation",
  "Site Travel",
  "Food",
  "DP Vendor",
  "DC Vendor",
  "Flying Vendor",
  "Consultant",
  "Special",
  "Miscellaneous",
];

const generateMonthsArray = (start, end) => {
  const months = [];
  const startDate = new Date(start);
  const endDate = new Date(end);

  let currentDate = startDate;
  while (currentDate <= endDate) {
    const monthYear = currentDate.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    months.push(monthYear);
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return months;
};

const DynamicTable = ({
  projectId,
  projectStartDate,
  projectEndDate,
  projectName,
}) => {
  const [expenses, setExpenses] = useState([]);
  const [newBudget, setNewBudget] = useState({});
  const [newActual, setNewActual] = useState({});
  const [invoiceBudget, setInvoiceBudget] = useState({});
  const [invoiceActual, setInvoiceActual] = useState({});
  const [months, setMonths] = useState(
    generateMonthsArray(projectStartDate, projectEndDate)
  );
  const [isEditable, setIsEditable] = useState(false);
  const [projectBudget, setProjectBudget] = useState(0);
  const [file, setFile] = useState(null);

  const { userRole } = useContext(AuthContext);
  const canEdit = userRole !== "user";

  useEffect(() => {
    const newMonths = generateMonthsArray(projectStartDate, projectEndDate);
    setMonths(newMonths);

    setNewBudget({});
    setNewActual({});
    setInvoiceBudget({});
    setInvoiceActual({});
    setExpenses([]);
    setProjectBudget(0);
  }, [projectId, projectStartDate, projectEndDate, projectName]);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const projectResponse = await axios.get(
          `http://192.168.0.147:5000/projects/${projectId}`
        );
        setProjectBudget(projectResponse.data.budget);

        const expensesResponse = await axios.get(
          `http://192.168.0.147:5000/projects/${projectId}/expenses`
        );
        const budgetData = {};
        const actualData = {};

        months.forEach((month) => {
          budgetData[month] = {};
          actualData[month] = {};
          categories.forEach((category) => {
            budgetData[month][category] = 0;
            actualData[month][category] = 0;
          });
        });

        expensesResponse.data.forEach((expense) => {
          const { month, category, budget, actual } = expense;
          budgetData[month][category] = parseFloat(budget) || 0;
          actualData[month][category] = parseFloat(actual) || 0;
        });

        setNewBudget(budgetData);
        setNewActual(actualData);
        setExpenses(expensesResponse.data);

        const invoiceResponse = await axios.get(
          `http://192.168.0.147:5000/projects/${projectId}/invoices`
        );
        const combinedInvoiceBudget = invoiceResponse.data.reduce(
          (acc, invoice) => {
            Object.keys(invoice.invoice_budget).forEach((month) => {
              if (!acc[month]) acc[month] = 0;
              acc[month] += parseFloat(invoice.invoice_budget[month]) || 0;
            });
            return acc;
          },
          {}
        );

        const combinedInvoiceActual = invoiceResponse.data.reduce(
          (acc, invoice) => {
            Object.keys(invoice.invoice_actual).forEach((month) => {
              if (!acc[month]) acc[month] = 0;
              acc[month] += parseFloat(invoice.invoice_actual[month]) || 0;
            });
            return acc;
          },
          {}
        );

        setInvoiceBudget(combinedInvoiceBudget);
        setInvoiceActual(combinedInvoiceActual);
      } catch (error) {
        console.error("Error fetching project data:", error);
      }
    };

    fetchProjectData();
  }, [projectId, months]);

  const handleBudgetChange = (month, category, value) => {
    setNewBudget((prev) => ({
      ...prev,
      [month]: {
        ...prev[month],
        [category]: parseFloat(value) || 0,
      },
    }));
  };

  const handleActualChange = (month, category, value) => {
    setNewActual((prev) => ({
      ...prev,
      [month]: {
        ...prev[month],
        [category]: parseFloat(value) || 0,
      },
    }));
  };

  const handleSave = async () => {
    let totalActualExpenses = Object.values(newActual).reduce(
      (monthAcc, month) => {
        return (
          monthAcc +
          Object.values(month).reduce((catAcc, value) => catAcc + value, 0)
        );
      },
      0
    );

    if (totalActualExpenses > projectBudget) {
      const proceed = window.confirm(
        `The total actual expenses exceed the project budget of ${projectBudget}. Do you still want to save the expenses?`
      );
      if (!proceed) return;
    }

    const data = { newBudget, newActual, invoiceBudget };

    try {
      await axios.post(
        `http://192.168.0.147:5000/projects/${projectId}/expenses`,
        data
      );
      alert("Expenses saved successfully!");
      setIsEditable(false);
    } catch (error) {
      console.error("Error saving expenses:", error);
      alert("Error saving expenses.");
    }
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Convert parsed data to match newBudget and newActual formats
      const uploadData = [];
      const updatedBudget = {};
      const updatedActual = {};

      categories.forEach((category, catIndex) => {
        months.forEach((month, monthIndex) => {
          const budgetValue = parsedData[catIndex + 3][monthIndex * 2 + 1] || 0;
          const actualValue = parsedData[catIndex + 3][monthIndex * 2 + 2] || 0;

          // Populate upload data for backend and update local state
          uploadData.push({
            category,
            month,
            budget: parseFloat(budgetValue) || 0,
            actual: parseFloat(actualValue) || 0,
          });

          if (!updatedBudget[month]) updatedBudget[month] = {};
          if (!updatedActual[month]) updatedActual[month] = {};
          updatedBudget[month][category] = parseFloat(budgetValue) || 0;
          updatedActual[month][category] = parseFloat(actualValue) || 0;
        });
      });

      try {
        // Upload data to the server
        await axios.post(
          `http://192.168.0.147:5000/projects/${projectId}/upload-expenses`,
          {
            expenses: uploadData,
          }
        );
        alert("Data uploaded successfully!");

        // Update the state to reflect changes in the table
        setNewBudget(updatedBudget);
        setNewActual(updatedActual);
        setExpenses(uploadData); // Update expenses array if needed for other purposes
      } catch (error) {
        console.error("Error uploading data:", error);
        alert("Failed to upload data.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDeleteProject = async () => {
    const firstConfirmation = window.confirm(
      "Are you sure you want to delete this project? This action cannot be undone."
    );
    if (!firstConfirmation) return;

    const secondConfirmation = window.confirm(
      "This is your last chance! Do you really want to delete this project?"
    );
    if (!secondConfirmation) return;

    const typedName = prompt(
      `To confirm deletion, please type the project name: "${projectName}"`
    );

    if (typedName !== projectName) {
      alert("Project name does not match. Deletion canceled.");
      return;
    }

    try {
      await axios.delete(`http://192.168.0.147:5000/projects/${projectId}`);
      alert("Project deleted successfully!");
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Error deleting project.");
    }
  };

  const calculateCashOutflow = (month, type) => {
    const expensesForMonth = type === "budget" ? newBudget : newActual;
    return categories.reduce((sum, category) => {
      const value = expensesForMonth[month]?.[category] || 0;
      return sum + value;
    }, 0);
  };

  const exportToExcel = () => {
    const dataToExport = [
      [
        "Category",
        ...months.flatMap((month) => [`${month} Budget`, `${month} Actual`]),
      ],
      [
        "Invoice Plan",
        ...months.flatMap((month) => [
          invoiceBudget[month] || 0,
          invoiceActual[month] || 0,
        ]),
      ],
      [
        "Cash Outflow",
        ...months.flatMap((month) => [
          calculateCashOutflow(month, "budget"),
          calculateCashOutflow(month, "actual"),
        ]),
      ],
    ];

    categories.forEach((category) => {
      const row = [category];
      months.forEach((month) => {
        row.push(newBudget[month]?.[category] || 0);
        row.push(newActual[month]?.[category] || 0);
      });
      dataToExport.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, "Expenses.xlsx");
  };

  return (
    <div className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-md">
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">
        Project Expenses Overview
      </h2>
      <div className="overflow-x-auto max-h-[70vh]">
        <table className="min-w-full border border-gray-300 bg-white">
          <thead>
            <tr className="bg-indigo-700 text-white text-sm uppercase tracking-wide">
              <th className="p-3 border border-indigo-700 sticky left-0 top-0 z-30 bg-indigo-700">
                Months
              </th>
              {months.map((month) => (
                <th
                  key={month}
                  colSpan="2"
                  className="p-3 border border-indigo-700 sticky top-0 z-20 bg-indigo-700"
                >
                  {month}
                </th>
              ))}
            </tr>
            <tr className="bg-indigo-700 text-white text-sm uppercase tracking-wide">
              <th className="p-3 border border-indigo-700 sticky top-0 left-0 z-30 bg-indigo-700">
                Category
              </th>
              {months.map((month) => (
                <React.Fragment key={month}>
                  <th className="p-3 border border-indigo-700 sticky top-0 z-20 bg-indigo-700">
                    Budget
                  </th>
                  <th className="p-3 border border-indigo-700 sticky top-0 z-20 bg-indigo-700">
                    Actual
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <thead className="bg-gray-100 sticky top-14 z-10">
            <tr>
              <td className="p-3 font-medium border border-gray-300 sticky left-0 bg-gray-100">
                Invoice Plan
              </td>
              {months.map((month) => (
                <React.Fragment key={month}>
                  <td className="p-3 border border-gray-300 text-blue-600 font-medium">
                    {invoiceBudget[month] || 0}
                  </td>
                  <td className="p-3 border border-gray-300 text-red-600 font-medium">
                    {invoiceActual[month] || 0}
                  </td>
                </React.Fragment>
              ))}
            </tr>
            <tr>
              <td className="p-3 font-medium border border-gray-300 sticky left-0 bg-gray-100">
                Cash Outflow
              </td>
              {months.map((month) => (
                <React.Fragment key={month}>
                  <td className="p-3 border border-gray-300 text-blue-600 font-medium">
                    {calculateCashOutflow(month, "budget")}
                  </td>
                  <td className="p-3 border border-gray-300 text-red-600 font-medium">
                    {calculateCashOutflow(month, "actual")}
                  </td>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category} className="hover:bg-gray-50">
                <td className="p-3 font-medium border border-gray-300 sticky left-0 bg-gray-50 z-10 text-gray-800">
                  {category}
                </td>
                {months.map((month) => (
                  <React.Fragment key={`${category}-${month}`}>
                    <td className="p-3 border border-gray-300">
                      {isEditable && canEdit ? (
                        <input
                          type="number"
                          value={newBudget[month]?.[category] || 0}
                          onChange={(e) =>
                            handleBudgetChange(month, category, e.target.value)
                          }
                          className="w-full px-3 py-1 border border-indigo-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50"
                        />
                      ) : (
                        <span className="text-blue-600 font-medium">
                          {newBudget[month]?.[category] || 0}
                        </span>
                      )}
                    </td>
                    <td className="p-3 border border-gray-300">
                      {isEditable && canEdit ? (
                        <input
                          type="number"
                          value={newActual[month]?.[category] || 0}
                          onChange={(e) =>
                            handleActualChange(month, category, e.target.value)
                          }
                          className="w-full px-3 py-1 border border-red-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50"
                        />
                      ) : (
                        <span className="text-red-600 font-medium">
                          {newActual[month]?.[category] || 0}
                        </span>
                      )}
                    </td>
                  </React.Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 justify-items-center items-center">
        {canEdit && (
          <>
            <button
              className="w-32 h-8 text-xs font-medium rounded-md text-white transition-transform transform hover:scale-105 bg-gradient-to-r from-indigo-500 to-indigo-700 shadow-sm"
              onClick={() => setIsEditable(!isEditable)}
            >
              {isEditable ? "Cancel" : "Edit"}
            </button>
            {isEditable && (
              <button
                className="w-32 h-8 text-xs font-medium rounded-md text-white transition-transform transform hover:scale-105 bg-gradient-to-r from-blue-500 to-blue-700 shadow-sm"
                onClick={handleSave}
              >
                Save
              </button>
            )}
          </>
        )}

        <button
          className="w-32 h-8 text-xs font-medium rounded-md text-white transition-transform transform hover:scale-105 bg-gradient-to-r from-gray-500 to-gray-700 shadow-sm"
          onClick={exportToExcel}
        >
          Export to Excel
        </button>

        {(userRole === "admin" ||
          userRole === "PMO" ||
          userRole === "manager") && (
          <div className="flex flex-col items-center">
            <input
              type="file"
              onChange={handleFileUpload}
              className="w-32 h-8 text-xs text-gray-700 file:border-0 file:bg-gray-200 file:text-gray-700 rounded-md mb-2"
            />
            <button
              className="w-32 h-8 text-xs font-medium rounded-md text-white transition-transform transform hover:scale-105 bg-gradient-to-r from-green-500 to-green-700 shadow-sm"
              onClick={handleUpload}
            >
              Upload
            </button>
          </div>
        )}

        {(userRole === "admin" || userRole === "PMO") && (
          <button
            className="w-32 h-8 text-xs font-medium rounded-md text-white transition-transform transform hover:scale-105 bg-gradient-to-r from-red-500 to-red-700 shadow-sm"
            onClick={handleDeleteProject}
          >
            Delete Project
          </button>
        )}
      </div>
    </div>
  );
};

export default DynamicTable;
