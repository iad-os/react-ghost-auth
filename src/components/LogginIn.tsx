import React from 'react';
import { useAuthentication } from '../Authentication';

type Props = {
  children: React.ReactNode;
};

function LogginIn(props: Props) {
  const { children } = props;
  const { isAuthenticated, status } = useAuthentication();

  return <div>{!isAuthenticated && status === 'LOGGING' && children}</div>;
}

export default LogginIn;
