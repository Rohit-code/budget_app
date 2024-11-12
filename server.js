const bcrypt = require('bcrypt');
const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const moment = require('moment');
const { Pool } = require('pg');
const logger = require('./logger'); 


const app = express();
const jwt = require('jsonwebtoken');
const secretKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MzA1Njc0ODV9.Toi7KA6NCkqaHZAh265EB8_LRZYi_y9wHQszxmftcA0';

// Middleware to verify JWT and check role
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send({ error: 'Access denied. No token provided.' });

    try {
      const decoded = jwt.verify(token.split(' ')[1], secretKey);
      req.user = decoded;

      if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
        return res.status(403).send({ error: 'Access denied. Insufficient permissions.' });
      }

      next();
    } catch (error) {
      res.status(400).send({ error: 'Invalid token.' });
    }
  };
}

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'budget_management',
  password: '123',
  port: 5432,
});

app.use(cors());
app.use(bodyParser.json());

function formatDateFromDB(dateStr) {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Endpoint to create a new project
app.post('/projects', async (req, res) => {
  const { name, start_date, end_date, budget, order_value } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO projects (name, start_date, end_date, budget, order_value ) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, start_date, end_date, budget, order_value || null] // Set default if order_value is not provided
    );
    res.send(result.rows[0]);
  } catch (error) {
    console.error('Error adding project:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Endpoint to save budget data
app.post('/save-budget', async (req, res) => {
  const { projectId, budgetData } = req.body;

  try {
    for (const month in budgetData) {
      for (const category in budgetData[month]) {
        const { budget, actual } = budgetData[month][category];
        await pool.query(
          'INSERT INTO expenses (project_id, month, category, budget, actual) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (project_id, month, category) DO UPDATE SET budget = $4, actual = $5',
          [projectId, month, category, budget, actual]
        );
      }
    }
    res.send({ message: 'Budget data saved' });
  } catch (error) {
    console.error('Error saving budget data:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Endpoint to delete a project
app.delete('/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM expenses WHERE project_id = $1', [id]);
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    res.send({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Endpoint to get a single project
app.get('/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send({ error: 'Project not found' });
    }
    res.send(result.rows[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Endpoint to save expenses for a project
app.post('/projects/:id/expenses', async (req, res) => {
  const { id } = req.params;
  const { newBudget, newActual } = req.body;

  try {
    for (const month in newBudget) {
      // Validate month format
      if (!/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/.test(month)) {
        return res.status(400).send({ error: `Invalid month format: ${month}` });
      }

      for (const category in newBudget[month]) {
        await pool.query(
          'INSERT INTO expenses (project_id, month, category, budget, actual) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (project_id, month, category) DO UPDATE SET budget = $4, actual = $5',
          [id, month, category, newBudget[month][category], newActual[month][category]]
        );
      }
    }
    res.send({ success: true });
  } catch (error) {
    console.error('Error saving expenses:', error);
    res.status(500).send({ error: 'Server error' });
  }
});


// Endpoint to get expenses for a project
app.get('/projects/:id/expenses', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM expenses WHERE project_id = $1', [id]);
    res.send(result.rows);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Endpoint to get the project summary for a specific project
app.get('/projects/:id/summary', async (req, res) => {
  const { id } = req.params;

  try {
    const projectResult = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    const project = projectResult.rows[0];

    if (!project) {
      return res.status(404).send({ error: 'Project not found' });
    }

    const expensesResult = await pool.query('SELECT * FROM expenses WHERE project_id = $1', [id]);
    const expenses = expensesResult.rows;

    const totalBudget = parseFloat(project.budget);
    let consumedBudget = 0;
    let consumedActual = 0;

    expenses.forEach(expense => {
      if (expense.category !== 'Cash Outflow') {
        consumedBudget += parseFloat(expense.budget || 0);
        consumedActual += parseFloat(expense.actual || 0);
      }
    });

    const remainingBudget = totalBudget - consumedBudget;
    const remainingActual = totalBudget - consumedActual;

    res.send({
      totalBudget,
      consumedBudget,
      remainingBudget,
      consumedActual,
      remainingActual
    });
  } catch (error) {
    console.error('Error fetching project summary:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Endpoint to get the project summary for all projects
app.get('/project-summary', async (req, res) => {
  try {
    const projectResult = await pool.query('SELECT * FROM projects');
    const projects = projectResult.rows;

    const summary = await Promise.all(projects.map(async (project) => {
      try {
        const expensesResult = await pool.query('SELECT * FROM expenses WHERE project_id = $1', [project.id]);
        const expenses = expensesResult.rows;

        const totalBudget = parseFloat(project.budget);
        let consumedBudget = 0;
        let consumedActual = 0;

        expenses.forEach(expense => {
          if (expense.category !== 'Cash Outflow') {
            consumedBudget += parseFloat(expense.budget || 0);
            consumedActual += parseFloat(expense.actual || 0);
          }
        });

        const remainingBudget = totalBudget - consumedBudget;
        const remainingActual = totalBudget - consumedActual;

        return {
          id: project.id,
          name: project.name,
          start_date: project.start_date,
          end_date: project.end_date,
          totalBudget,
          consumedBudget,
          remainingBudget,
          consumedActual,
          remainingActual
        };
      } catch (error) {
        console.error(`Error fetching expenses for project ${project.id}:`, error);
        throw new Error(`Error fetching expenses for project ${project.id}`);
      }
    }));

    res.send(summary);
  } catch (error) {
    console.error('Error fetching project summaries:', error);
    res.status(500).send({ error: 'Server error' });
  }
});


// Endpoint to get all projects
app.get('/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects');
    const projects = result.rows.map(project => ({
      ...project,
      start_date: formatDateFromDB(project.start_date),
      end_date: formatDateFromDB(project.end_date)
    }));
    res.send(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Endpoint to get a single project
app.get('/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send({ error: 'Project not found' });
    }
    const project = result.rows[0];
    project.start_date = formatDateFromDB(project.start_date);
    project.end_date = formatDateFromDB(project.end_date);
    res.send(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Endpoint to update a project
app.put('/projects/:id', async (req, res) => {
  const { id } = req.params;
  const { name, start_date, end_date, budget } = req.body;

  try {
    const result = await pool.query(
      'UPDATE projects SET name = $1, start_date = $2, end_date = $3, budget = $4 WHERE id = $5 RETURNING *',
      [name, formatDateToDB(start_date), formatDateToDB(end_date), budget, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send({ error: 'Project not found' });
    }

    const project = result.rows[0];
    project.start_date = formatDateFromDB(project.start_date);
    project.end_date = formatDateFromDB(project.end_date);
    res.send(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

app.get('/financial-years', async (req, res) => {
  const query = `
      WITH RECURSIVE fiscal_years AS (
    SELECT DISTINCT
        CASE
            WHEN EXTRACT(MONTH FROM start_date) >= 4 THEN EXTRACT(YEAR FROM start_date)
            ELSE EXTRACT(YEAR FROM start_date) - 1
        END AS financial_year,
        CASE
            WHEN EXTRACT(MONTH FROM end_date) >= 4 THEN EXTRACT(YEAR FROM end_date)
            ELSE EXTRACT(YEAR FROM end_date) - 1
        END AS end_year
    FROM projects
    UNION ALL
    SELECT financial_year + 1, end_year
    FROM fiscal_years
    WHERE financial_year < end_year
)
SELECT DISTINCT financial_year
FROM fiscal_years
ORDER BY financial_year;

  `;

  try {
      const result = await pool.query(query);
      res.json(result.rows);
  } catch (err) {
      console.error('Error fetching financial years:', err);
      res.status(500).send('Internal Server Error');
  }
});

app.get('/fiscal-year-months', async (req, res) => {
  const query = `
      WITH fiscal_year_months AS (
          SELECT DATE '2022-04-01' + INTERVAL '1 month' * (generate_series(0, 11)) AS month_date
          UNION ALL
          SELECT DATE '2023-04-01' + INTERVAL '1 month' * (generate_series(0, 11))
      )
      SELECT 
          fy.month_date AS fiscal_month,
          p.id AS project_id,
          p.name AS project_name,
          e.category,
          e.budget,
          e.actual
      FROM 
          fiscal_year_months fy
      JOIN 
          projects p ON fy.month_date BETWEEN p.start_date AND p.end_date
      JOIN 
          expenses e ON p.id = e.project_id AND TO_CHAR(fy.month_date, 'Mon YYYY') = e.month
      ORDER BY 
          fy.month_date, p.id, e.category;
  `;

  try {
      const result = await pool.query(query);
      res.json(result.rows);
  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
});

const getFinancialYearDates = (year) => {
  const startDate = new Date(`${year}-04-01`);
  const endDate = new Date(`${parseInt(year, 10) + 1}-03-31`);
  return { startDate, endDate };
};

app.get('/projects/financial-year/:startYear', async (req, res) => {
  const { startYear } = req.params;

  // Validate year format
  if (!/^\d{4}$/.test(startYear)) {
    return res.status(400).send('Invalid year format. Please provide a year in YYYY format.');
  }

  const { startDate, endDate } = getFinancialYearDates(startYear);

  try {
    const client = await pool.connect();

    const query = `
      WITH date_range AS (
        SELECT
          $1::date AS start_date,
          $2::date AS end_date
      ),
      projects_in_range AS (
        SELECT
          p.id,
          p.name,
          p.start_date,
          p.end_date,
          CASE
            WHEN p.start_date >= (SELECT start_date FROM date_range) THEN p.budget
            ELSE p.budget - COALESCE((SELECT SUM(e.actual) 
                                      FROM expenses e
                                      WHERE e.project_id = p.id
                                      AND TO_DATE(e.month, 'Mon YYYY') < (SELECT start_date FROM date_range)), 0)
          END AS budget
        FROM projects p
        WHERE p.start_date <= (SELECT end_date FROM date_range)
          AND p.end_date >= (SELECT start_date FROM date_range)
      ),
      expenses_aggregated AS (
        SELECT
          p.id,
          p.name,
          e.month,
          SUM(e.actual) AS total_expense
        FROM projects_in_range p
        LEFT JOIN expenses e ON p.id = e.project_id
        WHERE TO_DATE(e.month, 'Mon YYYY') BETWEEN (SELECT start_date FROM date_range) AND (SELECT end_date FROM date_range)
        GROUP BY p.id, p.name, e.month
      ),
      budget_spent_and_carryover AS (
        SELECT
          p.id,
          p.name,
          p.start_date,
          p.end_date,
          p.budget,
          COALESCE(SUM(e.total_expense), 0) AS budget_spent,
          p.budget - COALESCE(SUM(e.total_expense), 0) AS carry_over_budget
        FROM projects_in_range p
        LEFT JOIN expenses_aggregated e ON p.id = e.id
        GROUP BY p.id, p.name, p.start_date, p.end_date, p.budget
      )
      SELECT
        p.id,
        p.name,
        p.start_date,
        p.end_date,
        p.budget_spent,
        p.carry_over_budget,
        COALESCE(jsonb_object_agg(e.month, e.total_expense) FILTER (WHERE e.total_expense IS NOT NULL), '{}'::jsonb) AS expenses
      FROM budget_spent_and_carryover p
      LEFT JOIN expenses_aggregated e ON p.id = e.id
      GROUP BY p.id, p.name, p.start_date, p.end_date, p.budget_spent, p.carry_over_budget;
    `;

    const values = [startDate, endDate];
    const result = await client.query(query, values);

    client.release();

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching projects data for financial year:', err);
    res.status(500).send('Internal Server Error');
  }
});

const calculateStartEndDates = (invoiceBudget) => {
  const months = Object.keys(invoiceBudget);
  const startDate = new Date(`${months[0]}-01`);
  const endDate = new Date(`${months[months.length - 1]}-01`);
  endDate.setMonth(endDate.getMonth() + 1); // Move to the first day of the next month
  endDate.setDate(0); // Move to the last day of the current month

  return {
    start_date: startDate.toISOString().substring(0, 10),
    end_date: endDate.toISOString().substring(0, 10)
  };
};

app.post('/projects/:projectId/invoices', async (req, res) => {
  const { projectId } = req.params;
  const { invoiceBudget, invoiceActual } = req.body;

  console.log('Raw request body:', req.body);

  const { start_date, end_date } = calculateStartEndDates(invoiceBudget);

  try {
    // Retrieve order value from projects table
    const projectResult = await pool.query('SELECT order_value FROM projects WHERE id = $1', [projectId]);
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const order_value = projectResult.rows[0].order_value;

    // Calculate invoice actual dynamically if not provided
    const invoice_actual_sum = Object.values(invoiceActual || {}).reduce((sum, value) => sum + value, 0);

    console.log('Received data:', {
      projectId,
      start_date,
      end_date,
      invoice_budget: JSON.stringify(invoiceBudget),  // Convert to JSON string
      invoice_actual: JSON.stringify(invoiceActual),  // Convert to JSON string
      invoice_actual_sum,
      order_value
    });

    // Extract months from invoiceBudget keys
    const months = Object.keys(invoiceBudget);

    // Validate required fields
    if (!start_date || !end_date || invoiceBudget === undefined || invoice_actual_sum === undefined || order_value === undefined) {
      console.error('Missing required fields:', {
        start_date,
        end_date,
        invoiceBudget,
        invoice_actual_sum,
        order_value
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if invoice already exists
    const existingInvoice = await pool.query(
      'SELECT * FROM invoices WHERE project_id = $1 AND start_date = $2 AND end_date = $3',
      [projectId, start_date, end_date]
    );

    if (existingInvoice.rows.length > 0) {
      // Update only the invoice_budget and invoice_actual columns
      await pool.query(
        'UPDATE invoices SET invoice_budget = $1, invoice_actual = $2 WHERE project_id = $3 AND start_date = $4 AND end_date = $5',
        [JSON.stringify(invoiceBudget), JSON.stringify(invoiceActual), projectId, start_date, end_date]
      );
    } else {
      // Insert a new invoice with only invoice_budget and invoice_actual
      await pool.query(
        'INSERT INTO invoices (project_id, start_date, end_date, invoice_budget, invoice_actual) VALUES ($1, $2, $3, $4, $5)',
        [projectId, start_date, end_date, JSON.stringify(invoiceBudget), JSON.stringify(invoiceActual)]
      );
    }

    res.status(200).json({ message: 'Invoice saved successfully!' });
  } catch (error) {
    console.error('Error saving invoice:', error.message);
    res.status(500).json({ error: 'Error saving invoice' });
  }
});


app.get('/projects/:projectId/invoices', async (req, res) => {
  const { projectId } = req.params;
  console.log("Received projectId:", projectId);

  if (!projectId) {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE project_id = $1',
      [projectId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/invoices', async (req, res) => {
  const { projectId } = req.params;

  try {
    const result = await pool.query('SELECT * FROM invoices');
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No invoices found for the given project ID' });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching invoices:', error.message);
    res.status(500).json({ error: 'Error fetching invoices' });
  }
});

// Endpoint to register a new user (restricted to admin for role assignment)
app.post('/register', authorizeRoles('admin'), async (req, res) => {
  const { name, dept, emailid, password, role } = req.body;
  if (!name || !dept || !emailid || !password || !role) {
    return res.status(400).send({ error: 'All fields are required.' });
  }

  try {
    const hashedPassword = hashPassword(password); // Hash password using SHA-256
    const result = await pool.query(
      'INSERT INTO users (name, dept, emailid, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, dept, emailid, hashedPassword, role]
    );
    res.status(201).send(result.rows[0]);
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send({ error: 'Error registering user' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { emailid, password } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE emailid = $1', [emailid]);
    const user = userResult.rows[0];
    if (!user || hashPassword(password) !== user.password) {
      return res.status(400).send({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, secretKey, { expiresIn: '1h' });
    res.send({ token, role: user.role });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send({ error: 'Error logging in' });
  }
});

// Endpoint to fetch all users (restricted to admin and PMO)
app.get('/users', authorizeRoles('admin', 'PMO'), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, dept, emailid, role FROM users');
    res.send(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

// Endpoint to update a user's role (restricted to admin)
app.put('/users/:id/role', authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
    return res.status(400).send({ error: 'Role is required.' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, dept, emailid, role',
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send({ error: 'User not found.' });
    }

    res.status(200).send({ message: 'Role updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).send({ error: 'Error updating role' });
  }
});

// Endpoint to handle upload of expenses from file
app.post('/projects/:projectId/upload-expenses', async (req, res) => {
  const { projectId } = req.params;
  const { expenses } = req.body;

  try {
    for (const expense of expenses) {
      const { month, category, budget, actual } = expense;

      // Check if the expense entry already exists
      const existingExpense = await pool.query(
        'SELECT * FROM expenses WHERE project_id = $1 AND month = $2 AND category = $3',
        [projectId, month, category]
      );

      if (existingExpense.rows.length > 0) {
        // Update the existing expense entry
        await pool.query(
          'UPDATE expenses SET budget = $1, actual = $2 WHERE project_id = $3 AND month = $4 AND category = $5',
          [budget, actual, projectId, month, category]
        );
      } else {
        // Insert new expense entry
        await pool.query(
          'INSERT INTO expenses (project_id, month, category, budget, actual) VALUES ($1, $2, $3, $4, $5)',
          [projectId, month, category, budget, actual]
        );
      }
    }

    res.status(200).send('Expenses uploaded successfully');
  } catch (error) {
    console.error('Error uploading expenses:', error);
    res.status(500).send('Failed to upload expenses');
  }
});

// Endpoint to add a new user (restricted to admin for all roles, PMO for manager and PMO roles only)
app.post('/add-user', authorizeRoles('admin', 'PMO'), async (req, res) => {
  const { name, dept, emailid, password, role } = req.body;
  const { role: requesterRole } = req.user;

  if (!name || !dept || !emailid || !password || !role) {
    return res.status(400).send({ error: 'All fields are required.' });
  }

  if ((requesterRole === 'PMO' && role !== 'manager' && role !== 'PMO') ||
      (requesterRole === 'admin' && !['admin', 'PMO', 'manager', 'user'].includes(role))) {
    return res.status(403).send({ error: 'You do not have permission to assign this role.' });
  }

  try {
    const hashedPassword = hashPassword(password);
    const result = await pool.query(
      'INSERT INTO users (name, dept, emailid, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, dept, emailid, hashedPassword, role]
    );
    res.status(201).send(result.rows[0]);
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).send({ error: 'Error adding user' });
  }
});

// Endpoint to delete a user by ID (restricted to admin and PMO)
app.delete('/users/:id', authorizeRoles('admin', 'PMO'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.send({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).send({ error: 'Server error' });
  }
});

const ipAddress = '192.168.0.147'; 
const port = 5000;



app.listen(port, ipAddress, () => {
  console.log(`Server running at http://${ipAddress}:${port}/`);
});
