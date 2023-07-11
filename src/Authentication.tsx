import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AuthenticationConfig, EStatus, TokenResponse } from './models';
import {
  base64decode,
  generateRandomString,
  makeid,
  openIdInitialFlowUrl,
  parseQueryString,
  pkceChallengeFromVerifier,
  stringfyQueryString,
} from './utils';
import useLocalstorage from './useLocalstorage';

type ProviderInfoType = {
  selected: string;
  list: string[];
  defaultProvider?: string;
};

type AuthCtxType = {
  login: (provider?: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  status: EStatus;
  changeStatus: (status: EStatus) => void;
  providerInfo: () => ProviderInfoType | undefined;
  refreshToken: () => Promise<TokenResponse>;
  token?: TokenResponse;
};

const AutenticationContext = React.createContext<AuthCtxType>(
  {} as AuthCtxType
);

export type AuthorizationProps = {
  config: AuthenticationConfig;
  children: React.ReactNode;
  overrideRedirectUri?: (location: Location) => string;
  onRoute: (route: string, overrided: boolean) => void;
  saveOnLocalStorage?: boolean;
  onError?: (message: string) => void;
  enableLog?: boolean;
};
export default function AuthenticationProvider(props: AuthorizationProps) {
  const {
    config,
    children,
    onRoute,
    saveOnLocalStorage = false,
    onError,
    enableLog = false,
    overrideRedirectUri,
  } = props;

  const { location } = window;

  const providerNameList = Object.keys(config.providers || {}).map(k => k);

  const {
    providers,
    serviceUrl,
    default: defaultProviderName = providerNameList.length > 0
      ? providerNameList[0]
      : '',
  } = config;

  const localStorage = useLocalstorage();

  const [status, setStatus] = useState<AuthCtxType['status']>(
    !!localStorage.load('state') ? 'LOGGING' : 'INIT'
  );

  const [token, setToken] = useState<TokenResponse>();

  const provider = useMemo(() => {
    const providerName = localStorage.load('provider_oidc');
    return providerName ? providers[providerName] : undefined;
  }, []);

  const onceCall = useRef<boolean>(false);

  useEffect(() => {
    if (!onceCall.current) {
      onceCall.current = true;
      const params = parseQueryString(window.location.search);
      const code = params.code as string | undefined;
      const stateLocalStorage = localStorage.load('state');
      const code_verifier = localStorage.load('code_verifier');
      if (code && stateLocalStorage && code_verifier && provider) {
        setStatus('LOGGING');
        retriveToken(code, code_verifier);
      } else if (isAuthenticated()) {
        setStatus('LOGGED');
      } else if (params.error) {
        onError && onError(params.error_description);
      } else {
        setStatus('INIT');
      }
    }
  }, []);

  useEffect(() => {
    if (enableLog) {
      const params = parseQueryString(window.location.search);
      const code = params.code as string | undefined;
      const stateLocalStorage = localStorage.load('state');
      const code_verifier = localStorage.load('code_verifier');
      console.log('*** REACT GHOST AUTH STATUS ***', {
        status,
        currentProvider: provider,
        code,
        stateLocalStorage,
        code_verifier,
        lsToken: saveOnLocalStorage,
        config,
      });
    }
  });

  const retriveToken = (code: string, code_verifier: string): Promise<void> => {
    if (provider) {
      const { client_id, token_endpoint, client_secret, redirect_uri } =
        provider;
      const BASIC_TOKEN = `Basic ${window.btoa(
        `${client_id}:${client_secret}`
      )}`;
      const localRedirectUri = decodeURIComponent(
        localStorage.load('redirect_uri') ?? redirect_uri
      );

      return fetch(token_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...(client_secret && {
            Authorization: BASIC_TOKEN,
          }),
        },
        body: stringfyQueryString({
          grant_type: 'authorization_code',
          redirect_uri: localRedirectUri,
          code,
          code_verifier,
          ...(!client_secret && { client_id }),
        }),
      })
        .then(res => res.json() as Promise<TokenResponse>)
        .then(data => {
          saveToken(data);
          onRoute(localRedirectUri, !!overrideRedirectUri);
        })
        .catch(error => {
          console.error(error);
        })
        .finally(() => {
          localStorage.clear(['code_verifier', 'redirect_uri', 'state']);
        });
    } else {
      throw Error('OIDC Provider not found');
    }
  };

  const refreshToken = async (): Promise<TokenResponse> => {
    if (provider) {
      const { client_id, token_endpoint, client_secret } = provider;
      const BASIC_TOKEN = `Basic ${window.btoa(
        `${client_id}:${client_secret}`
      )}`;

      const data = await fetch(token_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...(client_secret && {
            Authorization: BASIC_TOKEN,
          }),
        },
        body: stringfyQueryString({
          grant_type: 'refresh_token',
          refresh_token: token?.refresh_token,
          ...(!client_secret && { client_id }),
        }),
      }).then(res => res.json() as Promise<TokenResponse>);

      try {
        saveToken(data);
        return data;
      } catch (err) {
        console.error(err);
        logout();
        return {} as TokenResponse;
      }
    } else {
      throw Error('OIDC Provider not found');
    }
  };

  const saveToken = (data: TokenResponse) => {
    setToken(() => data);
    saveOnLocalStorage && localStorage.save('access_token', data.access_token);
    localStorage.save('logged_in', data.id_token);
    setStatus(() => 'LOGGED');
  };

  const login = (providerName?: string) => {
    const _providerName = providerName ?? defaultProviderName ?? '';
    const _provider = _providerName ? providers[_providerName] : undefined;
    if (_provider && _providerName) {
      localStorage.save('provider_oidc', _providerName);
      const {
        authorization_endpoint,
        client_id,
        redirect_uri,
        requested_scopes,
        access_type,
      } = _provider;

      localStorage.save(
        'redirect_uri',
        overrideRedirectUri ? overrideRedirectUri(location) : redirect_uri
      );

      if (_provider.pkce) {
        const new_code_verifier = generateRandomString();
        const new_state = generateRandomString();
        localStorage.save('state', new_state);
        localStorage.save('code_verifier', new_code_verifier);
        pkceChallengeFromVerifier(new_code_verifier).then(code_challenge => {
          window.location.replace(
            openIdInitialFlowUrl({
              authorization_endpoint,
              client_id,
              redirect_uri: overrideRedirectUri
                ? overrideRedirectUri(location)
                : redirect_uri,
              requested_scopes,
              code_challenge,
              state: new_state,
              code_challenge_method: 'S256',
              access_type,
            })
          );
        });
      } else {
        const new_state = makeid(64);
        localStorage.save('state', new_state);
        localStorage.save('code_verifier', 'NO_PKCE');
        window.location.replace(
          openIdInitialFlowUrl({
            authorization_endpoint,
            client_id,
            redirect_uri: overrideRedirectUri
              ? overrideRedirectUri(location)
              : redirect_uri,
            requested_scopes,
            state: new_state,
            access_type,
          })
        );
      }
    } else {
      localStorage.clear();
      throw new Error('OIDC Provider not found');
    }
  };

  const logout = () => {
    if (provider) {
      localStorage.clear();
      const { end_session_endpoint, redirect_logout_uri, redirect_uri } =
        provider;
      window.location.href = `${end_session_endpoint}?post_logout_redirect_uri=${
        redirect_logout_uri ?? redirect_uri
      }`;
    } else {
      throw new Error('OIDC Provider not found');
    }
  };

  const isAuthenticated = (): boolean => {
    return !!token;
  };

  const changeStatus = (status: EStatus) => setStatus(status);

  const providerInfo = () =>
    providers
      ? ({
          selected: provider?.name,
          list: Object.keys(providers),
          defaultProvider: defaultProviderName,
        } as ProviderInfoType)
      : undefined;

  return (
    <AutenticationContext.Provider
      value={{
        login,
        logout,
        isAuthenticated,
        status,
        changeStatus,
        providerInfo,
        refreshToken,
        token,
      }}
    >
      {children}
    </AutenticationContext.Provider>
  );
}

export function useAuthentication() {
  return useContext(AutenticationContext);
}

export function useToken() {
  const { isAuthenticated, refreshToken, token } = useAuthentication();
  if (!isAuthenticated() || !token) {
    throw new Error('User not authenticated!');
  }
  return { token, refreshToken };
}

export function useUserInfo<T = any>(): T {
  const { isAuthenticated, token } = useAuthentication();
  const idToken = token?.id_token;

  if (!isAuthenticated() || !idToken) {
    throw new Error('User not authenticated!');
  }
  const [_, payload] = idToken.split('.');
  return base64decode(payload) as T;
}
