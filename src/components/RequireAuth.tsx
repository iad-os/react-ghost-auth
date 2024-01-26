import React, { useEffect, useMemo } from 'react';
import Logged from './Logged';
import { useAuthentication } from '../Authentication';

type RequireAuthPros = {
  children: React.ReactNode;
  loggedOut?: React.ReactNode;
  autologin?: boolean;
};

function RequireAuth(props: RequireAuthPros) {
  const { children, loggedOut: notLogged, autologin = false } = props;

  const {
    autologin: autologinFn,
    isAuthenticated,
    status,
  } = useAuthentication();

  const hasAutologin = useMemo<boolean>(
    () => autologin && status === 'LOGGED-OUT' && !isAuthenticated(),
    [autologin, status]
  );

  useEffect(() => {
    if (hasAutologin) {
      autologinFn();
    }
  }, [hasAutologin]);

  return <Logged in={children} out={notLogged} />;
}

export default RequireAuth;
