import React, { useEffect, useState } from 'react';
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
  }, [authRequired, status]);

  return (
    <div>
      {authRequired && <LoggedIn>{children}</LoggedIn>}
      {!authRequired && <div>{children}</div>}
    </div>
  );
}

export default RequireAuth;
