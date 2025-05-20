const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ussd.db');

db.serialize(() => {
  // Create Sessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      sessionID TEXT PRIMARY KEY,
      phoneNumber TEXT,
      userInput TEXT,
      language TEXT
    )
  `);

  // Create Transactions table
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionID TEXT,
      phoneNumber TEXT,
      drink_name TEXT,
      quantity INTEGER,
      total_price REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sessionID) REFERENCES sessions(sessionID)
    )
  `);
});

db.close(() => {
  console.log("Database initialized and tables created.");
});
