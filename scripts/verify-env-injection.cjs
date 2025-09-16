#!/usr/bin/env node

// Script to verify that webpack DefinePlugin is working correctly
// This will check if the environment variables are properly embedded in the build

const fs = require('fs');
const path = require('path');

console.log('🔍 Searching for environment variable injection in build files...');

const distDir = path.join(__dirname, 'dist');
const jsFiles = [];

// Recursively find all JS files
function findJsFiles(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            findJsFiles(filePath);
        } else if (file.endsWith('.js') && !file.endsWith('.map')) {
            jsFiles.push(filePath);
        }
    }
}

findJsFiles(distDir);

console.log(`📄 Found ${jsFiles.length} JavaScript files in dist/`);

let foundProduction = false;
let foundStaging = false;
const productionPatterns = [
    'b7q71nfgm2',
    'npqb1dowfj7yeh7d1fqwhcod7wqs6al', 
    '83ivwebri3'
];
const stagingPatterns = [
    'yx1041xohb',
    'bzhkzdt0f7vrrg92o4iym8rxvd872qj',
    '5ytm98vliq'
];

for (const jsFile of jsFiles) {
    try {
        const content = fs.readFileSync(jsFile, 'utf8');
        
        // Check for production patterns
        for (const pattern of productionPatterns) {
            if (content.includes(pattern)) {
                console.log(`✅ Found production pattern "${pattern}" in ${path.basename(jsFile)}`);
                foundProduction = true;
            }
        }
        
        // Check for staging patterns (should not be found)
        for (const pattern of stagingPatterns) {
            if (content.includes(pattern)) {
                console.log(`⚠️  Found staging pattern "${pattern}" in ${path.basename(jsFile)} (should be production!)`);
                foundStaging = true;
            }
        }
        
        // Check for unresolved environment variables
        if (content.includes('process.env')) {
            console.log(`❌ Found unresolved environment variable in ${path.basename(jsFile)}`);
        }
        
    } catch (error) {
        console.log(`⚠️  Could not read ${jsFile}: ${error.message}`);
    }
}

console.log('\n📊 Environment Variable Injection Results:');
console.log(`✅ Production configuration found: ${foundProduction ? 'YES' : 'NO'}`);
console.log(`⚠️  Staging configuration found: ${foundStaging ? 'YES' : 'NO'}`);

if (foundProduction && !foundStaging) {
    console.log('🎉 SUCCESS: Build correctly uses production configuration!');
    process.exit(0);
} else if (!foundProduction && !foundStaging) {
    console.log('🤔 UNKNOWN: No environment configuration patterns found in build');
    process.exit(1);
} else {
    console.log('❌ ERROR: Build contains incorrect configuration');
    process.exit(1);
}
