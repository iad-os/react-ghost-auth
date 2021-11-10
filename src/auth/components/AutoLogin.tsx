import React, { useEffect } from 'react';
import { useAuthentication } from '../Authentication';

function AutoLogin() {
  const { login, isAuthenticated, status } = useAuthentication();

  useEffect(() => {
    if (!isAuthenticated() && status === 'LOGIN') {
      login();
    }
  }, [status]);

  return <></>;
}

export default AutoLogin;
