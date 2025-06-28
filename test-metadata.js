require('dotenv').config({path: '.env.local'});
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testMetadata() {
  console.log('🔍 Testing Stripe Connect Account Metadata...\n');

  try {
    // List recent Connect accounts
    console.log('1. Fetching recent Connect accounts...');
    const accounts = await stripe.accounts.list({ limit: 5 });
    
    if (accounts.data.length === 0) {
      console.log('❌ No Connect accounts found');
      return;
    }
    
    console.log(`Found ${accounts.data.length} Connect accounts:\n`);
    
    accounts.data.forEach((account, i) => {
      console.log(`${i + 1}. Account ID: ${account.id}`);
      console.log(`   Created: ${new Date(account.created * 1000).toLocaleString()}`);
      console.log(`   Type: ${account.type}`);
      console.log(`   Capabilities: ${JSON.stringify(account.capabilities)}`);
      console.log(`   Metadata:`, account.metadata);
      console.log(`   Details submitted: ${account.details_submitted}`);
      console.log(`   Charges enabled: ${account.charges_enabled}`);
      console.log(`   Payouts enabled: ${account.payouts_enabled}`);
      
      // Check if userId is in metadata
      if (account.metadata && account.metadata.userId) {
        console.log(`   ✅ userId found in metadata: ${account.metadata.userId}`);
      } else {
        console.log(`   ❌ userId NOT found in metadata`);
        console.log(`   Available metadata keys:`, Object.keys(account.metadata || {}));
      }
      console.log('');
    });
    
    // Get the most recent account and check it in detail
    const recentAccount = accounts.data[0];
    console.log(`2. Detailed check of most recent account (${recentAccount.id}):\n`);
    
    const detailedAccount = await stripe.accounts.retrieve(recentAccount.id);
    console.log('Full metadata object:', JSON.stringify(detailedAccount.metadata, null, 2));
    console.log('Capabilities:', JSON.stringify(detailedAccount.capabilities, null, 2));
    console.log('Requirements:', JSON.stringify(detailedAccount.requirements, null, 2));
    
    // Check if this account should trigger webhook
    if (detailedAccount.capabilities?.transfers === 'active') {
      console.log('\n✅ This account has ACTIVE transfer capability - webhook should have fired');
    } else if (detailedAccount.capabilities?.transfers === 'pending') {
      console.log('\n⏳ This account has PENDING transfer capability - still waiting for activation');
    } else {
      console.log('\n❌ Transfer capability not requested or failed');
    }
    
    // Check recent account.updated events
    console.log('\n3. Checking recent account.updated events...');
    const events = await stripe.events.list({ 
      type: 'account.updated',
      limit: 10 
    });
    
    console.log(`Found ${events.data.length} recent account.updated events:`);
    
    const relevantEvents = events.data.filter(event => 
      event.data.object.id === recentAccount.id
    );
    
    if (relevantEvents.length > 0) {
      console.log(`\nFound ${relevantEvents.length} events for the recent account:`);
      relevantEvents.forEach((event, i) => {
        console.log(`${i + 1}. Event ID: ${event.id}`);
        console.log(`   Created: ${new Date(event.created * 1000).toLocaleString()}`);
        console.log(`   Account ID: ${event.data.object.id}`);
        console.log(`   Capabilities at event time:`, event.data.object.capabilities);
        console.log(`   Metadata at event time:`, event.data.object.metadata);
      });
    } else {
      console.log(`\n❌ No account.updated events found for account ${recentAccount.id}`);
    }
    
    // Test if we can update metadata (to verify our connection works)
    console.log('\n4. Testing metadata update capability...');
    try {
      await stripe.accounts.update(recentAccount.id, {
        metadata: {
          ...detailedAccount.metadata,
          lastTestCheck: new Date().toISOString()
        }
      });
      console.log('✅ Successfully updated account metadata (test)');
    } catch (error) {
      console.log('❌ Failed to update metadata:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing metadata:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testMetadata().catch(console.error);
}

module.exports = { testMetadata }; 