# Dexcom API Integration

## Architecture Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   iOS/Android│         │   Backend    │         │   Dexcom    │
│     App      │         │   Server     │         │     API     │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                        │                        │
       │  1. Get credentials    │                        │
       │───────────────────────>│                        │
       │                        │                        │
       │  2. Credentials        │                        │
       │<───────────────────────│                        │
       │                        │                        │
       │  3. Open WebView       │                        │
       │───────────────────────────────────────────────->│
       │                        │                        │
       │  4. User login/auth    │                        │
       │<─────────────────────────────────────────────── │
       │                        │                        │
       │  5. Redirect with code │                        │
       │<─────────────────────────────────────────────── │
       │                        │                        │
       │  6. Exchange code      │                        │
       │───────────────────────────────────────────────> │
       │                        │                        │
       │  7. Get tokens         │                        │
       │<─────────────────────────────────────────────── │
       │                        │                        │
       │  8. Save tokens locally│                        │
       │                        │                        │
       │  9. Get CGM data       │                        │
       │───────────────────────────────────────────────> │
       │                        │                        │
       │  10. Return CGM data   │                        │
       │<─────────────────────────────────────────────── │
       │                        │                        │
```

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

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    OAuth 2.0 Flow                            │
└─────────────────────────────────────────────────────────────┘

Step 1: App requests credentials
   App ──────────> Backend
        GET /api/dexcom/credentials
   App <────────── Backend
        { clientId, redirectUri, loginUrl }

Step 2: User authorization
   App ──────────────────────────────────────> Dexcom
        Open loginUrl in WebView
   User ──────────────────────────────────────> Dexcom
        Login & Authorize
   Dexcom ────────────────────────────────────> App
        Redirect: redirectUri?code=XXXXX

Step 3: Exchange code for token
   App ──────────> Backend
        POST /api/dexcom/token
        { code, userId }
   Backend ──────> Dexcom
        POST /v2/oauth2/token
        { code, client_id, client_secret }
   Dexcom ───────> Backend
        { access_token, refresh_token, expires_in }
   Backend ──────> Database
        Save tokens (linked to userId)
   Backend ──────> App
        { success: true, access_token, expires_in }
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              CGM Data Retrieval Flow                        │
└─────────────────────────────────────────────────────────────┘

App Request
   │
   ├─> GET /api/dexcom/glucose-average?userId=123&days=7
   │
Backend Processing
   │
   ├─> 1. Get userId from request
   │
   ├─> 2. Query Database
   │      └─> Get access_token, refresh_token (by userId)
   │
   ├─> 3. Check token expiry
   │      ├─> If expired ──> Refresh token
   │      │     └─> POST /v2/oauth2/token (refresh_token)
   │      │     └─> Update DB with new tokens
   │      └─> If valid ──> Use existing token
   │
   ├─> 4. Call Dexcom API
   │      └─> GET /v3/users/self/egvs
   │          Headers: Authorization: Bearer {access_token}
   │          Params: startDate, endDate
   │
   ├─> 5. Process Data
   │      └─> Calculate statistics (average, min, max)
   │
   └─> 6. Return Response
          └─> { average, min, max, count, unit, ... }
```

## Token Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│              Token Lifecycle                                 │
└─────────────────────────────────────────────────────────────┘

Authorization Code (one-time use)
        │
        ├─> Exchange ──> Access Token (expires in 2 hours)
        │                      │
        │                      ├─> Use for API calls
        │                      │
        │                      └─> When expired ──> Refresh Token
        │                                                │
        └────────────────────────────────────────────────┘
                                    │
                                    └─> Get new Access Token
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
