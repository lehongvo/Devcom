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
       │  2. Returns credentials│                        │
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
       │   (App storage)        │                        │
       │                        │                        │
       │  9. Get CGM data       │                        │
       │───────────────────────────────────────────────> │
       │                        │                        │
       │  10. Return CGM data   │                        │
       │<─────────────────────────────────────────────── │
       │                        │                        │
       │  11. Process & display │                        │
       │                        │                        │
```

**Note:** App only calls Backend for credentials. All other steps (login, token exchange, API calls) are handled directly by the App with Dexcom API.

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

### 3. Exchange Code for Token (App handles directly)
```
App → POST /v2/oauth2/token (to Dexcom API)
Body: { code, client_id, client_secret, grant_type, redirect_uri }
Dexcom → Returns: { access_token, refresh_token, expires_in }
App → Save tokens to Local Storage
```

### 4. Get CGM Data (App handles directly)
```
App → Get access_token from Local Storage
App → Check expiry → Refresh if needed
App → GET /v3/users/self/egvs (to Dexcom API)
Dexcom → Returns: { records: [...] }
App → Calculate stats → Display to user
```

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    OAuth 2.0 Flow                            │
└─────────────────────────────────────────────────────────────┘

Step 1: App requests credentials (ONLY call to Backend)
   App ──────────> Backend
        GET /api/dexcom/credentials
   App <────────── Backend
        { clientId, redirectUri, loginUrl }

Step 2: User authorization (App handles directly)
   App ──────────────────────────────────────> Dexcom
        Open loginUrl in WebView
   User ──────────────────────────────────────> Dexcom
        Login & Authorize
   Dexcom ────────────────────────────────────> App
        Redirect: redirectUri?code=XXXXX

Step 3: Exchange code for token (App handles directly)
   App ──────────────────────────────────────> Dexcom
        POST /v2/oauth2/token
        { code, client_id, client_secret, grant_type, redirect_uri }
   Dexcom ────────────────────────────────────> App
        { access_token, refresh_token, expires_in }
   App ──────────────────────────────────────> Local Storage
        Save tokens locally (for this user)
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              CGM Data Retrieval Flow                        │
└─────────────────────────────────────────────────────────────┘

App Processing (All handled by App)
   │
   ├─> 1. Get access_token from Local Storage
   │
   ├─> 2. Check token expiry
   │      ├─> If expired ──> Refresh token
   │      │     └─> POST /v2/oauth2/token (refresh_token)
   │      │     └─> Update Local Storage with new tokens
   │      └─> If valid ──> Use existing token
   │
   ├─> 3. Call Dexcom API directly
   │      └─> GET /v3/users/self/egvs
   │          Headers: Authorization: Bearer {access_token}
   │          Params: startDate, endDate
   │
   ├─> 4. Receive CGM Data
   │      └─> { records: [...] }
   │
   ├─> 5. Process Data (App calculates)
   │      └─> Calculate statistics (average, min, max)
   │
   └─> 6. Display to User
          └─> Show charts, stats, etc.
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

- **Backend only provides credentials** (clientId, redirectUri, loginUrl)
- **App handles all OAuth flow** (login, token exchange, API calls)
- **App stores tokens locally** (Local Storage / Keychain)
- **App auto-refreshes tokens** when expired
- **No Backend API needed** for token management or data retrieval

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
