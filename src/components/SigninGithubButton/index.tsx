import { FaGithub } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';

import { signIn, signOut, useSession } from 'next-auth/client';

import styles from './styles.module.scss';

export function SigninGithubButton() {
  const [session] = useSession();

  return (
    <button
      className={styles.signinButton} 
      type="button"
      onClick={!session ? () => signIn('github') : () => {}}
    >
      <FaGithub color={session ? '#04d361' : '#eba417'} />
      {session ? session.user.name : 'Signin with Github'}
      
      {session && 
        <FiX 
          color="#737380" 
          className={styles.closeIcon} 
          onClick={() => signOut()}
        />
      }
    </button>
  );
}