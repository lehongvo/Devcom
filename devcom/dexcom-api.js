const axios = require('axios');
require('dotenv').config();

// Đọc credentials từ environment variables
function getCredentials() {
    return {
        clientId: process.env.DEXCOM_CLIENT_ID,
        clientSecret: process.env.DEXCOM_CLIENT_SECRET,
        redirectUri: process.env.DEXCOM_REDIRECT_URI,
        sandboxBaseUrl: process.env.DEXCOM_SANDBOX_BASE_URL || 'https://sandbox-api.dexcom.com',
        productionBaseUrl: process.env.DEXCOM_PRODUCTION_BASE_URL || 'https://api.dexcom.com',
        urlAuthorizeCode: process.env.DEXCOM_AUTHORIZATION_CODE
    };
}

/**
 * Tạo login URL để redirect user đến Dexcom
 * @param {string} baseUrl - Base URL (sandbox hoặc production)
 * @returns {string} Login URL
 */
function getLoginUrl(baseUrl = null) {
    const creds = getCredentials();
    const base = baseUrl || creds.sandboxBaseUrl;
    const params = new URLSearchParams({
        client_id: creds.clientId,
        redirect_uri: creds.redirectUri,
        response_type: 'code',
        scope: 'offline_access'
    });
    return `${base}/v2/oauth2/login?${params.toString()}`;
}

/**
 * Exchange authorization code để lấy access token
 * @param {string} code - Authorization code từ redirect (optional, nếu không có sẽ lấy từ credentials)
 * @param {string} baseUrl - Base URL (sandbox hoặc production)
 * @returns {Promise<Object>} Token response với access_token, refresh_token, etc.
 */
async function getAccessToken(code = null, baseUrl = null) {
    const creds = getCredentials();
    const base = baseUrl || creds.sandboxBaseUrl;
    
    // Nếu không có code được truyền vào, lấy từ credentials
    const authCode = code || creds.urlAuthorizeCode;
    
    if (!authCode) {
        throw new Error('Authorization code is required. Either pass it as parameter or set urlAuthorizeCode in credentials.');
    }
    
    try {
        const response = await axios.post(
            `${base}/v2/oauth2/token`,
            new URLSearchParams({
                client_id: creds.clientId,
                client_secret: creds.clientSecret,
                code: authCode,
                grant_type: 'authorization_code',
                redirect_uri: creds.redirectUri
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
}

/**
 * Refresh access token bằng refresh token
 * @param {string} refreshToken - Refresh token
 * @param {string} baseUrl - Base URL
 * @returns {Promise<Object>} New token response
 */
async function refreshAccessToken(refreshToken, baseUrl = null) {
    const creds = getCredentials();
    const base = baseUrl || creds.sandboxBaseUrl;
    
    try {
        const response = await axios.post(
            `${base}/v2/oauth2/token`,
            new URLSearchParams({
                client_id: creds.clientId,
                client_secret: creds.clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
                redirect_uri: creds.redirectUri
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response.data;
    } catch (error) {
        throw error;
    }
}

/**
 * Lấy EGV data (Estimated Glucose Values) từ Dexcom
 * @param {string} accessToken - Access token
 * @param {string} startDate - Start date (ISO 8601 format: YYYY-MM-DDTHH:mm:ss)
 * @param {string} endDate - End date (ISO 8601 format: YYYY-MM-DDTHH:mm:ss)
 * @param {string} baseUrl - Base URL
 * @returns {Promise<Array>} Array of EGV records
 */
async function getEGVs(accessToken, startDate, endDate, baseUrl = null) {
    const creds = getCredentials();
    const base = baseUrl || creds.sandboxBaseUrl;
    
    try {
        const response = await axios.get(
            `${base}/v3/users/self/egvs`,
            {
                params: {
                    startDate: startDate,
                    endDate: endDate
                },
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );
        return response.data.records || [];
    } catch (error) {
        throw error;
    }
}

/**
 * Tính trung bình đường huyết trong khoảng thời gian
 * @param {Array} egvRecords - Array of EGV records từ Dexcom
 * @returns {Object} Statistics về đường huyết
 */
function calculateGlucoseAverage(egvRecords) {
    if (!egvRecords || egvRecords.length === 0) {
        return {
            average: 0,
            count: 0,
            min: 0,
            max: 0,
            unit: 'mg/dL'
        };
    }

    // Lọc các record có giá trị hợp lệ
    const validRecords = egvRecords.filter(record => 
        record.value !== null && 
        record.value !== undefined && 
        !isNaN(record.value)
    );

    if (validRecords.length === 0) {
        return {
            average: 0,
            count: 0,
            min: 0,
            max: 0,
            unit: 'mg/dL'
        };
    }

    const values = validRecords.map(record => record.value);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
        average: Math.round(average * 100) / 100, // Làm tròn 2 chữ số
        count: validRecords.length,
        min: min,
        max: max,
        unit: 'mg/dL'
    };
}

/**
 * Tính trung bình đường huyết trong 7 ngày
 * @param {string} accessToken - Access token
 * @param {Date} endDate - Ngày kết thúc (mặc định là hôm nay)
 * @param {string} baseUrl - Base URL
 * @returns {Promise<Object>} Statistics về đường huyết 7 ngày
 */
async function get7DayGlucoseAverage(accessToken, endDate = new Date(), baseUrl = null) {
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 7);
    
    const startDateStr = startDate.toISOString().split('.')[0];
    const endDateStr = endDate.toISOString().split('.')[0];
    
    const egvRecords = await getEGVs(accessToken, startDateStr, endDateStr, baseUrl);
    const stats = calculateGlucoseAverage(egvRecords);
    
    return {
        ...stats,
        startDate: startDateStr,
        endDate: endDateStr,
        period: '7 days'
    };
}

/**
 * Kiểm tra challenge 7 ngày có đạt yêu cầu không
 * @param {string} accessToken - Access token
 * @param {number} targetGlucose - Mục tiêu đường huyết (mg/dL)
 * @param {Date} endDate - Ngày kết thúc
 * @param {string} baseUrl - Base URL
 * @returns {Promise<Object>} Kết quả challenge
 */
async function check7DayChallenge(accessToken, targetGlucose, endDate = new Date(), baseUrl = null) {
    const stats = await get7DayGlucoseAverage(accessToken, endDate, baseUrl);
    const isPassed = stats.average >= targetGlucose;
    
    return {
        passed: isPassed,
        targetGlucose: targetGlucose,
        actualAverage: stats.average,
        difference: stats.average - targetGlucose,
        stats: stats
    };
}

module.exports = {
    getCredentials,
    getLoginUrl,
    getAccessToken,
    refreshAccessToken,
    getEGVs,
    calculateGlucoseAverage,
    get7DayGlucoseAverage,
    check7DayChallenge
};

