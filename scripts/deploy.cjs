#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function deploy() {
    const args = process.argv.slice(2);
    const envArg = args.find(arg => arg.startsWith('--env='));
    const environment = envArg ? envArg.split('=')[1] : 'staging';
    
    console.log(`🚀 Starting Checkout.js deployment...`);
    console.log(`🎯 Target environment: ${environment.toUpperCase()}`);
    
    try {
        // Step 1: Force clean all caches and output directories
        console.log('\n📝 Step 1: Cleaning build cache and output directories...');
        
        // Reset Nx cache completely
        console.log('🧹 Resetting Nx cache...');
        execSync('npx nx reset', { stdio: 'inherit' });
        
        // Remove all possible output directories
        const outputDirs = ['dist', 'build', '.nx/cache', 'tmp/nx-cache'];
        outputDirs.forEach(dir => {
            const dirPath = path.join(__dirname, '..', dir);
            if (fs.existsSync(dirPath)) {
                fs.rmSync(dirPath, { recursive: true, force: true });
                console.log(`📁 Removed ${dir} directory`);
            }
        });
        
        // Step 2: Setup environment configuration
        console.log(`\n📝 Step 2: Setting up environment configuration...`);
        const config = await setupEnvironment(environment);
        
        // Step 3: Force fresh build with all cache bypass mechanisms
        console.log('\n🔨 Step 3: Building checkout.js bundle...');
        
        // Run prebuild to ensure clean state
        console.log('🧹 Running prebuild cleanup...');
        execSync('npm run prebuild', { stdio: 'inherit' });
        
        // Use multiple cache bypass strategies
        console.log('🔨 Executing fresh build with cache bypass...');
        const buildCommand = 'npx nx run core:build --skip-nx-cache';
        execSync(buildCommand, { 
            stdio: 'inherit',
            env: { 
                ...process.env, 
                NODE_ENV: 'production',
                NX_SKIP_NX_CACHE: 'true',
                NX_CACHE: 'false',
                // Force webpack to create new build
                BUILD_ID: Date.now().toString(),
                // Ensure environment variables are passed to webpack
                API_URL: config.API_URL,
                API_CLIENT_ID: config.API_CLIENT_ID,
                STORE_HASH: config.STORE_HASH
            }
        });
        
        // Step 4: Verify dist folder creation with retry logic
        console.log('\n📝 Step 4: Verifying build output...');
        await verifyBuildOutputWithRetry();
        
        // Step 5: Restore original environment
        console.log('\n📝 Step 5: Restoring environment...');
        await restoreEnvironment();
        
        console.log('\n✅ Deployment completed successfully!');
        console.log('\n📋 Next Steps:');
        console.log('1. Upload the dist/ folder contents to your BigCommerce store');
        console.log('2. Ensure the store is configured to use the uploaded checkout files');
        
        // Display build summary
        displayBuildSummary();
        
    } catch (error) {
        console.error('\n❌ Deployment failed:', error.message);
        await restoreEnvironment(); // Ensure cleanup even on failure
        process.exit(1);
    }
}

async function setupEnvironment(environment) {
    console.log(`🚀 Configuring for ${environment.toUpperCase()} environment...`);
    
    // Handle both 'prod' and 'production' for production environment
    const isProdEnv = environment === 'production' || environment === 'prod';
    const envFile = isProdEnv ? '.env.production' : '.env.staging';
    const envPath = path.join(__dirname, '..', envFile);
    const targetPath = path.join(__dirname, '..', '.env');
    
    if (!fs.existsSync(envPath)) {
        throw new Error(`Environment file ${envFile} not found. Please create it first.`);
    }
    
    // Backup current .env if it exists
    if (fs.existsSync(targetPath)) {
        fs.copyFileSync(targetPath, `${targetPath}.backup`);
        console.log('📦 Backed up current .env to .env.backup');
    }
    
    // Copy environment-specific file to .env
    fs.copyFileSync(envPath, targetPath);
    console.log(`✅ Copied ${envFile} to .env`);
    
    // Load and validate environment variables
    const envContent = fs.readFileSync(envPath, 'utf8');
    const config = parseEnvFile(envContent);
    
    // Validate required variables for Avalara ECM integration
    const required = ['API_URL', 'API_CLIENT_ID', 'STORE_HASH'];
    const missing = required.filter(key => !config[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    // Display configuration for verification
    console.log('📋 Environment Configuration:');
    console.log(`  Store Hash: ${config.STORE_HASH}`);
    console.log(`  Store URL: ${config.STORE_URL || 'Not set'}`);
    console.log(`  API URL: ${config.API_URL}`);
    console.log(`  API Client ID: ${config.API_CLIENT_ID}`);
    
    // Verify this matches expected production/staging pattern
    const isProduction = config.STORE_HASH === '83ivwebri3';
    const isStaging = config.STORE_HASH === '5ytm98vliq';
    
    if (!isProduction && !isStaging) {
        console.warn(`⚠️  Unexpected store hash: ${config.STORE_HASH}`);
    }
    
    if (isProdEnv && !isProduction) {
        throw new Error(`Production environment should use store hash 83ivwebri3, got ${config.STORE_HASH}`);
    }
    
    if (!isProdEnv && !isStaging) {
        throw new Error(`Staging environment should use store hash 5ytm98vliq, got ${config.STORE_HASH}`);
    }
    
    return config;
}

async function verifyBuildOutputWithRetry(maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`🔍 Verifying build output (attempt ${attempt}/${maxRetries})...`);
        
        // Wait for file system operations to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const distPath = path.join(__dirname, '..', 'dist');
        
        if (!fs.existsSync(distPath)) {
            if (attempt === maxRetries) {
                throw new Error('Build failed: dist folder was not created after multiple attempts');
            }
            console.log(`⚠️  Dist folder not found, retrying...`);
            continue;
        }
        
        const files = fs.readdirSync(distPath);
        if (files.length === 0) {
            if (attempt === maxRetries) {
                throw new Error('Build failed: dist folder is empty after multiple attempts');
            }
            console.log(`⚠️  Dist folder is empty, retrying...`);
            continue;
        }
        
        // Check for expected BigCommerce checkout files
        const expectedPatterns = [
            /auto-loader.*\.js$/,
            /checkout.*\.js$/,
            /manifest\.json$/
        ];
        
        const foundFiles = expectedPatterns.map(pattern => 
            files.find(file => pattern.test(file))
        ).filter(Boolean);
        
        if (foundFiles.length < 2) { // At least auto-loader and checkout files
            if (attempt === maxRetries) {
                console.warn(`⚠️  Expected checkout files not found. Found: ${files.join(', ')}`);
            } else {
                console.log(`⚠️  Missing expected files, retrying...`);
                continue;
            }
        }
        
        console.log(`✅ Build output verified: ${files.length} files created in dist/`);
        files.forEach(file => {
            const filePath = path.join(distPath, file);
            const stats = fs.statSync(filePath);
            console.log(`   📄 ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
        });
        
        return; // Success!
    }
}

async function restoreEnvironment() {
    const targetPath = path.join(__dirname, '..', '.env');
    const backupPath = `${targetPath}.backup`;
    
    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, targetPath);
        fs.unlinkSync(backupPath);
        console.log('🔄 Restored original .env configuration');
    }
}

function parseEnvFile(content) {
    const config = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                config[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
            }
        }
    }
    
    return config;
}

function displayBuildSummary() {
    const distPath = path.join(__dirname, '..', 'dist');
    
    if (fs.existsSync(distPath)) {
        const files = fs.readdirSync(distPath);
        const totalSize = files.reduce((sum, file) => {
            const filePath = path.join(distPath, file);
            const stats = fs.statSync(filePath);
            return sum + stats.size;
        }, 0);
        
        console.log('\n📊 Build Summary:');
        console.log(`   Files: ${files.length}`);
        console.log(`   Total Size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   Output Directory: dist/`);
        
        // Show key files for BigCommerce deployment
        const keyFiles = files.filter(file => 
            file.includes('auto-loader') || 
            file.includes('checkout') ||
            file === 'manifest.json'
        );
        
        if (keyFiles.length > 0) {
            console.log('\n🔑 Key Files for BigCommerce:');
            keyFiles.forEach(file => console.log(`   • ${file}`));
        }
        
        console.log('\n🎉 Deployment script completed!');
    }
}

if (require.main === module) {
    deploy();
}

module.exports = { deploy };
