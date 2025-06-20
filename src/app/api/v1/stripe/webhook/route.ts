import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const sig = request.headers.get("stripe-signature") || "";
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (_) {
      return NextResponse.json(
        { error: "Webhook verification failed" },
        { status: 400 }
      );
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("Payment successful:", session);

      // Ensure vendorDetails metadata exists
      if (!session.metadata || !session.metadata.vendorDetails) {
        return NextResponse.json(
          { error: "Vendor details are missing from metadata" },
          { status: 400 }
        );
      }

      let vendorDetails;
      try {
        vendorDetails = JSON.parse(session.metadata.vendorDetails); // Convert string back to an object
      } catch (_) {
        return NextResponse.json(
          { error: "Failed to parse vendor details from metadata" },
          { status: 400 }
        );
      }

      // Iterate through all vendors and distribute funds
      for (const vendor of vendorDetails) {
        const vendorId = vendor.vendorId;
        const stripeAccountId = vendor.stripeAccountId;
        const amount = vendor.amount; // Amount in cents

        if (!vendorId || !stripeAccountId || !amount) {
          console.error("Invalid vendor data:", vendor);
          continue;
        }

        // Deduct platform fee (10%)
        const platformFee = Math.round(amount * 0.1); // 10% fee from each vendor's amount
        const vendorAmount = amount - platformFee;

        try {
          // Transfer funds to the vendor's connected Stripe account
          await stripe.transfers.create({
            amount: vendorAmount,
            currency: session.currency || "usd",
            destination: stripeAccountId, // Connected Stripe account ID
          });

          console.log(`Transferred $${vendorAmount / 100} to vendor: ${vendorId}`);
        } catch (transferError) {
          console.error(`Tried to transfer ${vendorAmount}. Transfer failed for vendor`, vendorId, transferError);
        }
      }
    } else if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;

      const accountId = account.id;
      const accountEmail = account.email;
      const accountPayoutsEnabled = account.payouts_enabled;
      const accountCurrentlyDue = account.requirements?.currently_due || [];
      const accountMetadata = account.metadata; // userId
      const accountName = account.business_profile?.name || "Unknown";
      const accountCapabilities = account.capabilities || {};



      console.log("Account updated:", account);

    } else if (event.type === "account.application.authorized") {
      console.log("Application authorized:", event.data.object);
    } else if (event.type === "account.application.deauthorized") {
      console.log("Application deauthorized:", event.data.object);
    } else if (event.type === "account.external_account.created") {
      console.log("External account created:", event.data.object);
    } else if (event.type === "account.external_account.updated") {
      console.log("External account updated:", event.data.object);
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 400 }
    );
  }
}
