const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  mobile_no: String,
  role: String,
  psId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to MongoDB\n');
    
    const users = await User.find({}, 'email password mobile_no role').lean();
    console.log(`Total users: ${users.length}\n`);
    
    users.forEach((user, i) => {
      console.log(`--- User ${i+1} ---`);
      console.log(`Email:    ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Mobile:   ${user.mobile_no || 'N/A'}`);
      console.log(`Role:     ${user.role}`);
      console.log('');
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
