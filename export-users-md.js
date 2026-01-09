const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

// Load seed data for default passwords
const seedData = require('./seed-users.json');

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  mobile_no: String,
  role: String,
  psId: { type: mongoose.Schema.Types.ObjectId, ref: "PoliceStation" },
  createdAt: Date,
});

const User = mongoose.model('User', userSchema);

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB\n');

    const users = await User.find({}).sort({ createdAt: 1 }).lean();
    console.log(`Found ${users.length} users\n`);

    // Create password lookup from seed data
    const passwordLookup = {};
    if (seedData.users_to_seed) {
      seedData.users_to_seed.forEach(u => {
        passwordLookup[u.email] = u.default_password;
      });
    }

    // Create markdown content
    let md = `# CSN City Police - User Accounts

> Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

## Summary

| Metric | Value |
|--------|-------|
| Total Users | ${users.length} |
| Admin Users | ${users.filter(u => u.role === 'admin').length} |
| Regular Users | ${users.filter(u => u.role === 'user').length} |

---

## Admin Users

| Sr.No | Email | Mobile No | Default Password |
|-------|-------|-----------|------------------|
`;

    let adminCount = 0;
    let userCount = 0;

    users.filter(u => u.role === 'admin').forEach((user) => {
      adminCount++;
      const defaultPwd = passwordLookup[user.email] || '_(original password)_';
      md += `| ${adminCount} | ${user.email} | ${user.mobile_no || '-'} | ${defaultPwd} |\n`;
    });

    md += `
---

## Police Station / Traffic Users

| Sr.No | Email | Mobile No | Default Password |
|-------|-------|-----------|------------------|
`;

    users.filter(u => u.role === 'user').forEach((user) => {
      userCount++;
      const defaultPwd = passwordLookup[user.email] || '_(original password)_';
      md += `| ${userCount} | ${user.email} | ${user.mobile_no || '-'} | ${defaultPwd} |\n`;
    });

    md += `
---

## Notes

- All passwords for newly seeded users follow the pattern: \`OfficeName@2024\`
- Original users (\`csncitypolice@gmail.com\`, \`admin@dcd.com\`) retain their original passwords
- Passwords are stored as SHA256 hashes in the database
`;

    // Write to frontend
    fs.writeFileSync('../csn-city-frontend/users.md', md);
    console.log('✅ Exported to ../csn-city-frontend/users.md');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
