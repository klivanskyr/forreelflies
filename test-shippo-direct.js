require('dotenv').config({ path: '.env.local' });
const { Shippo } = require('shippo');

// Helper functions
async function log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
    console.log('');
}

async function testShippoDirect() {
    try {
        log('🚀 Testing Shippo API directly');
        
        // Check environment variables
        log('=== Environment Check ===');
        const envVars = {
            SHIPPO_KEY: process.env.SHIPPO_KEY ? '[PRESENT]' : '[MISSING]',
            NODE_ENV: process.env.NODE_ENV
        };
        log('Environment variables:', envVars);
        
        if (!process.env.SHIPPO_KEY) {
            log('❌ SHIPPO_KEY is missing');
            return;
        }
        
        // Use live key from environment
        const liveShippoKey = process.env.SHIPPO_KEY;
        log(`Shippo API key type: LIVE (using environment variable)`);
        log(`API key preview: ${liveShippoKey.substring(0, 20)}...`);
        
        // Initialize Shippo client with live key
        log('=== Initializing Shippo Client with LIVE key ===');
        const shippo = new Shippo({
            apiKeyHeader: liveShippoKey,
            debugLogger: process.env.NODE_ENV === 'development' ? console : undefined,
            retryConfig: {
                strategy: 'backoff',
                backoff: {
                    initialInterval: 1,
                    maxInterval: 50,
                    exponent: 1.1,
                    maxElapsedTime: 100,
                },
                retryConnectionErrors: true,
            }
        });
        log('✅ Shippo client initialized with LIVE key');
        
        // Test addresses
        const testAddresses = {
            addressFrom: {
                name: 'Test Vendor',
                street1: '123 Test Street',
                city: 'Test City',
                state: 'CA',
                zip: '90210',
                country: 'US',
                phone: '555-123-4567'
            },
            addressTo: {
                name: 'Test Customer',
                street1: '456 Customer Ave',
                street2: 'Apt 1',
                city: 'Customer City',
                state: 'NY',
                zip: '10001',
                country: 'US'
            },
            parcels: [{
                length: "8",
                width: "6",
                height: "4",
                distanceUnit: "in",
                weight: "1.5",
                massUnit: "lb"
            }]
        };
        
        log('=== Testing Shipment Creation ===');
        log('Test data:', testAddresses);
        
        // Create shipment
        const shipment = await shippo.shipments.create({
            addressFrom: testAddresses.addressFrom,
            addressTo: testAddresses.addressTo,
            parcels: testAddresses.parcels,
            async: false
        });
        
        log('✅ Shipment created successfully');
        log('Shipment details:', {
            objectId: shipment.objectId,
            ratesCount: shipment.rates?.length || 0,
            status: shipment.status
        });
        
        if (shipment.rates && shipment.rates.length > 0) {
            log('=== Available Rates ===');
            shipment.rates.forEach((rate, index) => {
                log(`Rate ${index + 1}:`, {
                    provider: rate.provider,
                    service: rate.servicelevel?.name,
                    amount: rate.amount,
                    currency: rate.currency,
                    estimatedDays: rate.estimated_days
                });
            });
            
            // Test purchasing a label with USPS instead of UPS
            log('=== Testing Label Purchase ===');
            const uspsRate = shipment.rates.find(r => r.provider === 'USPS' && r.servicelevel?.name === 'Ground Advantage');
            const cheapestRate = uspsRate || shipment.rates.reduce((min, r) => 
                parseFloat(r.amount) < parseFloat(min.amount) ? r : min, shipment.rates[0]
            );
            
            log('Selected rate:', {
                provider: cheapestRate.provider,
                service: cheapestRate.servicelevel?.name,
                amount: cheapestRate.amount,
                objectId: cheapestRate.objectId
            });
            
            const transaction = await shippo.transactions.create({
                rate: cheapestRate.objectId,
                labelFileType: "PDF",
                async: false
            });
            
            log('✅ Label purchased successfully');
            log('Transaction details:', {
                objectId: transaction.objectId,
                labelUrl: transaction.labelUrl,
                trackingNumber: transaction.trackingNumber,
                status: transaction.status,
                messages: transaction.messages || [],
                rate: transaction.rate,
                trackingStatus: transaction.tracking_status
            });
            
        } else {
            log('❌ No shipping rates available');
        }
        
        log('🎉 Direct Shippo test completed successfully!');
        
    } catch (error) {
        log('❌ Direct Shippo test failed:', {
            error: error.message,
            stack: error.stack
        });
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testShippoDirect().then(() => {
        console.log('Direct Shippo test completed');
        process.exit(0);
    }).catch((error) => {
        console.error('Direct Shippo test failed:', error);
        process.exit(1);
    });
}

module.exports = {
    testShippoDirect
}; 