import React, { useEffect } from 'react';
import Logged from './Logged';
import { useAuthentication } from '../Authentication';

type RequireAuthPros = {
  children: React.ReactNode;
  loggedOut?: React.ReactNode;
  autologin?: boolean;
};

function RequireAuth(props: RequireAuthPros) {
  const { children, loggedOut: notLogged, autologin = false } = props;

  const { autologin: autologinFn } = useAuthentication();

  useEffect(() => {
    autologin && autologinFn();
  }, []);

  useEffect(() => {
    autologin && autologinFn();
  }, [autologin]);

  return <Logged in={children} out={notLogged} />;
}

export default RequireAuth;
