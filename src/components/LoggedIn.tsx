import React from 'react';
import { useAuthentication } from '../Authentication';

type Props = {
  children: React.ReactNode;
};

function LoggedIn(props: Props) {
  const { children } = props;
  const { isAuthenticated, status } = useAuthentication();

  return <div>{isAuthenticated && status === 'LOGGED' && children}</div>;
}

export default LoggedIn;
