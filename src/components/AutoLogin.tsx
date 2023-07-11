import React, { useEffect, useState } from 'react';
import { useAuthentication } from '../Authentication';
import useLocalstorage from '../useLocalstorage';


type Props = {
  children?: React.ReactNode;
};

function AutoLogin(props: Props) {
  const { children } = props;

  const ls = useLocalstorage();

  const [showChildren, setShowChildren] = useState<boolean>(false);

  const {
    login,
    isAuthenticated,
    status,
    providerInfo: providerInfoFn,
  } = useAuthentication();

  useEffect(() => {
    const loggedIn = ls.load('logged_in');
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
  
  const autologin = () => {
    const providerInfo = providerInfoFn();
    const storedProvider = ls.load('provider_oidc');
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

  return <div>{showChildren && children}</div>;

}

export default AutoLogin;
