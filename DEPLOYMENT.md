# Checkout.js Multi-Environment Deployment

This project now supports environment-specific deployments to prevent certificate ID cross-contamination between staging and production.

## Quick Start

### Deploy to Staging (Default)
```bash
npm run deploy
```

### Deploy to Production
```bash
npm run deploy -- --env=production
```

## Environment Files

- **`.env`** - Staging configuration (default)
  - `STORE_HASH=5ytm98vliq`
  - Uses staging BigCommerce store and Lambda API

- **`.env.production`** - Production configuration  
  - `STORE_HASH=83ivwebri3`
  - Uses production BigCommerce store and Lambda API

## What the Deploy Script Does

1. **Environment Setup** (`scripts/generate-env.cjs`)
   - Validates the target environment file exists
   - Checks required environment variables
   - Temporarily sets the correct `.env` for the build
   - Shows configuration summary

2. **Build Process** 
   - Runs `npm run build` with the selected environment
   - Webpack DefinePlugin injects `STORE_HASH` into the bundle
   - Creates environment-specific `dist/` folder

3. **Cleanup**
   - Restores original `.env` configuration
   - Provides next steps for upload

## Critical Fix

The deploy script ensures:
- **Staging customers** create transactions with `customerCode: "5ytm98vliq_123"`
- **Production customers** create transactions with `customerCode: "83ivwebri3_123"`

This prevents North Carolina customers from seeing Florida customers' certificate IDs.

## Required Environment Variables

Each `.env` file must contain:
- `STORE_HASH` - BigCommerce store identifier
- `ACCESS_TOKEN` - BigCommerce API token  
- `CLIENT_ID` - BigCommerce app client ID
- `API_URL` - Lambda API endpoint (environment-specific)

## Manual Upload Required

After running the deploy script, you must manually upload the `dist/` folder contents to your BigCommerce store's checkout configuration.

## Troubleshooting

- If deploy fails, check that the environment file exists and contains all required variables
- Ensure you have the correct BigCommerce API permissions for the target store
- Verify the Lambda API endpoints are deployed and accessible
