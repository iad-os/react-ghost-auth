import React, { useEffect, useState } from 'react';
import { useAuthentication } from '../Authentication';

type Props = {
  authRequired: (() => Promise<boolean>) | boolean;
  children: React.ReactNode;
};

function RequireAuth(props: Props) {
  const { authRequired: _authRequired, children } = props;

  const { status, updateStatus, isAuthenticated } = useAuthentication();

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
      updateStatus('LOGIN');
    }
  }, [authRequired]);

  return (
    <>
      {((authRequired && isAuthenticated()) || !authRequired) && (
        <>{children}</>
      )}
    </>
  );
}

export default RequireAuth;
