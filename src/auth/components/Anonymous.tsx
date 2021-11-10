import React from 'react';
import { useAuthentication } from '../Authentication';

type Props = {
  children: React.ReactNode;
};

function Anonymous(props: Props) {
  const { children } = props;
  const { isAuthenticated, status } = useAuthentication();

  return <div>{!isAuthenticated() && status === 'LOGGING' && children}</div>;
}

export default Anonymous;
