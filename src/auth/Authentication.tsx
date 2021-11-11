import React, { useContext, useEffect, useState } from 'react';

import {
  base64decode,
  generateCodeVerifier,
  generateRandomState,
  pkceChallengeFromVerifier,
} from './utils';
import queryString from 'query-string';
import { AxiosStatic } from 'axios';
import { interceptor } from './interceptor';
import {
  clear,
  clearCodeVerifierAndSate,
  getAccessToken,
  getCodeVerifier,
  getRefreshToken,
  getState,
  setState as setStateLocalStorage,
  setCodeVerifier,
  setToken,
  getIdToken,
} from './LocalStorageService';
import { TokenResponse } from './models/TokenResponse';

export type AuthenticationOptions = {
  serviceUrl: string;
  authorization_endpoint: string;
  token_endpoint: string;
  client_id: string;
  requested_scopes: string;
  redirect_uri: string;
  end_session_endpoint: string;
  realm: string;
};

type InitFlowUrlType = {
  authorization_endpoint: string;
  client_id: string;
  redirect_uri: string;
  requested_scopes: string;
  code_challenge: string;
  state: string;
  code_challenge_method: 'S256';
};

type AuthCtxType = {
  login: () => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  status: 'LOGIN' | 'LOGGING' | 'LOGGED';
  userInfo: () => { [key: string]: any } | undefined;
};

const AutenticationContext = React.createContext<AuthCtxType>(
  {} as AuthCtxType
);

export default function AuthenticationProvider(_props: {
  axios: AxiosStatic;
  options: AuthenticationOptions;
  children: React.ReactNode;
}) {
  const redirect_uri = `${window.location.protocol}//${
    window.location.hostname
  }${window.location.port !== '' ? `:${window.location.port}` : ''}`;

  const { axios } = _props;

  const {
    client_id,
    authorization_endpoint,
    requested_scopes,
    token_endpoint,
    end_session_endpoint,
    realm,
    serviceUrl,
  } = _props.options;

  const [status, setStatus] = useState<AuthCtxType['status']>(
    !!getState() ? 'LOGGING' : 'LOGIN'
  );

  useEffect(() => {
    interceptor(axios, serviceUrl, refreshToken);

    const code = queryString.parse(window.location.search).code;
    const stateLocalStorage = getState();
    const code_verifier = getCodeVerifier();
    if (code && stateLocalStorage && code_verifier) {
      setStatus('LOGGING');
      axios
        .post(
          token_endpoint,
          queryString.stringify({
            client_secret: '',
            grant_type: 'authorization_code',
            client_id,
            redirect_uri,
            code,
            code_verifier,
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        )
        .then(function ({ data }: { data: TokenResponse }) {
          setToken(data);
          window.location.href = redirect_uri;
        })
        .catch(function (error) {
          console.log(error);
        })
        .finally(() => {
          clearCodeVerifierAndSate();
        });
    } else if (isAuthenticated()) {
      setStatus('LOGGED');
    } else {
      setStatus('LOGIN');
    }
  }, []);

  const refreshToken = async () => {
    try {
      const { data }: { data: TokenResponse } = await axios.post(
        token_endpoint,
        queryString.stringify({
          grant_type: 'refresh_token',
          client_id,
          refresh_token: getRefreshToken(),
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      setToken(data);
      setStatus('LOGGED');
      return data;
    } catch (err) {
      console.log(err);
      logout();
      return {} as TokenResponse;
    }
  };

  const login = () => {
    const new_code_verifier = generateCodeVerifier();
    const new_state = generateRandomState();
    setStateLocalStorage(new_state);
    setCodeVerifier(new_code_verifier);
    window.location.href = initFlowUrl({
      authorization_endpoint,
      client_id,
      redirect_uri,
      requested_scopes,
      code_challenge: pkceChallengeFromVerifier(new_code_verifier),
      state: new_state,
      code_challenge_method: 'S256',
    });
  };

  const logout = () => {
    clear();
    window.location.href = `${end_session_endpoint}?post_logout_redirect_uri=${redirect_uri}`;
  };

  const isAuthenticated = (): boolean => {
    return !!getAccessToken();
  };

  const userInfo: AuthCtxType['userInfo'] = () => {
    const idToken = getIdToken();
    if (idToken) {
      const [_, payload] = idToken.split('.');
      return base64decode(payload);
    }
    return undefined;
  };

  return (
    <AutenticationContext.Provider
      value={{
        login,
        logout,
        isAuthenticated,
        status,
        userInfo,
      }}
    >
      {_props.children}
    </AutenticationContext.Provider>
  );
}

function initFlowUrl(init: InitFlowUrlType) {
  const {
    authorization_endpoint,
    client_id,
    redirect_uri,
    requested_scopes,
    code_challenge,
    state,
    code_challenge_method,
  } = init;
  return `${authorization_endpoint}?${queryString.stringify({
    response_type: 'code',
    client_id,
    state,
    scope: requested_scopes,
    redirect_uri,
    code_challenge,
    code_challenge_method,
  })}`;
}

export function useAuthentication() {
  const { login, logout, isAuthenticated, status, userInfo } =
    useContext(AutenticationContext);

  return {
    login,
    logout,
    isAuthenticated,
    status,
    userInfo,
  };
}
