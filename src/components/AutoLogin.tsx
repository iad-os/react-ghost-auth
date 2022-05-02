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
    if (
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
      {providerInfo &&
        providerInfo.list.length > 1 &&
        !isAuthenticated() &&
        status === 'LOGIN' &&
        children}
    </div>
  );
}

export default AutoLogin;
