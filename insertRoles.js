// insertRoles.js
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  user: 'postgres', // Database user
  host: 'localhost', // Database host
  database: 'budget_management', // Database name
  password: '123', // Database password
  port: 5432, // Database port
});

// Hash password using SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Define users with roles
const users = [
  {name:'admin2', dept: 'Admin Dept', emailid: "admin2@gmail.com", password:"admin2password", role: "admin"},
  { name: 'Admin User', dept: 'Admin Dept', emailid: 'admin@example.com', password: 'adminpassword', role: 'admin' },
  { name: 'PMO User', dept: 'PMO Dept', emailid: 'pmo@example.com', password: 'pmopassword', role: 'PMO' },
  { name: 'Manager User', dept: 'Manager Dept', emailid: 'manager@example.com', password: 'managerpassword', role: 'manager' },
  { name: 'Regular User', dept: 'General Dept', emailid: 'user@example.com', password: 'userpassword', role: 'user' },
];

// Function to insert users into the database
async function insertRoles() {
  const client = await pool.connect();
  try {
    for (const user of users) {
      const hashedPassword = hashPassword(user.password);
      const query = `
        INSERT INTO users (name, dept, emailid, password, role)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (emailid) DO NOTHING
      `;
      const values = [user.name, user.dept, user.emailid, hashedPassword, user.role];
      await client.query(query, values);
      console.log(`Inserted user with role: ${user.role}`);
    }
  } catch (error) {
    console.error('Error inserting roles:', error);
  } finally {
    client.release();
    pool.end().then(() => process.exit(0)); // Close pool and exit
  }
}

insertRoles();
