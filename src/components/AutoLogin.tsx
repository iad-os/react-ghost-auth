import React, { useEffect, useState } from 'react';
import { useAuthentication } from '../Authentication';
import { getProviderOidc } from '../AuthStoreService';

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
  }, [status]);

  return <div>{showChildren && children}</div>;
}

export default AutoLogin;
