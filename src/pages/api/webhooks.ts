import { NextApiRequest, NextApiResponse } from "next"
import { Readable } from 'stream';
import { Stripe } from "stripe";
import { stripe } from "../../services/stripe";
import { saveSubscription } from "./_lib/manageSubscription";

const buffer = async(readable: Readable) => {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

export const config = {
  api: {
    bodyParser: false
  }
}

const relevantsEvents = new Set([
  'checkout.session.completed',
  'customer.subscriptions.updated',
  'customer.subscriptions.deleted'
]);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method not allowed');
  }

  const buff = await buffer(req);
  const secret = req.headers['stripe-signature'];

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buff, secret, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  const { type } = event;

  if (relevantsEvents.has(type)) {
    try {
      switch(type) {
        case 'checkout.session.completed':
          const { customer: customerSession, subscription } = event.data.object as Stripe.Checkout.Session;
          await saveSubscription(subscription.toString(), customerSession.toString(), true);
          break;

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const { id, customer: customerSubscription } = event.data.object as Stripe.Subscription;
          await saveSubscription(
            id.toString(), 
            customerSubscription.toString(),
            false
          );

          break;
        default:
          throw new Error('Unhandled event.');
      }
    } catch (error) {
      return res.send('Webhook handler failed.');
    }
  }

  return res.status(200).json({ message: 'Recebido' });
} 