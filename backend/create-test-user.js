const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

async function createTestUsers() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const users = [
    { name: '管理者', email: 'admin@test.com', role: 'admin' },
    { name: '看護師1', email: 'nurse@test.com', role: 'nurse' },
    { name: '事務員1', email: 'office@test.com', role: 'office' }
  ];

  for (const user of users) {
    db.run(
      `INSERT INTO users (name, email, password, role, points, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, 0, datetime('now'), datetime('now'))`,
      [user.name, user.email, hashedPassword, user.role],
      (err) => {
        if (err) {
          console.error(`Error creating ${user.name}:`, err.message);
        } else {
          console.log(`✅ Created user: ${user.name} (${user.email})`);
        }
      }
    );
  }
  
  setTimeout(() => {
    db.close();
    console.log('\n全てのテストユーザーを作成しました！');
    console.log('パスワード: password123');
  }, 1000);
}

createTestUsers();