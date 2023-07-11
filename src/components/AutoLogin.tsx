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

  const { login, isAuthenticated, status } = useAuthentication();

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
    if (!children) {
      setShowChildren(false);
      login();
    } else {
      setShowChildren(true);
    }
  };

  return <div>{showChildren && children}</div>;
}

export default AutoLogin;
