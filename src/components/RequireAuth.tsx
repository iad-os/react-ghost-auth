import React, { useEffect, useState } from 'react';
import { useAuthentication } from '../Authentication';
import LoggedIn from './LoggedIn';

type Props = {
  authRequired?: (() => Promise<boolean>) | boolean;
  children: React.ReactNode;
};

function RequireAuth(props: Props) {
  const { authRequired: _authRequired = true, children } = props;

  const { status, changeStatus } = useAuthentication();

  const [authRequired, setAuthRequired] = useState<boolean>(false);

  useEffect(() => {
    if (typeof _authRequired === 'function') {
      _authRequired().then(res => setAuthRequired(res));
    } else {
      setAuthRequired(_authRequired);
    }
  }, []);

  useEffect(() => {
    if (status === 'INIT' && authRequired) {
      changeStatus('LOGIN');
    }
  }, [authRequired]);

  return (
    <div>
      {authRequired && <LoggedIn>{children}</LoggedIn>}
      {!authRequired && <div>{children}</div>}
    </div>
  );
}

export default RequireAuth;
