import NextAuth, { Session, User } from 'next-auth';
import Providers from 'next-auth/providers';
import { query } from 'faunadb';
import { session } from 'next-auth/client';

import { fauna } from '../../../services/fauna';
import { WithAdditionalParams } from 'next-auth/_utils';

type SessionData = {
  user: User;
  expires: string;
  accessToken?: string;
}

type ActiveSubscription = {
  ref: {
    [key: string]: Object,
  };
  ts: number;
  data: {
    id: string;
    userId: Object;
    status: string;
  };
}

interface SessionProps extends SessionData {
  activeSubscription: ActiveSubscription | undefined;
}

export default NextAuth({ 
  // jwt: {
  //   signingKey: process.env.JWT_SECRET
  // },
  providers: [
    Providers.GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      scope: 'read:user'
    }),
  ],
  callbacks: {
    async session(session: Session): Promise<WithAdditionalParams<SessionProps>> {
      try {
        const userActiveSubscription = await fauna.query<ActiveSubscription>(
          query.Get(
            query.Intersection([
              query.Match(
                query.Index('subscription_by_user_ref'),
                query.Select(
                  'ref',
                  query.Get(
                    query.Match(
                      query.Index('user_by_email'),
                      query.Casefold(session.user.email)
                    )
                  )
                )
              ),
              query.Match(
                query.Index('subscription_by_status'),
                'active'
              )
            ])
          )
        )
  
        return {
          ...session,
          activeSubscription: userActiveSubscription
        };
      } catch (error) {
        return {
          ...session,
          activeSubscription: null
        };
      }
    },
    async signIn(user, account, profile) {
      try {
        const { email } = user;
        await fauna.query(
          query.If(
            query.Not(
              query.Exists(
                query.Match(
                  query.Index('user_by_email'),
                  query.Casefold(user.email)
                )
              )
            ),
            query.Create(query.Collection('users'), { data: { email } }),
            query.Get(
              query.Match(
                query.Index('user_by_email'),
                query.Casefold(user.email)
              )
            )
          )
        );
        return true;
      } catch (error) {
        return false;
      }
      
    }
  }
}); 