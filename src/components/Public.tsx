import React from 'react';
import { useAuthentication } from '../Authentication';
type Props = {
  children: React.ReactNode;
};
function Public(props: Props) {
  const { children } = props;
  const { status } = useAuthentication();
  return <div>{status !== 'LOGGING' && children}</div>;
}

export default Public;
