#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

/**
 * Verification script for Handcuff Warehouse Avalara ECM checkout deployment
 * Ensures proper build output and environment configuration
 */
function verifyBuild() {
    console.log('🔍 Verifying checkout.js build for Avalara ECM integration...\n');
    
    const distPath = path.join(__dirname, '..', 'dist');
    const errors = [];
    const warnings = [];
    
    // Check if dist folder exists
    if (!fs.existsSync(distPath)) {
        errors.push('❌ dist/ folder does not exist');
        return { success: false, errors, warnings };
    }
    
    // Check dist folder contents
    const files = fs.readdirSync(distPath);
    if (files.length === 0) {
        errors.push('❌ dist/ folder is empty');
        return { success: false, errors, warnings };
    }
    
    console.log(`✅ Found ${files.length} files in dist/ folder:`);
    files.forEach(file => {
        const filePath = path.join(distPath, file);
        const stats = fs.statSync(filePath);
        console.log(`   📄 ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
    });
    
    // Check for required BigCommerce checkout files
    const requiredPatterns = [
        { pattern: /auto-loader.*\.js$/, name: 'Auto-loader' },
        { pattern: /checkout.*\.js$/, name: 'Checkout bundle' }
    ];
    
    console.log('\n🔍 Checking required files:');
    requiredPatterns.forEach(({ pattern, name }) => {
        const found = files.find(file => pattern.test(file));
        if (found) {
            console.log(`   ✅ ${name}: ${found}`);
        } else {
            warnings.push(`⚠️  ${name} file not found (pattern: ${pattern})`);
        }
    });
    
    // Check for optional but important files
    const optionalFiles = [
        { pattern: /manifest\.json$/, name: 'Manifest' },
        { pattern: /runtime.*\.js$/, name: 'Runtime' },
        { pattern: /.*\.css$/, name: 'Stylesheets' }
    ];
    
    console.log('\n🔍 Checking optional files:');
    optionalFiles.forEach(({ pattern, name }) => {
        const found = files.filter(file => pattern.test(file));
        if (found.length > 0) {
            console.log(`   ✅ ${name}: ${found.length} file(s)`);
        } else {
            console.log(`   ℹ️  ${name}: Not found`);
        }
    });
    
    // Check environment configuration
    console.log('\n🔍 Checking environment configuration:');
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const config = parseEnvFile(envContent);
        
        const requiredEnvVars = ['API_URL', 'API_CLIENT_ID', 'STORE_HASH'];
        requiredEnvVars.forEach(key => {
            if (config[key]) {
                console.log(`   ✅ ${key}: ${config[key]}`);
            } else {
                warnings.push(`⚠️  Missing environment variable: ${key}`);
            }
        });
        
        // Validate environment consistency
        if (config.STORE_HASH) {
            const isProduction = config.STORE_HASH === '83ivwebri3';
            const isStaging = config.STORE_HASH === '5ytm98vliq';
            
            if (isProduction) {
                console.log('   ✅ Environment: PRODUCTION');
                // Expect current production API Gateway host
                if (!config.API_URL?.includes('b7q71nfgm2')) {
                    warnings.push('⚠️  Production store hash with non-production API URL');
                }
            } else if (isStaging) {
                console.log('   ✅ Environment: STAGING');
                if (!config.API_URL?.includes('yx1041xohb')) {
                    warnings.push('⚠️  Staging store hash with non-staging API URL');
                }
            } else {
                warnings.push(`⚠️  Unknown store hash: ${config.STORE_HASH}`);
            }
        }
    } else {
        warnings.push('⚠️  No .env file found');
    }
    
    // Display results
    console.log('\n📊 Verification Results:');
    if (errors.length === 0) {
        console.log('   ✅ Build verification passed!');
    } else {
        console.log('   ❌ Build verification failed!');
    }
    
    if (warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        warnings.forEach(warning => console.log(`   ${warning}`));
    }
    
    if (errors.length > 0) {
        console.log('\n❌ Errors:');
        errors.forEach(error => console.log(`   ${error}`));
    }
    
    // Provide recommendations
    if (errors.length > 0 || warnings.length > 0) {
        console.log('\n💡 Recommendations:');
        if (errors.includes('❌ dist/ folder does not exist')) {
            console.log('   • Run: npm run build:fresh');
        }
        if (warnings.some(w => w.includes('Missing environment variable'))) {
            console.log('   • Ensure .env.production and .env.staging files exist');
            console.log('   • Run: npm run deploy:production or npm run deploy:staging');
        }
        if (warnings.some(w => w.includes('file not found'))) {
            console.log('   • Run: npm run build:force to bypass cache');
        }
    }
    
    return {
        success: errors.length === 0,
        errors,
        warnings,
        fileCount: files.length,
        totalSize: files.reduce((sum, file) => {
            const filePath = path.join(distPath, file);
            const stats = fs.statSync(filePath);
            return sum + stats.size;
        }, 0)
    };
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

if (require.main === module) {
    const result = verifyBuild();
    process.exit(result.success ? 0 : 1);
}

module.exports = { verifyBuild };
