// ── /api/stripe/checkout ─────────────────────────────────────
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID!,
  agency: process.env.STRIPE_AGENCY_PRICE_ID!,
  scale: process.env.STRIPE_SCALE_PRICE_ID!,
};

export async function POST(req: NextRequest) {
  const { plan, userId, email } = await req.json();

  if (!PRICE_IDS[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    metadata: { userId, plan },
    subscription_data: {
      trial_period_days: 14, // 14-day free trial
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
