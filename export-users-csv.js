const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  mobile_no: String,
  role: String,
  psId: { type: mongoose.Schema.Types.ObjectId, ref: "PoliceStation" },
  createdAt: Date,
  updatedAt: Date,
});

const User = mongoose.model('User', userSchema);

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB\n');

    const users = await User.find({}).lean();
    console.log(`Found ${users.length} users\n`);

    // CSV Header
    const csvHeader = 'Sr.No,Email,Password (Hashed),Mobile No,Role,Police Station ID,Created At';
    const csvRows = [csvHeader];

    users.forEach((user, index) => {
      const row = [
        index + 1,
        user.email || '',
        user.password || '',
        user.mobile_no || '',
        user.role || '',
        user.psId || '',
        user.createdAt ? user.createdAt.toISOString() : ''
      ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
      
      csvRows.push(row);
    });

    const csvContent = csvRows.join('\n');
    
    // Write to frontend users.json location as CSV
    fs.writeFileSync('../csn-city-frontend/users.csv', csvContent);
    console.log('✅ Exported to ../csn-city-frontend/users.csv');
    
    // Also create a JSON version
    const jsonData = users.map((user, index) => ({
      sr_no: index + 1,
      email: user.email,
      password_hash: user.password,
      mobile_no: user.mobile_no || null,
      role: user.role,
      psId: user.psId || null,
      createdAt: user.createdAt
    }));
    
    fs.writeFileSync('../csn-city-frontend/users.json', JSON.stringify(jsonData, null, 2));
    console.log('✅ Exported to ../csn-city-frontend/users.json');

    // Print summary
    console.log('\n========== SUMMARY ==========');
    users.forEach((user, i) => {
      console.log(`${i+1}. ${user.email} | ${user.role}`);
    });
    console.log('==============================');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
