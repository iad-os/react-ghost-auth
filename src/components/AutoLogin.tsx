import React, { useEffect } from 'react';
import { useAuthentication } from '../Authentication';

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

  useEffect(() => {
    const providers = providerInfo?.list;
    if (!isAuthenticated() && status === 'LOGIN' && providers) {
      providers.length === 1 && login(providers[0]);
    }
  }, [status]);

  return (
    <>
      {providerInfo &&
        providerInfo.list.length > 1 &&
        !isAuthenticated() &&
        status === 'LOGIN' &&
        children}
    </>
  );
}

export default AutoLogin;
