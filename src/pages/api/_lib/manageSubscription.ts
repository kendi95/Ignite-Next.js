import { query } from 'faunadb';

import { fauna } from "../../../services/fauna";
import { stripe } from '../../../services/stripe';

export const saveSubscription = async (subscriptionId: string, customerId: string, createAction: boolean = false) => {
  const userRef = await fauna.query(
    query.Select(
      'ref',
      query.Get(
        query.Match(query.Index('user_by_stripe_customer_id'), customerId)
      )
    )
  );

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const { id, status, items } = subscription;

  const subscriptiondata = {
    id,
    userId: userRef,
    status,
    priceId: items.data[0].price.id
  }

  if (createAction) {
    await fauna.query(
      query.Create(
        query.Collection('subscriptions'),
        { data: subscriptiondata }
      )
    );
    return;
  }
  
  await fauna.query(
    query.Replace(
      query.Select(
        'ref',
        query.Get(
          query.Match(query.Index('subscription_by_id'), id)
        )
      ),
      { data: subscriptiondata }
    )
  )
}