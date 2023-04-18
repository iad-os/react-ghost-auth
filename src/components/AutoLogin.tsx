import React, { useEffect, useState } from 'react';
import { getLoggedIn, getIssuer } from '../AuthStoreService';
import { useAuthentication } from '../Authentication';

type Props = {
  children?: React.ReactNode;
};

function AutoLogin(props: Props) {
  const { children } = props;

  const [showChildren, setShowChildren] = useState<boolean>(false);

  const { login, isAuthenticated, status } = useAuthentication();

  const issuer = getIssuer();

  useEffect(() => {
    const loggedIn = getLoggedIn();
    if (loggedIn && status === 'INIT') {
      autologin();
    } else if (status === 'LOGIN' && !isAuthenticated) {
      autologin();
    } else {
      setShowChildren(false);
    }
  }, [status]);

  return <div>{showChildren && children}</div>;

  function autologin() {
    if (issuer !== null) {
      setShowChildren(false);
      login(issuer);
    } else if (!children) {
      setShowChildren(false);
      login();
    } else {
      setShowChildren(true);
    }
  }
}

export default AutoLogin;
