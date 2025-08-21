# Handcuff Warehouse Checkout JS

Custom BigCommerce Checkout JS implementation with integrated Avalara tax exemption certificate management for Handcuff Warehouse.

## Environment Configuration

This project uses environment-specific configuration files for multi-environment deployments:

### Environment Files

Create the following environment files in the project root:

#### `.env.staging`
```bash
PORT=8080
MODE=replay

# BigCommerce API Configuration
ACCESS_TOKEN=your_staging_access_token
CLIENT_NAME=Custom-checkout
CLIENT_ID=your_staging_client_id
CLIENT_SECRET=your_staging_client_secret

# Store Configuration
STORE_HASH=5ytm98vliq
STORE_URL=https://bmstaging.mybigcommerce.com

# Lambda API Configuration
API_URL=https://yx1041xohb.execute-api.us-east-2.amazonaws.com/Prod

# Certificate Configuration
COMPANY_CODE=BOOMER
COMPANY_ID=866140
```

#### `.env.production`
```bash
PORT=8080
MODE=replay

# BigCommerce API Configuration
ACCESS_TOKEN=your_production_access_token
CLIENT_NAME=Custom-checkout
CLIENT_ID=your_production_client_id
CLIENT_SECRET=your_production_client_secret

# Store Configuration
STORE_HASH=83ivwebri3
STORE_URL=https://www.handcuffwarehouse.com

# Lambda API Configuration
API_URL=https://61oz9fx2d9.execute-api.us-east-2.amazonaws.com/Prod

# Certificate Configuration
COMPANY_CODE=BOOMER
COMPANY_ID=866140
```

### Environment Variables

- `STORE_HASH`: BigCommerce store identifier (environment-specific)
- `API_URL`: Lambda API endpoint for certificate management
- `ACCESS_TOKEN`: BigCommerce API access token
- `CLIENT_ID/CLIENT_SECRET`: BigCommerce app credentials
- `COMPANY_CODE/COMPANY_ID`: Avalara company identification

## Deployment Instructions

### Prerequisites

Install dependencies:

```bash
npm ci
```

### Deploy to Staging

```bash
npm run deploy -- --env=staging
```

### Deploy to Production

```bash
npm run deploy -- --env=production
```

### Manual Build Process

For development or troubleshooting:

1. Generate environment configuration:
   ```bash
   node scripts/generate-env.cjs --env=staging  # or --env=production
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Upload to BigCommerce control panel or use API deployment

## Development Setup

For local development with watch mode:

```bash
npm run dev
```

For local testing server:

```bash
npm run dev:server
```

Then enter the local URL (e.g., `http://127.0.0.1:8080/auto-loader-dev.js`) in BigCommerce Checkout Settings.

## Tax Certificate Integration

This checkout includes custom Avalara certificate management:

### Key Features

- **Certificate Creation**: Modal-based form with state-specific exemption reasons
- **Real-time Tax Calculation**: Applies certificates during checkout
- **Customer Validation**: BigCommerce JWT token authentication
- **Environment Isolation**: Separate store hashes prevent data cross-contamination

### Key Files

- `packages/core/src/app/avalara-certificates/`: Certificate management components
- `packages/core/src/app/avalara-certificates/taxCalculation.ts`: Tax calculation with certificate application
- `packages/core/src/app/avalara-certificates/stateReasons.ts`: State-specific exemption reasons
- `scripts/generate-env.cjs`: Environment configuration management
- `scripts/deploy.cjs`: Automated deployment script

### Certificate Data Flow

```
Checkout Form → Customer JWT → Lambda Authorizer → Avalara API → Tax Calculation
```

### State-Based Exemption Logic

The system maps US states and Canadian provinces to valid exemption reason codes:
- Federal Government
- Local Government  
- Resale
- Tribal Government
- (State-specific variations)

## Architecture Notes

### Multi-Environment Isolation

Each environment uses:
- Separate BigCommerce store hashes
- Distinct Lambda API endpoints  
- Isolated Avalara company configurations
- Environment-specific customer code prefixes

This prevents certificate cross-contamination between staging and production.

### Webpack Environment Injection

The build system uses `DefinePlugin` to inject environment variables into the client-side bundle, enabling dynamic API configurations.

---

# Original BigCommerce Documentation

## Requirements

In order to build from the source code, you must have the following set up in your development environment.

* Node >= v20.
* NPM >= v9.
* Unix-based operating system. (WSL on Windows)

One of the simplest ways to install Node is using [NVM](https://github.com/nvm-sh/nvm#installation-and-update). You can follow their instructions to set up your environment if it is not already set up.

## Development

Once you have cloned the repository and set up your environment, you can start developing with it.

First, you have to pull in the dependencies required for the application.

```sh
npm ci
```

After that, you can make changes to the source code and run the following command to build it.

```sh
npm run build
```

If you are developing the application locally and want to build the source code in watch mode, you can run the following command:

```sh
npm run dev
```

If you want to create a prerelease (i.e.: `alpha`) for testing in the integration environment, you can run the following command:

```sh
npm run release:alpha
```

After that, you need to push the prerelease tag to your fork so it can be referenced remotely.

### Testing

To run E2E tests, use the following command:

```sh
npm run e2e
```

The E2E tests in this project use HAR files to stub network calls. If you need to manually update the HAR files to make minor changes to the requests, you must run the command below to regenerate the ID for each updated request. Otherwise, the stubs will not function properly.

```sh
npm run regenerate-har
```

## Custom Checkout installation

Follow [this guide](https://developer.bigcommerce.com/stencil-docs/customizing-checkout/installing-custom-checkouts) for instructions on how to fork and install this app as a Custom Checkout in your store.

If you want to test your checkout implementation, you can run:
```sh
npm run dev:server
```

And enter the local URL for `auto-loader-dev.js` in Checkout Settings, e.g `http://127.0.0.1:8080/auto-loader-dev.js`

## Release

Everytime a PR is merged to the master branch, CircleCI will trigger a build automatically. However, it won't create a new Git release until it is approved by a person with write access to the repository. If you have write access, you can approve a release job by going to [CircleCI](https://circleci.com/gh/bigcommerce/workflows/checkout-js/tree/master) and look for the job you wish to approve. You can also navigate directly to the release job by clicking on the yellow dot next to the merged commit.


## Contribution

We currently do not accept Pull Requests from external parties. However, if you are an external party and want to report a bug or provide your feedback, you are more than welcome to raise a GitHub Issue. We will attend to these issues as quickly as we can.

More information can be found in the [contribution guide](CONTRIBUTING.md) and [code of conduct](CODE_OF_CONDUCT.md) for this project.


Copyright (C) 2019-Present BigCommerce Inc. All rights reserved.
