import React, { useEffect, useState } from 'react';
import { useAuthentication } from '../Authentication';
import { getLoggedIn, getProviderOidc } from '../AuthStoreService';

type Props = {
  children?: React.ReactNode;
};

function AutoLogin(props: Props) {
  const { children } = props;

  const [showChildren, setShowChildren] = useState<boolean>(false);

  const {
    login,
    isAuthenticated,
    status,
    providerInfo: providerInfoFn,
  } = useAuthentication();

  const providerInfo = providerInfoFn();
  const storedProvider = getProviderOidc();

  useEffect(() => {
    const loggedIn = getLoggedIn();
    console.log({
      loggedIn,
      status,
    });
    if (loggedIn && status === 'INIT') {
      autologin();
    }
  }, [status]);

  useEffect(() => {
    if (status === 'LOGIN' && !isAuthenticated()) {
      autologin();
    } else {
      setShowChildren(false);
    }
  }, [status]);

  return <div>{showChildren && children}</div>;

  function autologin() {
    const providers = providerInfo?.list;
    if (storedProvider !== null) {
      setShowChildren(false);
      login(storedProvider);
    } else if (!children && providers?.length === 1) {
      setShowChildren(false);
      login(providers[0]);
    } else {
      setShowChildren(true);
    }
  }
}

export default AutoLogin;
