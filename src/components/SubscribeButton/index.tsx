import { useSession, signIn } from 'next-auth/client';
import { useRouter } from 'next/router';

import { api } from '../../services/api';
import { getStripeJS } from '../../services/stripe-js';

import styles from './styles.module.scss';

interface SubscribeButtonProps {
  priceId: string;
}

export function SubscribeButton({ priceId }: SubscribeButtonProps) {
  const [session] = useSession();
  const { replace } = useRouter();

  const handleSubscribe = async () => {
    try {
      if (!session) {
        await signIn('github');
        return;
      }

      if (session?.activeSubscription) {
        replace('/posts');
        return;
      }
  
      const response = await api.post('/subscribe');
      const { sessionId } = response.data;

      const stripe = await getStripeJS();
      await stripe.redirectToCheckout({ sessionId });
      
    } catch (error) {
      alert(error.message);
    }
    
  }

  return (
    <button
      type="button"
      className={styles.subscribeButton}
      onClick={handleSubscribe}
    >
      Subscribe now
    </button>
  );

}