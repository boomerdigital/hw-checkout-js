#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const fs = require('fs');

console.log('🚀 Starting Checkout.js deployment...');
console.log('');

// Forward all args (e.g., --env=production) to generate-env script
const args = process.argv.slice(2);

// 1) Generate environment configuration from the selected env file
console.log('📝 Step 1: Setting up environment configuration...');
const genEnv = spawnSync(process.execPath, ['scripts/generate-env.cjs', ...args], {
  stdio: 'inherit',
});
if (genEnv.status !== 0) {
  console.error('❌ Failed to configure environment');
  process.exit(genEnv.status || 1);
}

// 2) Build the checkout.js bundle
console.log('🔨 Step 2: Building checkout.js bundle...');
const build = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
});

if (build.status !== 0) {
  console.error('❌ Build failed');
  process.exit(build.status || 1);
}

// 3) Show deployment summary
console.log('');
console.log('✅ Deployment completed successfully!');
console.log('');
console.log('📋 Next Steps:');
console.log('1. Upload the dist/ folder contents to your BigCommerce store');
console.log('2. Ensure the store is configured to use the uploaded checkout files');
console.log('');

// 4) Restore backup if we modified .env
if (fs.existsSync('.env.backup')) {
  const envArg = process.argv.find(arg => arg.startsWith('--env='));
  if (envArg) {
    fs.copyFileSync('.env.backup', '.env');
    fs.unlinkSync('.env.backup');
    console.log('🔄 Restored original .env configuration');
  }
}

console.log('🎉 Deployment script completed!');

process.exit(0);
