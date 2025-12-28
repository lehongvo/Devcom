# Devcom - Dexcom API Integration

Dexcom API integration for CGM (Continuous Glucose Monitoring) data retrieval and challenge checking.

## Quick Start

```bash
# Install dependencies
yarn install

# Setup environment variables
cp .env.example .env
# Edit .env with your credentials

# Test
node devcom/main.js
```

## Documentation

See [devcom/Readme.md](./devcom/Readme.md) for detailed documentation.

## Features

- ✅ OAuth 2.0 authentication flow
- ✅ Get CGM data (EGVs) from Dexcom API
- ✅ Calculate glucose averages
- ✅ 7-day challenge checking
- ✅ Auto token refresh
- ✅ Support both Sandbox and Production environments

## API Endpoints

- `GET /api/dexcom/credentials` - Get credentials
- `POST /api/dexcom/token` - Exchange code for token
- `GET /api/dexcom/glucose-average` - Get glucose statistics
- `POST /api/dexcom/check-challenge` - Check challenge result

## License

MIT



