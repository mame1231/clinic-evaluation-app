const bcrypt = require('bcryptjs');
  const sqlite3 = require('sqlite3').verbose();

  const db = new sqlite3.Database('./database.sqlite');

  const createTestUsers = async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const now = new Date().toISOString();

    const users = [
      { name: '管理者', email: 'admin@test.com', role: 'admin', rank: 'platinum', password: hashedPassword },
      { name: '看護師テスト', email: 'nurse@test.com', role: 'nurse', rank: 'silver', password: hashedPassword },
      { name: '事務テスト', email: 'office@test.com', role: 'office', rank: 'bronze', password: hashedPassword },
    ];

    for (const user of users) {
      db.run(
        `INSERT OR REPLACE INTO users (name, email, password, role, rank, points, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        [user.name, user.email, user.password, user.role, user.rank, now, now],
        (err) => {
          if (err) {
            console.error(`Error creating ${user.email}:`, err);
          } else {
            console.log(`Created user: ${user.email} (${user.role}, ${user.rank})`);
          }
        }
      );
    }

    setTimeout(() => {
      console.log('Test users created successfully!');
      db.close();
      process.exit(0);
    }, 1000);
  };

  createTestUsers();