# Dexcom API Integration

## App Flow (iOS/Android)

### 1. Get Credentials
```
App → GET /api/dexcom/credentials
Backend → Returns: { clientId, redirectUri, loginUrl }
```

### 2. User Login & Authorize

**Sandbox:**
- Open `loginUrl` in WebView
- Select sandbox user (User6/User7/User8/User4)
- Click "Authorize"
- Redirect with `code` in URL

**Production:**
- Open `loginUrl` in WebView
- User enters Dexcom username + password
- User fills name in consent form
- Click "Authorize"
- Redirect with `code` in URL

### 3. Exchange Code for Token
```
App → POST /api/dexcom/token
Body: { code: "XXXXX", userId: "user123" }
Backend → Exchange code → Get tokens → Save to DB
Backend → Returns: { success: true, access_token, expires_in }
```

### 4. Get CGM Data
```
App → GET /api/dexcom/glucose-average?userId=user123&days=7
Backend → Get access_token from DB (by userId)
Backend → Auto refresh if expired
Backend → Call Dexcom API → Calculate stats
Backend → Returns: { average, min, max, count, unit }
```

## Key Points

- **Backend manages tokens** (store in DB, auto refresh)
- **App only sends userId**, doesn't need to know tokens
- **Each user has separate access_token** (stored in DB)
- **Backend auto-refreshes tokens** when expired

## Environment Variables

Create `.env` file:

```env
DEXCOM_CLIENT_ID=your_client_id
DEXCOM_CLIENT_SECRET=your_client_secret
DEXCOM_REDIRECT_URI=https://challenge.stg.com
DEXCOM_SANDBOX_BASE_URL=https://sandbox-api.dexcom.com
DEXCOM_PRODUCTION_BASE_URL=https://api.dexcom.com
DEXCOM_AUTHORIZATION_CODE=your_auth_code  # Optional
```

## API Functions

- `getCredentials()` - Read from env
- `getLoginUrl()` - Generate login URL
- `getAccessToken(code)` - Exchange code for token
- `refreshAccessToken(refreshToken)` - Refresh token
- `getEGVs(accessToken, startDate, endDate)` - Get CGM data
- `calculateGlucoseAverage(egvRecords)` - Calculate average
- `get7DayGlucoseAverage(accessToken)` - 7-day average
- `check7DayChallenge(accessToken, targetGlucose)` - Check challenge

## Usage

```bash
# Test with auth code from .env
node devcom/main.js

# Test with access token
node devcom/main.js <access_token>
```
