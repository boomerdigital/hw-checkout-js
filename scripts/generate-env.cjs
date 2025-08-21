#!/usr/bin/env node
const fs = require('fs');
const dotenv = require('dotenv');

// Default to .env.staging unless --env=production is passed
const envArg = process.argv.find(arg => arg.startsWith('--env='));
let envFile = '.env.staging';  // Default to staging
let backupFile = '.env.backup';

if (envArg) {
	const envValue = envArg.split('=')[1];
	if (envValue === 'prod' || envValue === 'production') {
		envFile = '.env.production';
		console.log('🚀 Configuring for PRODUCTION environment...');
	} else {
		envFile = `.env.${envValue}`;
		console.log(`🔧 Configuring for ${envValue} environment...`);
	}
} else {
	console.log('🔧 Using default STAGING environment (.env.staging)...');
}

// Check if the environment file exists
if (!fs.existsSync(envFile)) {
	console.error(`❌ Environment file ${envFile} not found!`);
	console.error('Available files:');
	const envFiles = fs.readdirSync('.').filter(f => f.startsWith('.env'));
	envFiles.forEach(f => console.error(`  - ${f}`));
	process.exit(1);
}

// Load the environment file to validate required variables
dotenv.config({ path: envFile });

// Validate required environment variables
const requiredVars = ['STORE_HASH', 'ACCESS_TOKEN', 'CLIENT_ID', 'API_URL'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
	console.error(`❌ Missing required environment variables in ${envFile}:`);
	missingVars.forEach(varName => console.error(`  - ${varName}`));
	process.exit(1);
}

// Backup current .env if it exists and we're switching environments
if (envFile !== '.env' && fs.existsSync('.env')) {
	fs.copyFileSync('.env', backupFile);
	console.log(`📦 Backed up current .env to ${backupFile}`);
}

// Copy the selected environment file to .env if needed
if (envFile !== '.env') {
	fs.copyFileSync(envFile, '.env');
	console.log(`✅ Copied ${envFile} to .env`);
}

console.log('📋 Environment Configuration:');
console.log(`  Store Hash: ${process.env.STORE_HASH}`);
console.log(`  Store URL: ${process.env.STORE_URL || 'Not set'}`);
console.log(`  API URL: ${process.env.API_URL || 'Not set'}`);
console.log('');
