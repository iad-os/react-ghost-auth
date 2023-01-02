import React, { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { COOKIE_SESSION, useAuthentication } from '../Authentication';
import { getProviderOidc } from '../AuthStoreService';

type Props = {
  children?: React.ReactNode;
};

function AutoLogin(props: Props) {
  const { children } = props;

  const [showChildren, setShowChildren] = useState<boolean>(false);

  const [cookies] = useCookies([COOKIE_SESSION]);

  const {
    login,
    isAuthenticated,
    status,
    providerInfo: providerInfoFn,
    changeStatus,
  } = useAuthentication();

  const providerInfo = providerInfoFn();
  const storedProvider = getProviderOidc();

  useEffect(() => {
    const { ga_session } = cookies;
    if (ga_session && status === 'INIT') {
      changeStatus('LOGIN');
    }
  }, []);

  useEffect(() => {
    const providers = providerInfo?.list;
    if (status === 'LOGIN' && !isAuthenticated()) {
      if (storedProvider !== null) {
        setShowChildren(false);
        login(storedProvider);
      } else if (!children && providers?.length === 1) {
        setShowChildren(false);
        login(providers[0]);
      } else {
        setShowChildren(true);
      }
    } else {
      setShowChildren(false);
    }
  }, [status, cookies]);

  return <div>{showChildren && children}</div>;
}

export default AutoLogin;
