import React, { useEffect, useMemo, useState } from 'react';
import { useAuthentication } from '../Authentication';
import { getProviderOidc } from '../AuthStoreService';

type Props = {
  children?: React.ReactNode;
};

function AutoLogin(props: Props) {
  const { children } = props;

  const showChildren = useMemo<boolean>(
    () => children !== undefined,
    [children]
  );

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
    if (status === 'LOGIN' && !isAuthenticated() && !showChildren) {
      if (storedProvider !== null) {
        login(storedProvider);
      } else if (providers?.length === 1) {
        login(providers[0]);
      } else {
        throw new Error('AutoLogin: No provider founded!');
      }
    }
  }, [status]);

  return <div>{showChildren && children}</div>;
}

export default AutoLogin;
