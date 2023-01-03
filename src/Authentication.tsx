import { AxiosStatic } from 'axios';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  setTokens,
} from './AuthStoreService';
import { AuthenticationConfig, EStatus, TokenResponse } from './models';
import {
  addOneYear,
  base64decode,
  generateRandomString,
  makeid,
  openIdInitialFlowUrl,
  parseQueryString,
  pkceChallengeFromVerifier,
  stringfyQueryString,
} from './utils';
import { CookiesProvider, useCookies } from 'react-cookie';

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
};

const AutenticationContext = React.createContext<AuthCtxType>(
  {} as AuthCtxType
);

export type AuthorizationProps = {
  axios: AxiosStatic;
  config: AuthenticationConfig;
  children: React.ReactNode;
  onRoute: (route: string) => void;
  needAuthorization?: (serviceUrl: string, requestUrl: string) => boolean;
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
  lsToken?: boolean;
  onError?: (message: string) => void;
  enableLog?: boolean;
  overrideRedirectUri?: boolean;
};

export const COOKIE_SESSION = 'logged_in';

export default function AuthenticationProvider(props: AuthorizationProps) {
  const {
    axios,
    onTokenRequest,
    onRefreshTokenRequest,
    config,
    children,
    needAuthorization,
    onRoute,
    lsToken = false,
    onError,
    enableLog = false,
    overrideRedirectUri = false,
  } = props;

  const [cookies, setCookie, removeCookie] = useCookies([
    COOKIE_SESSION,
    'redirect_uri',
  ]);

  const currentUri = window.location.href.split('?')[0];

  const providerNameList = Object.keys(config.providers || {}).map(k => k);

  const {
    providers,
    serviceUrl,
    default: defaultProviderName = providerNameList.length > 0
      ? providerNameList[0]
      : '',
  } = config;

  const [status, setStatus] = useState<AuthCtxType['status']>(
    !!getState() ? 'LOGGING' : 'INIT'
  );

  const provider = useMemo(() => {
    const providerName = getProviderOidc();
    return providerName ? providers[providerName] : undefined;
  }, []);

  const onceCall = useRef<boolean>(false);

  useEffect(() => {
    if (!onceCall.current) {
      onceCall.current = true;
      interceptor(axios, serviceUrl ?? '/', refreshToken, needAuthorization);
      const params = parseQueryString(window.location.search);
      const code = params.code as string | undefined;
      const stateLocalStorage = getState();
      const code_verifier = getCodeVerifier();
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
      const stateLocalStorage = getState();
      const code_verifier = getCodeVerifier();
      console.log('*** REACT GHOST AUTH STATUS ***', {
        status,
        currentProvider: provider,
        code,
        stateLocalStorage,
        code_verifier,
        lsToken,
        config,
      });
    }
  });

  const retriveToken = (code: string, code_verifier: string) => {
    if (provider) {
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
              redirect_uri: decodeURIComponent(
                cookies.redirect_uri ?? redirect_uri
              ),
              code,
              code_verifier,
            })
        : () =>
            axios
              .post(
                token_endpoint,
                stringfyQueryString({
                  grant_type: 'authorization_code',
                  redirect_uri: decodeURIComponent(
                    cookies.redirect_uri ?? redirect_uri
                  ),
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
          debugger;
          setTokens(data, lsToken);
          setStatus('LOGGED');
          setCookie('logged_in', data.id_token, {
            expires: addOneYear(new Date()),
            domain: window.location.hostname,
            path: '/',
          });
          setTimeout(
            () =>
              onRoute(decodeURIComponent(cookies.redirect_uri ?? redirect_uri)),
            500
          );
        })
        .catch(function (error) {
          console.error(error);
        })
        .finally(() => {
          clearCodeVerifierAndSate();
        });
    } else {
      throw Error('OIDC Provider not found');
    }
  };

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
                stringfyQueryString({
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
        setTokens(data, lsToken);
        setCookie('logged_in', data.id_token, {
          expires: addOneYear(new Date()),
          domain: window.location.hostname,
          path: '/',
        });
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

  const login = (providerName?: string) => {
    const _providerName = providerName ?? defaultProviderName ?? '';
    const _provider = _providerName ? providers[_providerName] : undefined;
    if (_provider && _providerName) {
      setProviderOidc(_providerName);
      const {
        authorization_endpoint,
        client_id,
        redirect_uri,
        requested_scopes,
        access_type,
      } = _provider;

      setCookie(
        'redirect_uri',
        overrideRedirectUri ? currentUri : redirect_uri,
        { maxAge: 180, domain: window.location.hostname, path: '/' }
      );

      setTimeout(() => {
        if (_provider.pkce) {
          const new_code_verifier = generateRandomString();
          const new_state = generateRandomString();
          setStateLocalStorage(new_state);
          setCodeVerifier(new_code_verifier);
          pkceChallengeFromVerifier(new_code_verifier).then(code_challenge => {
            window.location.replace(
              openIdInitialFlowUrl({
                authorization_endpoint,
                client_id,
                redirect_uri: overrideRedirectUri ? currentUri : redirect_uri,
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
          setStateLocalStorage(new_state);
          setCodeVerifier('NO_PKCE');
          window.location.replace(
            openIdInitialFlowUrl({
              authorization_endpoint,
              client_id,
              redirect_uri: overrideRedirectUri ? currentUri : redirect_uri,
              requested_scopes,
              state: new_state,
              access_type,
            })
          );
        }
      }, 800);
    } else {
      clear();
      throw new Error('OIDC Provider not found');
    }
  };

  const logout = () => {
    if (provider) {
      removeCookie('logged_in');
      clear();
      const { end_session_endpoint, redirect_logout_uri, redirect_uri } =
        provider;
      setTimeout(
        () =>
          (window.location.href = `${end_session_endpoint}?post_logout_redirect_uri=${
            redirect_logout_uri ?? redirect_uri
          }`),
        800
      );
    } else {
      throw new Error('OIDC Provider not found');
    }
  };

  const isAuthenticated = (): boolean => {
    return !!getAccessToken();
  };

  const changeStatus = useCallback(
    (status: EStatus) => setStatus(status),
    [status]
  );

  const providerInfo = () =>
    providers
      ? ({
          selected: provider?.name,
          list: Object.keys(providers),
          defaultProvider: defaultProviderName,
        } as ProviderInfoType)
      : undefined;

  return (
    <CookiesProvider>
      <AutenticationContext.Provider
        value={{
          login,
          logout,
          isAuthenticated,
          status,
          changeStatus,
          providerInfo,
        }}
      >
        {children}
      </AutenticationContext.Provider>
    </CookiesProvider>
  );
}

export function useAuthentication() {
  return useContext(AutenticationContext);
}

export function useToken(): string {
  const { isAuthenticated } = useAuthentication();
  const token = getAccessToken();
  if (!isAuthenticated() || !token) {
    throw new Error('User not authenticated!');
  }

  return token;
}

export function useUserInfo<T = any>(): T {
  const { isAuthenticated } = useAuthentication();
  const idToken = getIdToken();

  if (!isAuthenticated() || !idToken) {
    throw new Error('User not authenticated!');
  }
  const [_, payload] = idToken.split('.');
  return base64decode(payload) as T;
}
