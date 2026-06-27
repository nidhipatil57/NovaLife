const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Neon PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Handle pool errors to prevent process crash
pool.on('error', (err) => {
  console.error('Unexpected error on idle pg client:', err.message || err);
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
        
        // Custom Migrations for Calendar updates
        await client.query(`
          ALTER TABLE events ADD COLUMN IF NOT EXISTS prep_checklist JSONB DEFAULT '[]';
          ALTER TABLE events ADD COLUMN IF NOT EXISTS week_offset INT DEFAULT 0;
          ALTER TABLE goals ADD COLUMN IF NOT EXISTS completed_by VARCHAR(50) DEFAULT '';
          ALTER TABLE goals ADD COLUMN IF NOT EXISTS completed_dates JSONB DEFAULT '[]';
          ALTER TABLE goals ADD COLUMN IF NOT EXISTS streak INT DEFAULT 0;
          ALTER TABLE goals ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
          ALTER TABLE goals ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE;
          ALTER TABLE habits ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT 'Student | Aspiring Developer | Productivity Enthusiast';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata (IST)';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation TEXT DEFAULT 'Student';
          ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_focus_target INTEGER DEFAULT 20;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_task_target INTEGER DEFAULT 5;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_coach_tone TEXT DEFAULT 'Motivational';
          ALTER TABLE events ADD COLUMN IF NOT EXISTS google_event_id VARCHAR(255);
          
          CREATE TABLE IF NOT EXISTS focus_sessions (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            notes TEXT DEFAULT '',
            duration INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS conversations (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(150) NOT NULL,
            pinned BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            conversation_id INT REFERENCES conversations(id) ON DELETE CASCADE,
            role VARCHAR(10) NOT NULL,
            text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(10) NOT NULL, -- 'income' or 'expense'
            amount NUMERIC(12, 2) NOT NULL,
            category VARCHAR(50) NOT NULL,
            date VARCHAR(50) NOT NULL,
            time VARCHAR(10) DEFAULT '',
            merchant VARCHAR(150) DEFAULT '',
            payment_method VARCHAR(50) DEFAULT 'Cash',
            notes TEXT DEFAULT '',
            recurring BOOLEAN DEFAULT FALSE,
            recurring_frequency VARCHAR(20) DEFAULT '',
            tags JSONB DEFAULT '[]',
            receipt_url TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS budgets (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            category VARCHAR(50) NOT NULL,
            amount NUMERIC(12, 2) NOT NULL,
            month_year VARCHAR(10) NOT NULL, -- 'YYYY-MM'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, category, month_year)
          );

          CREATE TABLE IF NOT EXISTS savings_goals (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(150) NOT NULL,
            target_amount NUMERIC(12, 2) NOT NULL,
            saved_amount NUMERIC(12, 2) DEFAULT 0,
            target_date VARCHAR(50) DEFAULT '',
            color VARCHAR(50) DEFAULT 'var(--accent-blue)',
            notes TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS bills (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(150) NOT NULL,
            amount NUMERIC(12, 2) NOT NULL,
            due_date VARCHAR(50) NOT NULL,
            category VARCHAR(50) NOT NULL,
            paid BOOLEAN DEFAULT FALSE,
            recurring BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('Database schema initialized/verified and calendar/goal columns migrated successfully.');
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

// Google APIs OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '173999487458-i11ov984fr2anm4fedlsgot4688ri3q5.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'fallback_secret';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Helper: Get Google Calendar client for a user
async function getGoogleCalendarClient(userId) {
  try {
    const result = await pool.query('SELECT google_refresh_token FROM users WHERE id = $1', [userId]);
    const refreshToken = result.rows[0]?.google_refresh_token;
    if (!refreshToken) return null;

    const userOauth = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );
    userOauth.setCredentials({ refresh_token: refreshToken });
    return google.calendar({ version: 'v3', auth: userOauth });
  } catch (err) {
    console.error('Error getting Google Calendar Client:', err);
    return null;
  }
}

// Helper: Get event ISO start/end date times (matches Monday-first calculation)
function getEventDateTime(dayOfWeek, startHour, duration, weekOffset) {
  const today = new Date();
  let currentDay = today.getDay();
  if (currentDay === 0) currentDay = 7;
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay + 1 + (Number(weekOffset || 0) * 7));
  
  const offsetFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const eventDate = new Date(startOfWeek);
  eventDate.setDate(startOfWeek.getDate() + offsetFromMonday);
  
  const startHours = Math.floor(startHour);
  const startMinutes = Math.round((startHour - startHours) * 60);
  
  const startTime = new Date(eventDate);
  startTime.setHours(startHours, startMinutes, 0, 0);
  
  const endTime = new Date(startTime);
  const totalMinutes = Math.round(duration * 60);
  endTime.setMinutes(startTime.getMinutes() + totalMinutes);
  
  return {
    start: startTime.toISOString(),
    end: endTime.toISOString()
  };
}

// Sync single event to Google Calendar (Insert or Update)
async function syncToGoogleCalendar(userId, eventId) {
  try {
    const calendar = await getGoogleCalendarClient(userId);
    if (!calendar) return; // Google Calendar not connected

    // Fetch full event info from DB
    const eventRes = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (eventRes.rows.length === 0) return;
    const event = eventRes.rows[0];

    const times = getEventDateTime(
      event.day_of_week, 
      parseFloat(event.start_hour), 
      parseFloat(event.duration), 
      event.week_offset
    );

    const resource = {
      summary: event.title,
      description: `Synced from NovaLife — Event Type: ${event.event_type}`,
      start: { dateTime: times.start },
      end: { dateTime: times.end },
      colorId: getGoogleColorId(event.color)
    };

    if (event.google_event_id) {
      // Update existing
      try {
        await calendar.events.update({
          calendarId: 'primary',
          eventId: event.google_event_id,
          requestBody: resource
        });
      } catch (updateErr) {
        // If event was deleted in Google Calendar directly, recreate it
        if (updateErr.code === 404 || updateErr.code === 410) {
          const insertRes = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: resource
          });
          await pool.query('UPDATE events SET google_event_id = $1 WHERE id = $2', [insertRes.data.id, eventId]);
        } else {
          throw updateErr;
        }
      }
    } else {
      // Insert new
      const insertRes = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: resource
      });
      await pool.query('UPDATE events SET google_event_id = $1 WHERE id = $2', [insertRes.data.id, eventId]);
    }
  } catch (err) {
    console.error('Error syncing to Google Calendar:', err);
  }
}

// Delete event from Google Calendar
async function deleteFromGoogleCalendar(userId, googleEventId) {
  if (!googleEventId) return;
  try {
    const calendar = await getGoogleCalendarClient(userId);
    if (!calendar) return;

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: googleEventId
    });
  } catch (err) {
    if (err.code !== 404 && err.code !== 410) {
      console.error('Error deleting from Google Calendar:', err);
    }
  }
}

// Map theme colors to Google Calendar colorIds (1 to 11)
function getGoogleColorId(color) {
  if (!color) return '1';
  const c = color.toLowerCase();
  if (c.includes('red') || c.includes('accent-red')) return '11'; 
  if (c.includes('orange') || c.includes('accent-orange')) return '6'; 
  if (c.includes('green') || c.includes('accent-green')) return '10'; 
  if (c.includes('cyan') || c.includes('accent-cyan')) return '7'; 
  if (c.includes('purple') || c.includes('accent-purple')) return '3'; 
  return '1'; 
}

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

// Google Calendar Connection Endpoint (initiates OAuth consent screen redirect)
app.get('/api/auth/google/connect', (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).send('Access token required.');
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, decoded) => {
    if (err) {
      return res.status(403).send('Invalid or expired token.');
    }

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      prompt: 'consent',
      state: String(decoded.id)
    });

    res.redirect(authUrl);
  });
});

// Google OAuth callback endpoint
app.get('/api/auth/google/callback', async (req, res) => {
  const { code, state } = req.query; // state is our userId
  if (!code || !state) {
    return res.redirect('http://localhost:5173/settings?calendar_error=missing_params');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;

    if (refreshToken) {
      await pool.query('UPDATE users SET google_refresh_token = $1 WHERE id = $2', [refreshToken, Number(state)]);
      res.redirect('http://localhost:5173/settings?calendar_connected=true');
    } else {
      // Check if we already have a refresh token saved
      const userCheck = await pool.query('SELECT google_refresh_token FROM users WHERE id = $1', [Number(state)]);
      if (userCheck.rows.length > 0 && userCheck.rows[0].google_refresh_token) {
        res.redirect('http://localhost:5173/settings?calendar_connected=true');
      } else {
        // Force consent to get refresh token
        const forceUrl = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: ['https://www.googleapis.com/auth/calendar'],
          prompt: 'consent',
          state: String(state)
        });
        res.redirect(forceUrl);
      }
    }
  } catch (err) {
    console.error('Google Callback Error:', err);
    res.redirect('http://localhost:5173/settings?calendar_error=oauth_failed');
  }
});

// Google Calendar Disconnect Endpoint
app.post('/api/auth/google/disconnect', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE users SET google_refresh_token = NULL WHERE id = $1', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Google Disconnect Error:', err);
    res.status(500).json({ error: 'Failed to disconnect Google Calendar.' });
  }
});

// Get Current Logged-in User Profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, google_refresh_token, bio, timezone, avatar_url, occupation, weekly_focus_target, daily_task_target, ai_coach_tone FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];
    res.json({
      user: {
        uid: String(user.id),
        email: user.email,
        displayName: user.name,
        bio: user.bio || '',
        timezone: user.timezone || 'Asia/Kolkata (IST)',
        avatarUrl: user.avatar_url || null,
        occupation: user.occupation || 'Student',
        weeklyFocusTarget: user.weekly_focus_target || 20,
        dailyTaskTarget: user.daily_task_target || 5,
        aiCoachTone: user.ai_coach_tone || 'Motivational',
        hasGoogleCalendar: !!user.google_refresh_token
      },
    });
  } catch (err) {
    console.error('Fetch me error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Update User Profile (displayName, bio, timezone, avatarUrl, occupation, weeklyFocusTarget, dailyTaskTarget, aiCoachTone)
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  const { displayName, bio, timezone, avatarUrl, occupation, weeklyFocusTarget, dailyTaskTarget, aiCoachTone } = req.body;
  if (!displayName) {
    return res.status(400).json({ error: 'Display Name is required.' });
  }

  try {
    let currentAvatarUrl = null;
    if (avatarUrl === undefined) {
      const userRes = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
      currentAvatarUrl = userRes.rows[0]?.avatar_url;
    } else {
      currentAvatarUrl = avatarUrl;
    }

    const userRes = await pool.query('SELECT occupation, weekly_focus_target, daily_task_target, ai_coach_tone FROM users WHERE id = $1', [req.user.id]);
    const currentInfo = userRes.rows[0] || {};

    const finalOccupation = occupation !== undefined ? occupation : (currentInfo.occupation || 'Student');
    const finalWeeklyFocus = weeklyFocusTarget !== undefined ? parseInt(weeklyFocusTarget) : (currentInfo.weekly_focus_target || 20);
    const finalDailyTask = dailyTaskTarget !== undefined ? parseInt(dailyTaskTarget) : (currentInfo.daily_task_target || 5);
    const finalAiCoach = aiCoachTone !== undefined ? aiCoachTone : (currentInfo.ai_coach_tone || 'Motivational');

    const result = await pool.query(
      `UPDATE users 
       SET name = $1, bio = $2, timezone = $3, avatar_url = $4, occupation = $5, weekly_focus_target = $6, daily_task_target = $7, ai_coach_tone = $8 
       WHERE id = $9 
       RETURNING id, name, email, google_refresh_token, bio, timezone, avatar_url, occupation, weekly_focus_target, daily_task_target, ai_coach_tone`,
      [displayName, bio || '', timezone || 'Asia/Kolkata (IST)', currentAvatarUrl, finalOccupation, finalWeeklyFocus, finalDailyTask, finalAiCoach, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];
    res.json({
      message: 'Profile updated successfully.',
      user: {
        uid: String(user.id),
        email: user.email,
        displayName: user.name,
        bio: user.bio,
        timezone: user.timezone,
        avatarUrl: user.avatar_url || null,
        occupation: user.occupation,
        weeklyFocusTarget: user.weekly_focus_target,
        dailyTaskTarget: user.daily_task_target,
        aiCoachTone: user.ai_coach_tone,
        hasGoogleCalendar: !!user.google_refresh_token
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Change Password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];
    if (!user.password_hash) {
      return res.status(400).json({ error: 'Google users do not have a local password. Please use Google Sign-In.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Delete Account
app.delete('/api/auth/delete-account', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ message: 'Account deleted successfully.' });
  } catch (err) {
    console.error('Delete account error:', err);
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
  const { text, done, priority, due, category, subtasks, risk, ai_generated, notes, sessions_count, activity_log } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO tasks (user_id, text, done, priority, due, category, subtasks, risk, ai_generated, notes, sessions_count, activity_log) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
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
        notes || '',
        sessions_count || 0,
        JSON.stringify(activity_log || []),
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
    let dbKey = key;
    if (key === 'aiGenerated') dbKey = 'ai_generated';
    if (key === 'sessionsCount') dbKey = 'sessions_count';
    if (key === 'activityLog') dbKey = 'activity_log';

    if (['text', 'done', 'priority', 'due', 'category', 'subtasks', 'risk', 'ai_generated', 'notes', 'sessions_count', 'activity_log'].includes(dbKey)) {
      setClauses.push(`${dbKey} = $${valIndex}`);
      queryValues.push(
        dbKey === 'subtasks' || dbKey === 'activity_log'
          ? JSON.stringify(val)
          : val
      );
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
  const { name, target, streak, best, rate, week, color, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO habits (user_id, name, target, streak, best, rate, week, color, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        req.user.id,
        name,
        target,
        streak || 0,
        best || 0,
        rate || 0,
        JSON.stringify(week || [false, false, false, false, false, false, false]),
        color || 'var(--accent-blue)',
        notes || '',
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
  const { name, target, streak, best, rate, week, color, notes } = req.body;

  try {
    const result = await pool.query(
      `UPDATE habits 
       SET name = COALESCE($3, name),
           target = COALESCE($4, target),
           streak = COALESCE($5, streak),
           best = COALESCE($6, best),
           rate = COALESCE($7, rate),
           week = COALESCE($8, week),
           color = COALESCE($9, color),
           notes = COALESCE($10, notes)
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
        notes,
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
  const { name, category, progress, color, milestones, completed_by, notes, ai_generated } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO goals (user_id, name, category, progress, color, milestones, completed_by, notes, ai_generated) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        req.user.id,
        name,
        category || 'Personal',
        progress || 0,
        color || 'var(--accent-blue)',
        JSON.stringify(milestones || []),
        completed_by || '',
        notes || '',
        ai_generated !== undefined ? ai_generated : false,
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
  const { name, category, progress, color, milestones, completed_by, completed_dates, streak, notes, ai_generated } = req.body;

  try {
    const result = await pool.query(
      `UPDATE goals 
       SET name = COALESCE($3, name),
           category = COALESCE($4, category),
           progress = COALESCE($5, progress),
           color = COALESCE($6, color),
           milestones = COALESCE($7, milestones),
           completed_by = COALESCE($8, completed_by),
           completed_dates = COALESCE($9, completed_dates),
           streak = COALESCE($10, streak),
           notes = COALESCE($11, notes),
           ai_generated = COALESCE($12, ai_generated)
       WHERE user_id = $1 AND id = $2 RETURNING *`,
      [
        req.user.id,
        id,
        name !== undefined ? name : null,
        category !== undefined ? category : null,
        progress !== undefined ? progress : null,
        color !== undefined ? color : null,
        milestones !== undefined ? (milestones ? JSON.stringify(milestones) : null) : null,
        completed_by !== undefined ? completed_by : null,
        completed_dates !== undefined ? (completed_dates ? JSON.stringify(completed_dates) : null) : null,
        streak !== undefined ? streak : null,
        notes !== undefined ? notes : null,
        ai_generated !== undefined ? ai_generated : null,
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
      prepChecklist: Array.isArray(row.prep_checklist) ? row.prep_checklist : JSON.parse(row.prep_checklist || '[]'),
      weekOffset: parseInt(row.week_offset) || 0,
    }));
    
    res.json(formattedEvents);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Error fetching events.' });
  }
});

// Add Calendar Event
app.post('/api/events', authenticateToken, async (req, res) => {
  const { title, start, duration, day, color, type, prepChecklist, weekOffset } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO events (user_id, title, start_hour, duration, day_of_week, color, event_type, prep_checklist, week_offset) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        req.user.id,
        title,
        start,
        duration,
        day,
        color || 'var(--accent-blue)',
        type || 'focus',
        JSON.stringify(prepChecklist || []),
        weekOffset || 0,
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
      prepChecklist: Array.isArray(row.prep_checklist) ? row.prep_checklist : JSON.parse(row.prep_checklist || '[]'),
      weekOffset: parseInt(row.week_offset) || 0,
    };

    res.status(201).json(formattedEvent);
    
    // Sync with Google Calendar in background
    syncToGoogleCalendar(req.user.id, row.id);
  } catch (err) {
    console.error('Error adding event:', err);
    res.status(500).json({ error: 'Error creating event.' });
  }
});

// Update Calendar Event
app.put('/api/events/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, start, duration, day, color, type, prepChecklist, weekOffset } = req.body;
  try {
    const result = await pool.query(
      `UPDATE events 
       SET title = $1,
           start_hour = $2,
           duration = $3,
           day_of_week = $4,
           color = $5,
           event_type = $6,
           prep_checklist = $7::jsonb,
           week_offset = $8
       WHERE user_id = $9 AND id = $10 
       RETURNING *`,
      [
        title,
        Number(start),
        Number(duration),
        Number(day),
        color || 'var(--accent-blue)',
        type || 'focus',
        JSON.stringify(prepChecklist || []),
        Number(weekOffset || 0),
        req.user.id,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found or unauthorized.' });
    }

    const row = result.rows[0];
    const formatted = {
      id: String(row.id),
      title: row.title,
      start: parseFloat(row.start_hour),
      duration: parseFloat(row.duration),
      day: row.day_of_week,
      color: row.color,
      type: row.event_type,
      prepChecklist: Array.isArray(row.prep_checklist) ? row.prep_checklist : JSON.parse(row.prep_checklist || '[]'),
      weekOffset: parseInt(row.week_offset) || 0,
    };

    res.json(formatted);
    
    // Sync with Google Calendar in background
    syncToGoogleCalendar(req.user.id, row.id);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: 'Error updating event.' });
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

    const row = result.rows[0];
    res.json({ message: 'Event deleted successfully.' });

    // Delete from Google Calendar in background
    if (row && row.google_event_id) {
      deleteFromGoogleCalendar(req.user.id, row.google_event_id);
    }
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Error deleting event.' });
  }
});

// ------------------- FOCUS SESSIONS CRUD ROUTES -------------------

// Get Focus Sessions
app.get('/api/focus-sessions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM focus_sessions WHERE user_id = $1 ORDER BY id DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching focus sessions:', err);
    res.status(500).json({ error: 'Error fetching focus sessions.' });
  }
});

// Add Focus Session
app.post('/api/focus-sessions', authenticateToken, async (req, res) => {
  const { name, notes, duration } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO focus_sessions (user_id, name, notes, duration) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, name, notes || '', duration]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding focus session:', err);
    res.status(500).json({ error: 'Error creating focus session.' });
  }
});

// Delete Focus Session
app.delete('/api/focus-sessions/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM focus_sessions WHERE user_id = $1 AND id = $2 RETURNING *', [
      req.user.id,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Focus session not found or unauthorized.' });
    }

    res.json({ message: 'Focus session deleted successfully.', session: result.rows[0] });
  } catch (err) {
    console.error('Error deleting focus session:', err);
    res.status(500).json({ error: 'Error deleting focus session.' });
  }
});

// ------------------- CONVERSATIONS & MESSAGES CRUD ROUTES -------------------

// Get Conversations
app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM conversations WHERE user_id = $1 ORDER BY pinned DESC, created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: 'Error fetching conversations.' });
  }
});

// Add Conversation
app.post('/api/conversations', authenticateToken, async (req, res) => {
  const { title } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING *`,
      [req.user.id, title || 'New Conversation']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding conversation:', err);
    res.status(500).json({ error: 'Error creating conversation.' });
  }
});

// Update Conversation (Rename / Pin)
app.put('/api/conversations/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, pinned } = req.body;
  try {
    const result = await pool.query(
      `UPDATE conversations 
       SET title = COALESCE($3, title),
           pinned = COALESCE($4, pinned)
       WHERE user_id = $1 AND id = $2 RETURNING *`,
      [req.user.id, id, title, pinned]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found or unauthorized.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating conversation:', err);
    res.status(500).json({ error: 'Error updating conversation.' });
  }
});

// Delete Conversation
app.delete('/api/conversations/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM conversations WHERE user_id = $1 AND id = $2 RETURNING *', [
      req.user.id,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found or unauthorized.' });
    }

    res.json({ message: 'Conversation deleted successfully.' });
  } catch (err) {
    console.error('Error deleting conversation:', err);
    res.status(500).json({ error: 'Error deleting conversation.' });
  }
});

// Get Messages
app.get('/api/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  const { conversationId } = req.params;
  try {
    const convCheck = await pool.query('SELECT * FROM conversations WHERE user_id = $1 AND id = $2', [req.user.id, conversationId]);
    if (convCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized to access this conversation.' });
    }

    const result = await pool.query('SELECT * FROM messages WHERE conversation_id = $1 ORDER BY id ASC', [conversationId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Error fetching messages.' });
  }
});

// Add Message
app.post('/api/conversations/:conversationId/messages', authenticateToken, async (req, res) => {
  const { conversationId } = req.params;
  const { role, text } = req.body;
  try {
    const convCheck = await pool.query('SELECT * FROM conversations WHERE user_id = $1 AND id = $2', [req.user.id, conversationId]);
    if (convCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Unauthorized to access this conversation.' });
    }

    const result = await pool.query(
      `INSERT INTO messages (conversation_id, role, text) VALUES ($1, $2, $3) RETURNING *`,
      [conversationId, role, text]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding message:', err);
    res.status(500).json({ error: 'Error creating message.' });
  }
});

// ------------------- FINANCE CRUD ROUTES -------------------

// Transactions Endpoints
app.get('/api/finance/transactions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC, id DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Error fetching transactions.' });
  }
});

app.post('/api/finance/transactions', authenticateToken, async (req, res) => {
  const { type, amount, category, date, time, merchant, payment_method, notes, recurring, recurring_frequency, tags, receipt_url } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, amount, category, date, time, merchant, payment_method, notes, recurring, recurring_frequency, tags, receipt_url) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        req.user.id,
        type,
        amount,
        category,
        date,
        time || '',
        merchant || '',
        payment_method || 'Cash',
        notes || '',
        recurring || false,
        recurring_frequency || '',
        JSON.stringify(tags || []),
        receipt_url || ''
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding transaction:', err);
    res.status(500).json({ error: 'Error adding transaction.' });
  }
});

app.put('/api/finance/transactions/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { type, amount, category, date, time, merchant, payment_method, notes, recurring, recurring_frequency, tags, receipt_url } = req.body;
  try {
    const result = await pool.query(
      `UPDATE transactions 
       SET type = COALESCE($3, type),
           amount = COALESCE($4, amount),
           category = COALESCE($5, category),
           date = COALESCE($6, date),
           time = COALESCE($7, time),
           merchant = COALESCE($8, merchant),
           payment_method = COALESCE($9, payment_method),
           notes = COALESCE($10, notes),
           recurring = COALESCE($11, recurring),
           recurring_frequency = COALESCE($12, recurring_frequency),
           tags = COALESCE($13, tags),
           receipt_url = COALESCE($14, receipt_url)
       WHERE user_id = $1 AND id = $2 RETURNING *`,
      [
        req.user.id,
        id,
        type,
        amount,
        category,
        date,
        time,
        merchant,
        payment_method,
        notes,
        recurring,
        recurring_frequency,
        tags ? JSON.stringify(tags) : null,
        receipt_url
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ error: 'Error updating transaction.' });
  }
});

app.delete('/api/finance/transactions/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM transactions WHERE user_id = $1 AND id = $2 RETURNING *',
      [req.user.id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized.' });
    }
    res.json({ message: 'Transaction deleted successfully.', transaction: result.rows[0] });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ error: 'Error deleting transaction.' });
  }
});

// Budgets Endpoints
app.get('/api/finance/budgets', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM budgets WHERE user_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching budgets:', err);
    res.status(500).json({ error: 'Error fetching budgets.' });
  }
});

app.post('/api/finance/budgets', authenticateToken, async (req, res) => {
  const { category, amount, month_year } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO budgets (user_id, category, amount, month_year) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (user_id, category, month_year) 
       DO UPDATE SET amount = EXCLUDED.amount 
       RETURNING *`,
      [req.user.id, category, amount, month_year]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding budget:', err);
    res.status(500).json({ error: 'Error adding budget.' });
  }
});

app.delete('/api/finance/budgets/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM budgets WHERE user_id = $1 AND id = $2 RETURNING *',
      [req.user.id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Budget not found or unauthorized.' });
    }
    res.json({ message: 'Budget deleted successfully.', budget: result.rows[0] });
  } catch (err) {
    console.error('Error deleting budget:', err);
    res.status(500).json({ error: 'Error deleting budget.' });
  }
});

// Savings Goals Endpoints
app.get('/api/finance/savings-goals', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM savings_goals WHERE user_id = $1 ORDER BY id DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching savings goals:', err);
    res.status(500).json({ error: 'Error fetching savings goals.' });
  }
});

app.post('/api/finance/savings-goals', authenticateToken, async (req, res) => {
  const { name, target_amount, saved_amount, target_date, color, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO savings_goals (user_id, name, target_amount, saved_amount, target_date, color, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        req.user.id,
        name,
        target_amount,
        saved_amount || 0,
        target_date || '',
        color || 'var(--accent-blue)',
        notes || ''
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding savings goal:', err);
    res.status(500).json({ error: 'Error adding savings goal.' });
  }
});

app.put('/api/finance/savings-goals/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, target_amount, saved_amount, target_date, color, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE savings_goals 
       SET name = COALESCE($3, name),
           target_amount = COALESCE($4, target_amount),
           saved_amount = COALESCE($5, saved_amount),
           target_date = COALESCE($6, target_date),
           color = COALESCE($7, color),
           notes = COALESCE($8, notes)
       WHERE user_id = $1 AND id = $2 RETURNING *`,
      [
        req.user.id,
        id,
        name,
        target_amount,
        saved_amount,
        target_date,
        color,
        notes
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Savings goal not found or unauthorized.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating savings goal:', err);
    res.status(500).json({ error: 'Error updating savings goal.' });
  }
});

app.delete('/api/finance/savings-goals/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM savings_goals WHERE user_id = $1 AND id = $2 RETURNING *',
      [req.user.id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Savings goal not found or unauthorized.' });
    }
    res.json({ message: 'Savings goal deleted successfully.', goal: result.rows[0] });
  } catch (err) {
    console.error('Error deleting savings goal:', err);
    res.status(500).json({ error: 'Error deleting savings goal.' });
  }
});

// Bills Endpoints
app.get('/api/finance/bills', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM bills WHERE user_id = $1 ORDER BY due_date ASC, id DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching bills:', err);
    res.status(500).json({ error: 'Error fetching bills.' });
  }
});

app.post('/api/finance/bills', authenticateToken, async (req, res) => {
  const { title, amount, due_date, category, paid, recurring } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO bills (user_id, title, amount, due_date, category, paid, recurring) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        req.user.id,
        title,
        amount,
        due_date,
        category,
        paid || false,
        recurring || false
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding bill:', err);
    res.status(500).json({ error: 'Error adding bill.' });
  }
});

app.put('/api/finance/bills/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, amount, due_date, category, paid, recurring } = req.body;
  try {
    const result = await pool.query(
      `UPDATE bills 
       SET title = COALESCE($3, title),
           amount = COALESCE($4, amount),
           due_date = COALESCE($5, due_date),
           category = COALESCE($6, category),
           paid = COALESCE($7, paid),
           recurring = COALESCE($8, recurring)
       WHERE user_id = $1 AND id = $2 RETURNING *`,
      [
        req.user.id,
        id,
        title,
        amount,
        due_date,
        category,
        paid,
        recurring
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found or unauthorized.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating bill:', err);
    res.status(500).json({ error: 'Error updating bill.' });
  }
});

app.delete('/api/finance/bills/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM bills WHERE user_id = $1 AND id = $2 RETURNING *',
      [req.user.id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bill not found or unauthorized.' });
    }
    res.json({ message: 'Bill deleted successfully.', bill: result.rows[0] });
  } catch (err) {
    console.error('Error deleting bill:', err);
    res.status(500).json({ error: 'Error deleting bill.' });
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
