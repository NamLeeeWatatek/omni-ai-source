#!/usr/bin/env node

/**
 * Quick setup script for encryption key
 * Usage: node setup-encryption.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Wataomi Encryption Setup\n');

// Generate a secure 32-byte key
const encryptionKey = crypto.randomBytes(32).toString('hex');

console.log('✅ Generated secure encryption key:');
console.log(`   ${encryptionKey}\n`);

// Check if .env exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from .env.example...');

    if (fs.existsSync(envExamplePath)) {
        let envContent = fs.readFileSync(envExamplePath, 'utf8');

        // Replace the placeholder with actual key
        envContent = envContent.replace(
            'ENCRYPTION_KEY=your-secure-64-character-hex-key-here-generate-with-command-above',
            `ENCRYPTION_KEY=${encryptionKey}`
        );

        fs.writeFileSync(envPath, envContent);
        console.log('✅ Created .env file with encryption key\n');
    } else {
        console.log('⚠️  .env.example not found. Creating minimal .env...\n');
        fs.writeFileSync(envPath, `ENCRYPTION_KEY=${encryptionKey}\n`);
    }
} else {
    console.log('⚠️  .env file already exists.');
    console.log('   Please manually add this line to your .env file:\n');
    console.log(`   ENCRYPTION_KEY=${encryptionKey}\n`);
}

console.log('📋 Next steps:');
console.log('   1. Review your .env file');
console.log('   2. Add other required environment variables');
console.log('   3. NEVER commit .env to Git!');
console.log('   4. Use different keys for dev/staging/production\n');

console.log('💡 To generate another key, run:');
console.log('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');

console.log('✅ Setup complete!\n');
