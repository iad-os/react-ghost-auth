import React, { useMemo } from 'react';
import { useAuthentication } from '../Authentication';

type LoggedProps = {
  in: React.ReactNode;
  out?: React.ReactNode;
};

function Logged(props: LoggedProps) {
  const { in: loggedIn, out: loggedOut } = props;
  const { isAuthenticated, status } = useAuthentication();

  const authenticated = useMemo(
    () => status === 'LOGGED' && isAuthenticated(),
    [status]
  );

  if (authenticated) {
    return <React.Fragment>{loggedIn}</React.Fragment>;
  } else {
    return <React.Fragment>{loggedOut ?? <></>}</React.Fragment>;
  }
}

export default Logged;
