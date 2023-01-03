import React from 'react';
import { CookiesProvider } from 'react-cookie';
import AuthenticationProvider, { AuthorizationProps } from './Authentication';

export type ReactGhostAuthProviderProps = AuthorizationProps;

const ReactGhostAuthProvider = (props: ReactGhostAuthProviderProps) => {
  return (
    <CookiesProvider>
      <AuthenticationProvider {...props} />
    </CookiesProvider>
  );
};

export default ReactGhostAuthProvider;
