import { AxiosStatic } from 'axios';
import queryString from 'query-string';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { interceptor } from './interceptor';
import {
  clear,
  clearCodeVerifierAndSate,
  getAccessToken,
  getCodeVerifier,
  getIdToken,
  getProviderOidc,
  getRefreshToken,
  getState,
  setCodeVerifier,
  setProviderOidc,
  setState as setStateLocalStorage,
  setToken,
} from './LocalStorageService';
import { TokenResponse } from './models/TokenResponse';
import {
  base64decode,
  generateCodeVerifier,
  generateRandomState,
  pkceChallengeFromVerifier,
} from './utils';

type ProviderOptions = {
  name: string;
  authorization_endpoint: string;
  token_endpoint: string;
  client_id: string;
  requested_scopes: string;
  access_type?: string;
  redirect_uri: string;
  redirect_logout_uri?: string;
  end_session_endpoint: string;
  client_secret?: string;
};

export type AuthenticationConfig = {
  providers: {
    [key in string]: ProviderOptions;
  };
  serviceUrl?: string;
};

type InitFlowUrlType = {
  authorization_endpoint: string;
  client_id: string;
  redirect_uri: string;
  requested_scopes: string;
  code_challenge: string;
  state: string;
  code_challenge_method: 'S256';
  access_type?: string;
};

type EStatus = 'INIT' | 'LOGIN' | 'LOGGING' | 'LOGGED';

type AuthCtxType = {
  login: (provider: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  status: EStatus;
  userInfo: () => { [key: string]: any } | undefined;
  updateStatus: (status: EStatus) => void;
};

const AutenticationContext = React.createContext<AuthCtxType>(
  {} as AuthCtxType
);

export default function AuthenticationProvider(_props: {
  axios: AxiosStatic;
  config: AuthenticationConfig;
  children: React.ReactNode;
  onTokenRequest?: (
    axios: AxiosStatic,
    data: {
      token_endpoint: string;
      client_id: string;
      redirect_uri: string;
      code: string;
      code_verifier: string;
    }
  ) => Promise<TokenResponse>;
  onRefreshTokenRequest?: (
    axios: AxiosStatic,
    data: {
      token_endpoint: string;
      client_id: string;
      refresh_token: string;
    }
  ) => Promise<TokenResponse>;
}) {
  const { axios, onTokenRequest, onRefreshTokenRequest } = _props;

  const { providers, serviceUrl } = _props.config;

  const [status, setStatus] = useState<AuthCtxType['status']>(
    !!getState() ? 'LOGGING' : 'INIT'
  );

  const provider = useMemo(() => {
    const providerName = getProviderOidc();
    return providerName ? providers[providerName] : undefined;
  }, []);

  useEffect(() => {
    interceptor(axios, serviceUrl ?? '', refreshToken);

    const code = queryString.parse(window.location.search).code as string;
    const stateLocalStorage = getState();
    const code_verifier = getCodeVerifier();
    if (code && stateLocalStorage && code_verifier && provider) {
      setStatus('LOGGING');
      const { client_id, token_endpoint, client_secret, redirect_uri } =
        provider;
      const BASIC_TOKEN = `Basic ${window.btoa(
        `${client_id}:${client_secret}`
      )}`;
      const tokenRequest = onTokenRequest
        ? () =>
            onTokenRequest(axios, {
              token_endpoint,
              client_id,
              redirect_uri,
              code,
              code_verifier,
            })
        : () =>
            axios
              .post(
                token_endpoint,
                queryString.stringify({
                  grant_type: 'authorization_code',
                  redirect_uri,
                  code,
                  code_verifier,
                  ...(!client_secret && { client_id }),
                }),
                {
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    ...(client_secret && {
                      Authorization: BASIC_TOKEN,
                    }),
                  },
                }
              )
              .then(res => res.data as TokenResponse);

      tokenRequest()
        .then(function (data: TokenResponse) {
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
      setStatus('INIT');
    }
  }, []);

  const refreshToken = async () => {
    if (provider) {
      const { client_id, token_endpoint, client_secret } = provider;
      const BASIC_TOKEN = `Basic ${window.btoa(
        `${client_id}:${client_secret}`
      )}`;
      const refreshTokenFn = onRefreshTokenRequest
        ? () =>
            onRefreshTokenRequest(axios, {
              client_id,
              token_endpoint,
              refresh_token: getRefreshToken() || '',
            })
        : () =>
            axios
              .post(
                token_endpoint,
                queryString.stringify({
                  grant_type: 'refresh_token',
                  refresh_token: getRefreshToken(),
                  ...(!client_secret && { client_id }),
                }),
                {
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    ...(client_secret && {
                      Authorization: BASIC_TOKEN,
                    }),
                  },
                }
              )
              .then(res => res.data as TokenResponse);

      try {
        const data: TokenResponse = await refreshTokenFn();
        setStatus('LOGGED');
        return data;
      } catch (err) {
        console.log(err);
        logout();
        return {} as TokenResponse;
      }
    } else {
      throw Error('Provider not found');
    }
  };

  const login = (providerName: string) => {
    const _provider = providers[providerName];
    if (_provider) {
      setProviderOidc(providerName);
      const {
        authorization_endpoint,
        client_id,
        redirect_uri,
        requested_scopes,
        access_type,
      } = _provider;
      const new_code_verifier = generateCodeVerifier();
      const new_state = generateRandomState();
      setStateLocalStorage(new_state);
      setCodeVerifier(new_code_verifier);
      window.location.href = initFlowUrl({
        authorization_endpoint,
        client_id,
        redirect_uri: redirect_uri ?? window.location.href,
        requested_scopes,
        code_challenge: pkceChallengeFromVerifier(new_code_verifier),
        state: new_state,
        code_challenge_method: 'S256',
        access_type,
      });
    } else {
      clear();
      throw new Error('Provider not found');
    }
  };

  const logout = () => {
    if (provider) {
      clear();
      const { end_session_endpoint, redirect_logout_uri, redirect_uri } =
        provider;
      window.location.href = `${end_session_endpoint}?post_logout_redirect_uri=${
        redirect_logout_uri ?? redirect_uri
      }`;
    } else {
      throw new Error('Provider not found');
    }
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

  const updateStatus = useCallback(
    (status: EStatus) => setStatus(status),
    [status]
  );

  return (
    <AutenticationContext.Provider
      value={{
        login,
        logout,
        isAuthenticated,
        status,
        userInfo,
        updateStatus,
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
    access_type,
  } = init;
  return `${authorization_endpoint}?${queryString.stringify({
    response_type: 'code',
    client_id,
    state,
    scope: requested_scopes,
    redirect_uri,
    code_challenge,
    code_challenge_method,
    ...(access_type && { access_type }),
  })}`;
}

export function useAuthentication() {
  return useContext(AutenticationContext);
}
