import { Shippo } from 'shippo';

// Validate environment variable
if (!process.env.SHIPPO_KEY) {
    throw new Error(
        'SHIPPO_KEY environment variable is not set. ' +
        'Please add it to your .env.local file. ' +
        'You can get an API key from https://goshippo.com'
    );
}

// Initialize Shippo client with proper typing
const shippoClient = new Shippo({
    apiKeyHeader: process.env.SHIPPO_KEY,
    // Enable debug logging in development
    debugLogger: process.env.NODE_ENV === 'development' ? console : undefined,
    // Configure retries
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

// Export types from the SDK
export type { Address, Parcel, Shipment, Rate, Transaction } from 'shippo';

// Export the client as default
export default shippoClient; 