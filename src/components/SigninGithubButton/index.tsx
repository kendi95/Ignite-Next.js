import { useState } from 'react';
import { FaGithub } from 'react-icons/fa';
import { FiX } from 'react-icons/fi';

import styles from './styles.module.scss';

export function SigninGithubButton() {
  const [isLogged, setIsLogged] = useState(true);

  return (
    <button className={styles.signinButton} type="button">
      <FaGithub color={isLogged ? '#04d361' : '#eba417'} />
      {isLogged ? 'Alisson Kohatsu' : 'Signin with Github'}
      
      {isLogged && 
        <FiX 
          color="#737380" 
          className={styles.closeIcon} 
          onClick={() => setIsLogged(false)}
        />
      }
    </button>
  );
}