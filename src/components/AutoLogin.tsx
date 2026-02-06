import React, { useEffect, useState } from 'react';
import { useAuthentication } from '../Authentication';
import { getCookie } from '../cookie.utils';
import { getCurrentProvider } from '../providerStore';

type AutoLoginProps = {
  children?: React.ReactNode;
};

function AutoLogin(props: AutoLoginProps) {
  const { children } = props;

  const [showChildren, setShowChildren] = useState<boolean>(false);

  const { login, isAuthenticated, status } = useAuthentication();

  useEffect(() => {
    const loggedIn = getCookie('token');
    const provider = getCurrentProvider();

    if (status === 'LOGGED-OUT' && loggedIn && provider && !isAuthenticated()) {
      // se trovo un utente che si è già connesso e il relativo issuer
      login(provider.issuer);
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

  return <React.Fragment>{showChildren && children}</React.Fragment>;
}

export default AutoLogin;
