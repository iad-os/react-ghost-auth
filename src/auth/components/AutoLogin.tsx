import React, { useEffect } from 'react';
import { useAuthentication } from '../Authentication';

type Props = {
  children?: React.ReactNode;
  defaultProvider?: string;
};

function AutoLogin(props: Props) {
  const { children, defaultProvider } = props;
  const { login, isAuthenticated, status } = useAuthentication();

  useEffect(() => {
    if (!isAuthenticated() && status === 'LOGIN') {
      defaultProvider && login(defaultProvider);
    }
  }, [status]);

  return (
    <>
      {!defaultProvider && !isAuthenticated() && status === 'LOGIN' && children}
    </>
  );
}

export default AutoLogin;
