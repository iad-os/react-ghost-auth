import React, { useEffect, useState } from 'react';
import { useAuthentication } from '../Authentication';
import useLocalstorage from '../useLocalstorage';

type AutoLoginProps = {
  children?: React.ReactNode;
};

function AutoLogin(props: AutoLoginProps) {
  const { children } = props;

  const ls = useLocalstorage();

  const [showChildren, setShowChildren] = useState<boolean>(false);

  const { login, isAuthenticated, status } = useAuthentication();

  useEffect(() => {
    const loggedIn = ls.load('logged_in');
    const provider = ls.load('provider_issuer');

    if (status === 'INIT' && loggedIn && provider && !isAuthenticated()) {
      // se trovo un utente che si è già connesso e il relativo issuer
      login(provider);
    } else if (status === 'LOGIN') {
      // se sono in fase di login/autologin
      autologin();
    } else {
      setShowChildren(false);
    }
  }, [status]);

  const autologin = () => {
    if (!children) {
      setShowChildren(false);
      login();
    } else {
      setShowChildren(true);
    }
  };

  return <div>{showChildren && children}</div>;
}

export default AutoLogin;
