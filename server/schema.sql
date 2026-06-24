-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- Nullable for Google-only users
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'medium',
  due VARCHAR(50) DEFAULT 'No due date',
  category VARCHAR(50) DEFAULT 'General',
  subtasks JSONB DEFAULT '[]', -- JSON string list: ["Subtask 1", "Subtask 2"]
  risk INT DEFAULT 0,
  ai_generated BOOLEAN DEFAULT FALSE,
  notes TEXT DEFAULT '',
  sessions_count INT DEFAULT 0,
  activity_log JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migrations
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sessions_count INT DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS activity_log JSONB DEFAULT '[]';

-- Habits Table
CREATE TABLE IF NOT EXISTS habits (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  target VARCHAR(100) NOT NULL,
  streak INT DEFAULT 0,
  best INT DEFAULT 0,
  rate INT DEFAULT 0,
  week JSONB DEFAULT '[false,false,false,false,false,false,false]', -- Mon-Sun completion array
  color VARCHAR(50) DEFAULT 'var(--accent-blue)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goals Table
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) DEFAULT 'Personal',
  progress INT DEFAULT 0,
  color VARCHAR(50) DEFAULT 'var(--accent-blue)',
  milestones JSONB DEFAULT '[]', -- JSON milestones array: [{"text": "M1", "done": false}]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  start_hour NUMERIC(4,2) NOT NULL,
  duration NUMERIC(4,2) NOT NULL,
  day_of_week INT NOT NULL, -- 0 (Sun) to 6 (Sat)
  color VARCHAR(50) DEFAULT 'var(--accent-blue)',
  event_type VARCHAR(50) DEFAULT 'focus', -- focus, study, break, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
