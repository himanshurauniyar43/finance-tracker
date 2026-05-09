require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/database');

async function seedUsers() {
  const salt = await bcrypt.genSalt(12);
  
  const users = [
    { username: 'admin', email: 'admin@test.com', password: 'admin123', role: 'admin' },
    { username: 'user', email: 'user@test.com', password: 'user123', role: 'user' },
    { username: 'viewer', email: 'viewer@test.com', password: 'viewer123', role: 'read-only' },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, salt);
    await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [u.username, u.email, hash, u.role]
    );
    console.log('✅ Created:', u.username, '-', u.role);
  }
  
  console.log('\n🎉 Demo users created successfully!');
  await pool.end();
  process.exit();
}

seedUsers().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
