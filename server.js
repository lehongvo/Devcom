const express = require('express');
const cors = require('cors');
const dexcom = require('./devcom/dexcom-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * GET /api/dexcom/credentials
 * Trả về credentials để app có thể login Dexcom
 */
app.get('/api/dexcom/credentials', (req, res) => {
    try {
        const creds = dexcom.getCredentials();
        // Chỉ trả về thông tin cần thiết, không trả về secret nếu không cần
        res.json({
            success: true,
            data: {
                clientId: creds.clientId,
                redirectUri: creds.redirectUri,
                sandboxBaseUrl: creds.sandboxBaseUrl,
                productionBaseUrl: creds.productionBaseUrl
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/dexcom/login-url
 * Trả về login URL để redirect user
 */
app.get('/api/dexcom/login-url', (req, res) => {
    try {
        const { environment = 'sandbox' } = req.query;
        const baseUrl = environment === 'production' 
            ? null // Sẽ dùng productionBaseUrl từ credentials
            : null; // Sẽ dùng sandboxBaseUrl từ credentials
        
        const loginUrl = dexcom.getLoginUrl(baseUrl);
        res.json({
            success: true,
            data: {
                loginUrl: loginUrl
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/dexcom/token
 * Exchange authorization code để lấy access token
 * Body: { code: string, environment?: 'sandbox' | 'production' }
 */
app.post('/api/dexcom/token', async (req, res) => {
    try {
        const { code, environment = 'sandbox' } = req.body;
        
        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Authorization code is required'
            });
        }

        const baseUrl = environment === 'production' ? null : null;
        const tokenData = await dexcom.getAccessToken(code, baseUrl);
        
        res.json({
            success: true,
            data: tokenData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

/**
 * POST /api/dexcom/refresh-token
 * Refresh access token
 * Body: { refreshToken: string, environment?: 'sandbox' | 'production' }
 */
app.post('/api/dexcom/refresh-token', async (req, res) => {
    try {
        const { refreshToken, environment = 'sandbox' } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: 'Refresh token is required'
            });
        }

        const baseUrl = environment === 'production' ? null : null;
        const tokenData = await dexcom.refreshAccessToken(refreshToken, baseUrl);
        
        res.json({
            success: true,
            data: tokenData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

/**
 * GET /api/dexcom/egvs
 * Lấy EGV data từ Dexcom
 * Query: { accessToken: string, startDate: string, endDate: string, environment?: string }
 */
app.get('/api/dexcom/egvs', async (req, res) => {
    try {
        const { accessToken, startDate, endDate, environment = 'sandbox' } = req.query;
        
        if (!accessToken || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'accessToken, startDate, and endDate are required'
            });
        }

        const baseUrl = environment === 'production' ? null : null;
        const egvRecords = await dexcom.getEGVs(accessToken, startDate, endDate, baseUrl);
        
        res.json({
            success: true,
            data: {
                records: egvRecords,
                count: egvRecords.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

/**
 * GET /api/dexcom/glucose-average
 * Tính trung bình đường huyết trong 7 ngày
 * Query: { accessToken: string, endDate?: string, environment?: string }
 */
app.get('/api/dexcom/glucose-average', async (req, res) => {
    try {
        const { accessToken, endDate, environment = 'sandbox' } = req.query;
        
        if (!accessToken) {
            return res.status(400).json({
                success: false,
                error: 'accessToken is required'
            });
        }

        const baseUrl = environment === 'production' ? null : null;
        const endDateObj = endDate ? new Date(endDate) : new Date();
        const stats = await dexcom.get7DayGlucoseAverage(accessToken, endDateObj, baseUrl);
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

/**
 * POST /api/dexcom/check-challenge
 * Kiểm tra challenge 7 ngày có đạt yêu cầu không
 * Body: { accessToken: string, targetGlucose: number, endDate?: string, environment?: string }
 */
app.post('/api/dexcom/check-challenge', async (req, res) => {
    try {
        const { accessToken, targetGlucose, endDate, environment = 'sandbox' } = req.body;
        
        if (!accessToken || !targetGlucose) {
            return res.status(400).json({
                success: false,
                error: 'accessToken and targetGlucose are required'
            });
        }

        const baseUrl = environment === 'production' ? null : null;
        const endDateObj = endDate ? new Date(endDate) : new Date();
        const result = await dexcom.check7DayChallenge(accessToken, targetGlucose, endDateObj, baseUrl);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.response?.data || error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api/dexcom`);
});

module.exports = app;

