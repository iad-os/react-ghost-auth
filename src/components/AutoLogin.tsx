import React, { useEffect } from 'react';
import { useAuthentication } from '../Authentication';
import { getProviderOidc } from '../LocalStorageService';

type Props = {
  children?: React.ReactNode;
};

function AutoLogin(props: Props) {
  const { children } = props;
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

    if (
      storedProvider !== null &&
      status !== 'LOGGED' &&
      status !== 'LOGGING'
    ) {
      login(storedProvider);
    } else if (
      !children &&
      providers?.length === 1 &&
      status === 'LOGIN' &&
      !isAuthenticated()
    ) {
      login(providers[0]);
    }
  }, [status]);

  return (
    <div>
      {storedProvider === null &&
        providerInfo &&
        providerInfo.list.length > 1 &&
        !isAuthenticated() &&
        status === 'LOGIN' &&
        children}
    </div>
  );
}

export default AutoLogin;
