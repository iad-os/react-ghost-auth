import React, { useEffect, useLayoutEffect } from 'react';
import { useAuthentication } from '../Authentication';
import LoggedIn from './LoggedIn';

type Props = {
  authRequired?: (() => Promise<boolean>) | boolean;
  children: React.ReactNode;
};

function RequireAuth(props: Props) {
  const { authRequired = true, children } = props;

  const { status, changeStatus } = useAuthentication();

  useEffect(() => {
    if (status === 'INIT' && authRequired) {
      changeStatus('LOGIN');
    }
  }, []);

  useEffect(() => {
    if (status === 'INIT' && authRequired) {
      changeStatus('LOGIN');
    }
  }, [status, authRequired]);

  return (
    <div>
      {authRequired && <LoggedIn>{children}</LoggedIn>}
      {!authRequired && <div>{children}</div>}
    </div>
  );
}

export default RequireAuth;
