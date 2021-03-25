import { query } from 'faunadb';
import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/client';

import { fauna } from '../../services/fauna';
import { stripe } from '../../services/stripe';

type User = {
  ref: {
    id: string;
  },
  data: {
    stripe_customer_id: string; 
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method not allowed');
  }

  const { user: userSession } = await getSession({ req });
  const { email } = userSession;

  const user = await fauna.query<User>(
    query.Get(
      query.Match(query.Index('user_by_email'), query.Casefold(email))
    )
  );

  let customerId = user.data.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
    });
  
    await fauna.query(
      query.Update(
        query.Ref(query.Collection('users'), user.ref.id),
        {
          data: { stripe_customer_id: customer.id }
        }
      )
    );

    customerId = customer.id;
  }


  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    billing_address_collection: 'required',
    line_items: [
      { price: process.env.STRIPE_PRICE_ID, quantity: 1 },
    ],
    mode: 'subscription',
    allow_promotion_codes: true,
    success_url: process.env.STRIPE_SUCCESS_URL,
    cancel_url: process.env.STRIPE_CANCEL_URL
  });

  return res.status(201).json({ sessionId: checkoutSession.id });
}