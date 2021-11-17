import React from 'react';
import { useAuthentication } from '../Authentication';
type Props = {
  children: React.ReactNode;
};
function Public(props: Props) {
  const { children } = props;
  const { status } = useAuthentication();
  return <>{status !== 'LOGGING' && children}</>;
}

export default Public;
