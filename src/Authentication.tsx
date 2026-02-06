import React, {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import { clearAllCookies } from './cookie.utils';
import {
  AuthenticationConfig,
  EStatus,
  ProviderOptions,
  TokenResponse
} from './models';
import store from './store';
import tokenService from './token';
import { base64decode, parseQueryString } from './utils';
type AuthCtxType = {
  login: (provider?: string) => Promise<void>;
  logout: () => Promise<void>;
  autologin: () => void;
  isAuthenticated: () => boolean;
  status: EStatus;
  refreshToken: () => Promise<TokenResponse>;
  token: TokenResponse | undefined;
  getToken: () => TokenResponse | undefined;
  getCurrentProvider: () => ProviderOptions | undefined;
  providers: AuthenticationConfig['providers'];
};

const AutenticationContext = React.createContext<AuthCtxType>(
  {} as AuthCtxType
);

export type AuthorizationProps = {
  config: AuthenticationConfig;
  children: React.ReactNode;
  overrideRedirectUri?: (location: Location) => string;
  onRoute: (route: string, overrided: boolean) => void;
  onError?: (message: string) => void;
  enableLog?: boolean;
};
export default function AuthenticationProvider(props: AuthorizationProps) {
  const {
    config,
    children,
    onRoute,
    onError,
    enableLog = false,
    overrideRedirectUri,
  } = props;

  const { location } = window;

  const { providers } = config;

  const [status, setStatus] = useState<AuthCtxType['status']>('INIT');

  const token = useSyncExternalStore(store.subscribe, () => store.get('token'));

  useLayoutEffect(() => {
    store.set('providers', providers);
  }, [providers]);


  const loading = useMemo(() => status === 'INIT', [status]);

  const onceCall = useRef<boolean>(false);

  useLayoutEffect(() => {
    if (!onceCall.current) {
      onceCall.current = true;
      const params = parseQueryString(window.location.search);
      const code = params.code as string | undefined;
      const stateCookie = store.get('state');
      const code_verifier = store.get('code_verifier');
      const currentProvider = store.get('current_provider');
      const token = store.get('token');
      if (code && stateCookie && code_verifier && currentProvider) {
        setStatus('LOGGING');
        retriveToken(code, code_verifier);
      } else if (!!token) {
        setStatus('LOGGED-IN');
        setTimeout(() => {
          const redirectUri = overrideRedirectUri ? overrideRedirectUri(location) : currentProvider?.redirect_uri ?? '';
          onRoute(redirectUri, !!overrideRedirectUri);
        }, 200);
      } else if (params.error) {
        onError && onError(params.error_description);
      } else {
        setStatus('LOGGED-OUT');
      }
    }
  }, []);

  useLayoutEffect(() => {
    if (enableLog) {
      const params = parseQueryString(window.location.search);
      const code = params.code as string | undefined;
      const stateCookie = store.get('state');
      const code_verifier = store.get('code_verifier');
      console.log('*** REACT GHOST AUTH STATUS ***', {
        status,
        currentProvider: store.get('current_provider'),
        code,
        stateCookie,
        code_verifier,
        token: store.get('token'),
        config,
        loading,
        isAuthenticated: isAuthenticated(),
      });
    }
  });


  const retriveToken = useCallback(async (
    code: string,
    code_verifier: string
  ): Promise<TokenResponse> => {
    try {
      return tokenService.retriveToken({ code, code_verifier })
    } catch (error) {
      console.error(error);
      logout();
      throw error;
    }
  }, []);

  const refreshToken = useCallback((): Promise<TokenResponse> => {
    try {
      return tokenService.refreshToken()
    } catch (error) {
      console.error(error);
      logout();
      throw error;
    }
  }, []);

  const login = useCallback(async (issuer?: string) => {
    try {
      return tokenService.login({ issuer, overrideRedirectUri })
    } catch (error) {
      console.error(error);
      clearAllCookies();
      throw error;
    }
  }, [overrideRedirectUri]);

  const logout = async () => {
    await tokenService.logout();
  };

  const isAuthenticated = useCallback(() => {
    return !!store.get('token') && status === 'LOGGED-IN';
  }, [status]);

  const autologin = () => setStatus(() => 'LOGIN');

  return (
    <AutenticationContext.Provider
      value={{
        login,
        logout,
        isAuthenticated,
        autologin,
        status,
        refreshToken,
        getToken: () => store.get('token'),
        getCurrentProvider: () => store.get('current_provider'),
        providers,
        token,
      }}
    >
      {!loading && children}
    </AutenticationContext.Provider>
  );
}

export function useAuthentication() {
  return useContext(AutenticationContext);
}

export function useToken() {
  const { isAuthenticated, refreshToken, token, getToken } = useAuthentication();
  if (!isAuthenticated() || !token) {
    throw new Error('User not authenticated!');
  }
  return { token, refreshToken, getToken };
}

export function useUserInfo<T = any>(): T {
  const { isAuthenticated, token } = useAuthentication();

  const idToken = useMemo(() => token?.id_token, [token]);

  if (!isAuthenticated() || !idToken) {
    throw new Error('User not authenticated!');
  }
  const [_, payload] = idToken.split('.');
  return base64decode(payload) as T;
}
