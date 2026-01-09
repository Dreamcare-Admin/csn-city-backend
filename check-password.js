const CryptoJS = require('crypto-js');

const storedHash = "15672146cdca6ebc43ea37d690abfd9ce13ba48ee0a4c01872077b5d9501aeb3";
const passwordAttempt = "Hello@4251";

const calculatedHash = CryptoJS.SHA256(passwordAttempt).toString(CryptoJS.enc.Hex);

console.log("Stored Hash:     ", storedHash);
console.log("Calculated Hash: ", calculatedHash);

if (storedHash === calculatedHash) {
  console.log("✅ Match! Password is correct.");
} else {
  console.log("❌ Mismatch! Password is incorrect.");
}
