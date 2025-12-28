require('dotenv').config();
const dexcom = require('./dexcom-api');

/**
 * Main function - Setup config và call từ lớn đến bé
 */
async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 Dexcom API Test Script');
    console.log('═══════════════════════════════════════════════════════════\n');

    try {
        // ==========================================
        // SETUP CONFIG
        // ==========================================
        console.log('📋 STEP 1: Setup Configuration...\n');
        
        const credentials = dexcom.getCredentials();
        console.log('✅ Credentials loaded\n');

        // ==========================================
        // LEVEL 1: Authentication & Token
        // ==========================================
        console.log('🔐 STEP 2: Authentication & Token Management...\n');
        
        // 2.1 Get Login URL
        const loginUrl = dexcom.getLoginUrl();

        // 2.2 Get Access Token (từ code trong config hoặc parameter)
        const accessTokenArg = process.argv[2];
        let tokenData = null;
        let accessToken = null;

        if (accessTokenArg) {
            accessToken = accessTokenArg;
        } else if (credentials.urlAuthorizeCode) {
            try {
                tokenData = await dexcom.getAccessToken();
                accessToken = tokenData.access_token;
            } catch (error) {
                console.log(`⚠️  Failed to get token: ${error.message}\n`);
            }
        }
        
        if (!accessToken) {
            console.log('⚠️  No access token available\n');
        }

        // ==========================================
        // LEVEL 2: Data Retrieval (nếu có token)
        // ==========================================
        if (accessToken) {
            console.log('📊 STEP 3: Data Retrieval...\n');

            // 3.1 Get EGV Data
            const endDate = new Date();
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 7);
            
            const startDateStr = startDate.toISOString().split('.')[0];
            const endDateStr = endDate.toISOString().split('.')[0];
            
            const egvRecords = await dexcom.getEGVs(accessToken, startDateStr, endDateStr);
            console.log(`✅ Retrieved ${egvRecords.length} EGV records\n`);

            if (egvRecords.length > 0) {

                // ==========================================
                // LEVEL 3: Data Processing
                // ==========================================
                console.log('📈 STEP 4: Data Processing...\n');

                // 4.1 Calculate Glucose Average
                const stats = dexcom.calculateGlucoseAverage(egvRecords);

                // 4.2 Get 7-Day Average
                const sevenDayStats = await dexcom.get7DayGlucoseAverage(accessToken);
                console.log('✅ 7-Day Statistics:');
                console.log(`   Average: ${sevenDayStats.average} ${sevenDayStats.unit}`);
                console.log(`   Min: ${sevenDayStats.min} ${sevenDayStats.unit}`);
                console.log(`   Max: ${sevenDayStats.max} ${sevenDayStats.unit}`);
                console.log(`   Count: ${sevenDayStats.count} records\n`);

                // ==========================================
                // LEVEL 4: Challenge Check
                // ==========================================
                console.log('🎯 STEP 5: Challenge Check...\n');

                // 5.1 Check 7-Day Challenge
                const targetGlucose = 100; // mg/dL
                const challengeResult = await dexcom.check7DayChallenge(accessToken, targetGlucose);
                console.log('✅ Challenge Result:');
                console.log(`   Passed: ${challengeResult.passed ? '✅ YES' : '❌ NO'}`);
                console.log(`   Target: ${challengeResult.targetGlucose} ${challengeResult.stats.unit}`);
                console.log(`   Actual: ${challengeResult.actualAverage} ${challengeResult.stats.unit}`);
                console.log(`   Difference: ${challengeResult.difference > 0 ? '+' : ''}${challengeResult.difference.toFixed(2)} ${challengeResult.stats.unit}\n`);
            } else {
                console.log('⚠️  No EGV records found\n');
            }
        }

        // ==========================================
        // SUMMARY
        // ==========================================
        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ All tests completed successfully!');
        console.log('═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ Error occurred:');
        console.error(`   Message: ${error.message}`);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        if (error.stack) {
            console.error(`   Stack: ${error.stack}`);
        }
        process.exit(1);
    }
}

// Chạy main function
if (require.main === module) {
    main();
}

module.exports = { main };
