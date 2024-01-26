import React, { useMemo } from 'react';
import { useAuthentication } from '../Authentication';

type LoggingProps = {
  in: React.ReactNode;
};

function Logging(props: LoggingProps) {
  const { in: loggingIn } = props;
  const { isAuthenticated, status } = useAuthentication();

  const logging = useMemo(
    () => status === 'LOGGING' && !isAuthenticated(),
    [status]
  );

  return <div>{logging && loggingIn}</div>;
}

export default Logging;
