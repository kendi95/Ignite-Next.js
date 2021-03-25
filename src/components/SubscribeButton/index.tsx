import { useSession, signIn } from 'next-auth/client';

import { api } from '../../services/api';
import { getStripeJS } from '../../services/stripe-js';

import styles from './styles.module.scss';

interface SubscribeButtonProps {
  priceId: string;
}

export function SubscribeButton({ priceId }: SubscribeButtonProps) {
  const [session] = useSession();

  const handleSubscribe = async () => {
    try {
      if (!session) {
        await signIn('github');
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