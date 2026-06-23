const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Neon PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test DB Connection and Initialize Schema
pool.connect(async (err, client, release) => {
  if (err) {
    console.error('Error connecting to Neon PostgreSQL database:', err.stack);
  } else {
    console.log('Connected to Neon PostgreSQL database successfully.');
    
    // Auto-run schema initialization
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('Database schema initialized/verified successfully.');
      } else {
        console.warn('schema.sql file not found, skipping database auto-initialization.');
      }
    } catch (schemaErr) {
      console.error('Error initializing database schema:', schemaErr);
    } finally {
      release();
    }
  }
});

// Middleware: Authenticate JWT Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

// ------------------- AUTHENTICATION ROUTES -------------------

// User Registration (Signup)
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Check if email already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email.toLowerCase(), passwordHash]
    );

    const newUser = result.rows[0];
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: '7d',
    });

    res.status(201).json({
      token,
      user: {
        uid: String(newUser.id),
        email: newUser.email,
        displayName: newUser.name,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // Check if user exists
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Check if password_hash exists (could be null if registered via Google Sign-In)
    if (!user.password_hash) {
      return res.status(400).json({
        error: 'This account was registered via Google Sign-In. Please log in using Google.',
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: '7d',
    });

    res.json({
      token,
      user: {
        uid: String(user.id),
        email: user.email,
        displayName: user.name,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Google Authentication Flow (Verify id_token and log in)
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Google credential token required.' });
  }

  try {
    // Call Google OAuth api to verify the id_token
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!googleRes.ok) {
      return res.status(400).json({ error: 'Google authentication failed.' });
    }

    const payload = await googleRes.json();
    const email = payload.email;
    const name = payload.name || payload.given_name || 'Google User';

    if (!email) {
      return res.status(400).json({ error: 'Failed to retrieve email from Google Account.' });
    }

    // Find or create user in database
    let userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    let user;

    if (userResult.rows.length === 0) {
      // Register new Google OAuth user (no password)
      const registerRes = await pool.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, NULL) RETURNING id, name, email',
        [name, email.toLowerCase()]
      );
      user = registerRes.rows[0];
    } else {
      user = userResult.rows[0];
    }

    // Issue JWT
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: '7d',
    });

    res.json({
      token,
      user: {
        uid: String(user.id),
        email: user.email,
        displayName: user.name,
      },
    });
  } catch (err) {
    console.error('Google Sign-In verification error:', err);
    res.status(500).json({ error: 'Google auth server error.' });
  }
});

// Get Current Logged-in User Profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];
    res.json({
      user: {
        uid: String(user.id),
        email: user.email,
        displayName: user.name,
      },
    });
  } catch (err) {
    console.error('Fetch me error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ------------------- TASKS CRUD ROUTES -------------------

// Get User Tasks
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY id DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Error fetching tasks.' });
  }
});

// Add Task
app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { text, done, priority, due, category, subtasks, risk, ai_generated } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO tasks (user_id, text, done, priority, due, category, subtasks, risk, ai_generated) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        req.user.id,
        text,
        done || false,
        priority || 'medium',
        due || 'No due date',
        category || 'General',
        JSON.stringify(subtasks || []),
        risk || 0,
        ai_generated || false,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding task:', err);
    res.status(500).json({ error: 'Error creating task.' });
  }
});

// Update Task
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  
  // Construct dynamic query
  const setClauses = [];
  const queryValues = [req.user.id, id];
  let valIndex = 3;

  for (const [key, val] of Object.entries(fields)) {
    const dbKey = key === 'aiGenerated' ? 'ai_generated' : key;
    if (['text', 'done', 'priority', 'due', 'category', 'subtasks', 'risk', 'ai_generated'].includes(dbKey)) {
      setClauses.push(`${dbKey} = $${valIndex}`);
      queryValues.push(dbKey === 'subtasks' ? JSON.stringify(val) : val);
      valIndex++;
    }
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ error: 'No fields provided for update.' });
  }

  try {
    const result = await pool.query(
      `UPDATE tasks SET ${setClauses.join(', ')} WHERE user_id = $1 AND id = $2 RETURNING *`,
      queryValues
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or unauthorized.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Error updating task.' });
  }
});

// Delete Task
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM tasks WHERE user_id = $1 AND id = $2 RETURNING *', [
      req.user.id,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or unauthorized.' });
    }

    res.json({ message: 'Task deleted successfully.', task: result.rows[0] });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Error deleting task.' });
  }
});

// ------------------- HABITS CRUD ROUTES -------------------

// Get Habits
app.get('/api/habits', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM habits WHERE user_id = $1 ORDER BY id DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching habits:', err);
    res.status(500).json({ error: 'Error fetching habits.' });
  }
});

// Add Habit
app.post('/api/habits', authenticateToken, async (req, res) => {
  const { name, target, streak, best, rate, week, color } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO habits (user_id, name, target, streak, best, rate, week, color) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        req.user.id,
        name,
        target,
        streak || 0,
        best || 0,
        rate || 0,
        JSON.stringify(week || [false, false, false, false, false, false, false]),
        color || 'var(--accent-blue)',
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding habit:', err);
    res.status(500).json({ error: 'Error creating habit.' });
  }
});

// Update Habit
app.put('/api/habits/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, target, streak, best, rate, week, color } = req.body;

  try {
    const result = await pool.query(
      `UPDATE habits 
       SET name = COALESCE($3, name),
           target = COALESCE($4, target),
           streak = COALESCE($5, streak),
           best = COALESCE($6, best),
           rate = COALESCE($7, rate),
           week = COALESCE($8, week),
           color = COALESCE($9, color)
       WHERE user_id = $1 AND id = $2 RETURNING *`,
      [
        req.user.id,
        id,
        name,
        target,
        streak,
        best,
        rate,
        week ? JSON.stringify(week) : null,
        color,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found or unauthorized.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating habit:', err);
    res.status(500).json({ error: 'Error updating habit.' });
  }
});

// Delete Habit
app.delete('/api/habits/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM habits WHERE user_id = $1 AND id = $2 RETURNING *', [
      req.user.id,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Habit not found or unauthorized.' });
    }

    res.json({ message: 'Habit deleted successfully.', habit: result.rows[0] });
  } catch (err) {
    console.error('Error deleting habit:', err);
    res.status(500).json({ error: 'Error deleting habit.' });
  }
});

// ------------------- GOALS CRUD ROUTES -------------------

// Get Goals
app.get('/api/goals', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM goals WHERE user_id = $1 ORDER BY id DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching goals:', err);
    res.status(500).json({ error: 'Error fetching goals.' });
  }
});

// Add Goal
app.post('/api/goals', authenticateToken, async (req, res) => {
  const { name, category, progress, color, milestones } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO goals (user_id, name, category, progress, color, milestones) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        req.user.id,
        name,
        category || 'Personal',
        progress || 0,
        color || 'var(--accent-blue)',
        JSON.stringify(milestones || []),
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding goal:', err);
    res.status(500).json({ error: 'Error creating goal.' });
  }
});

// Update Goal
app.put('/api/goals/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, category, progress, color, milestones } = req.body;

  try {
    const result = await pool.query(
      `UPDATE goals 
       SET name = COALESCE($3, name),
           category = COALESCE($4, category),
           progress = COALESCE($5, progress),
           color = COALESCE($6, color),
           milestones = COALESCE($7, milestones)
       WHERE user_id = $1 AND id = $2 RETURNING *`,
      [
        req.user.id,
        id,
        name,
        category,
        progress,
        color,
        milestones ? JSON.stringify(milestones) : null,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found or unauthorized.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating goal:', err);
    res.status(500).json({ error: 'Error updating goal.' });
  }
});

// Delete Goal
app.delete('/api/goals/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM goals WHERE user_id = $1 AND id = $2 RETURNING *', [
      req.user.id,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found or unauthorized.' });
    }

    res.json({ message: 'Goal deleted successfully.', goal: result.rows[0] });
  } catch (err) {
    console.error('Error deleting goal:', err);
    res.status(500).json({ error: 'Error deleting goal.' });
  }
});

// ------------------- EVENTS CRUD ROUTES -------------------

// Get Calendar Events
app.get('/api/events', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events WHERE user_id = $1 ORDER BY id DESC', [req.user.id]);
    
    const formattedEvents = result.rows.map(row => ({
      id: String(row.id),
      title: row.title,
      start: parseFloat(row.start_hour),
      duration: parseFloat(row.duration),
      day: row.day_of_week,
      color: row.color,
      type: row.event_type,
    }));
    
    res.json(formattedEvents);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Error fetching events.' });
  }
});

// Add Calendar Event
app.post('/api/events', authenticateToken, async (req, res) => {
  const { title, start, duration, day, color, type } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO events (user_id, title, start_hour, duration, day_of_week, color, event_type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        req.user.id,
        title,
        start,
        duration,
        day,
        color || 'var(--accent-blue)',
        type || 'focus',
      ]
    );

    const row = result.rows[0];
    const formattedEvent = {
      id: String(row.id),
      title: row.title,
      start: parseFloat(row.start_hour),
      duration: parseFloat(row.duration),
      day: row.day_of_week,
      color: row.color,
      type: row.event_type,
    };

    res.status(201).json(formattedEvent);
  } catch (err) {
    console.error('Error adding event:', err);
    res.status(500).json({ error: 'Error creating event.' });
  }
});

// Delete Calendar Event
app.delete('/api/events/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM events WHERE user_id = $1 AND id = $2 RETURNING *', [
      req.user.id,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found or unauthorized.' });
    }

    res.json({ message: 'Event deleted successfully.' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Error deleting event.' });
  }
});

// Serve static assets in production (or if build folder exists)
if (process.env.NODE_ENV === 'production' || fs.existsSync(path.join(__dirname, '../dist'))) {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*any', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found.' });
    }
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
