const mongoose = require('mongoose');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');
require('dotenv').config();

// Import the User model schema (same as in models/user.js)
const userSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true, minlength: 5 },
        passwordHistory: [{ type: String }],
        failedLoginAttempts: { type: Number, default: 0 },
        lockUntil: { type: Date, default: null },
        mobile_no: { type: String },
        otp: { type: String },
        passwordChangedAt: { type: Date },
        activeTokens: [{
            token: { type: String },
            deviceInfo: {
                userAgent: { type: String },
                platform: { type: String },
                language: { type: String },
                ipAddress: { type: String }
            },
            createdAt: { type: Date, default: Date.now }
        }],
        blacklistedTokens: [{ type: String }],
        psId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PoliceStation",
        },
        role: { type: String, required: true, default: "user" },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model('User', userSchema);

// Load seed data
const seedData = require('./seed-users.json');

async function seedUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log('✅ Connected to MongoDB\n');

        const usersToSeed = seedData.users_to_seed;
        console.log(`📋 Found ${usersToSeed.length} users to seed\n`);

        let created = 0;
        let skipped = 0;
        let errors = 0;

        for (const userData of usersToSeed) {
            try {
                // Check if user already exists
                const existingUser = await User.findOne({ email: userData.email });
                if (existingUser) {
                    console.log(`⏭️  Skipped (exists): ${userData.email}`);
                    skipped++;
                    continue;
                }

                // Hash the password using SHA256 (same as frontend does)
                const hashedPassword = CryptoJS.SHA256(userData.default_password).toString(CryptoJS.enc.Hex);

                // Create new user with same schema as existing users
                const newUser = new User({
                    email: userData.email,
                    password: hashedPassword,
                    mobile_no: userData.mobile_no,
                    role: userData.role,
                    passwordHistory: [],
                    failedLoginAttempts: 0,
                    lockUntil: null,
                    activeTokens: [],
                    blacklistedTokens: [],
                });

                await newUser.save();
                console.log(`✅ Created: ${userData.email} (${userData.office_name})`);
                created++;
            } catch (err) {
                console.log(`❌ Error creating ${userData.email}: ${err.message}`);
                errors++;
            }
        }

        console.log('\n========== SUMMARY ==========');
        console.log(`✅ Created: ${created}`);
        console.log(`⏭️  Skipped: ${skipped}`);
        console.log(`❌ Errors:  ${errors}`);
        console.log(`📊 Total:   ${usersToSeed.length}`);
        console.log('==============================\n');

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    } catch (err) {
        console.error('❌ Fatal error:', err.message);
        process.exit(1);
    }
}

seedUsers();
