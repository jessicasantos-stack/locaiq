import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function getStripe() {
    return new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: "2024-06-20",
    });
}

export async function POST(req: NextRequest) {
    const stripe = getStripe();
    const body = await req.text();
    const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
        event = stripe.webhooks.constructEvent(
                body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET!
              );
  } catch (err) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.userId;
            const plan = session.metadata?.plan || "starter";

            if (userId) {
                      await supabase.from("agencies").update({
                                  plan,
                                  stripe_customer_id: session.customer as string,
                                  stripe_subscription_id: session.subscription as string,
                      }).eq("owner_id", userId);
            }
            break;
    }

    case "customer.subscription.updated": {
            const sub = event.data.object as Stripe.Subscription;
            const plan = sub.items.data[0]?.price.nickname?.toLowerCase() || "starter";

            await supabase.from("agencies")
              .update({ plan })
              .eq("stripe_subscription_id", sub.id);
            break;
    }

    case "customer.subscription.deleted": {
            const sub = event.data.object as Stripe.Subscription;

            await supabase.from("agencies")
              .update({ plan: "free", stripe_subscription_id: null })
              .eq("stripe_subscription_id", sub.id);

            console.log(`⚠ Subscription cancelled: ${sub.id}`);
            break;
    }
  }

  return NextResponse.json({ received: true });
}

export const runtime = 'edge';
