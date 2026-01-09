const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
const User = mongoose.model('User', userSchema);

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
  
  const user = await User.findOne({ email: 'dcp.zone1@csnpolice.gov.in' });
  console.log('Stored password hash:', user.password);
  
  // What the seed script stored: SHA256(plaintext)
  const plainPassword = 'DcpZone1@2024';
  const seedHash = CryptoJS.SHA256(plainPassword).toString(CryptoJS.enc.Hex);
  console.log('Expected (seed):     ', seedHash);
  console.log('Match:', user.password === seedHash);
  
  await mongoose.disconnect();
}
main();
