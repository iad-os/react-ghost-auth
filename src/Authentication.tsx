import React, {
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { clearAllCookies, getCookie } from './cookie.utils';
import {
  AuthenticationConfig,
  EStatus,
  ProviderOptions,
  TokenResponse
} from './models';
import {
  getCurrentProvider,
  setProviders
} from './providerStore';
import tokenService, { getToken } from './token';
import {
  base64decode,
  parseQueryString
} from './utils';
type AuthCtxType = {
  login: (provider?: string) => Promise<void>;
  logout: () => Promise<void>;
  autologin: () => void;
  isAuthenticated: () => boolean;
  status: EStatus;
  refreshToken: () => Promise<TokenResponse>;
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

  useLayoutEffect(() => {
    setProviders(providers);
  }, [providers]);


  const loading = useMemo(() => status === 'INIT', [status]);

  const onceCall = useRef<boolean>(false);

  useLayoutEffect(() => {
    if (!onceCall.current) {
      onceCall.current = true;
      const params = parseQueryString(window.location.search);
      const code = params.code as string | undefined;
      const stateCookie = getCookie('state');
      const code_verifier = getCookie('code_verifier');
      const currentProvider = getCurrentProvider();
      const token = tokenService.getToken();
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
      const stateCookie = getCookie('state');
      const code_verifier = getCookie('code_verifier');
      console.log('*** REACT GHOST AUTH STATUS ***', {
        status,
        currentProvider: getCurrentProvider(),
        code,
        stateCookie,
        code_verifier,
        token: tokenService.getToken(),
        config,
        loading,
        isAuthenticated: isAuthenticated(),
      });
    }
  });


  const retriveToken = async (
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
  };

  const refreshToken = (): Promise<TokenResponse> => {
    try {
      return tokenService.refreshToken()
    } catch (error) {
      console.error(error);
      logout();
      throw error;
    }
  };

  const login = async (issuer?: string) => {
    try {
      return tokenService.login({ issuer, overrideRedirectUri })
    } catch (error) {
      console.error(error);
      clearAllCookies();
      throw error;
    }
  };

  const logout = async () => {
    await tokenService.logout();
  };

  const isAuthenticated = (): boolean => {
    return !!getToken() && status === 'LOGGED-IN';
  };

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
        getToken,
        getCurrentProvider,
        providers,
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
  const { isAuthenticated, refreshToken, getToken } = useAuthentication();
  if (!isAuthenticated() || !getToken()) {
    throw new Error('User not authenticated!');
  }
  return { getToken, refreshToken };
}

export function useUserInfo<T = any>(): T {
  const { isAuthenticated, getToken } = useAuthentication();

  const idToken = useMemo(() => getToken()?.id_token, [getToken]);

  if (!isAuthenticated() || !idToken) {
    throw new Error('User not authenticated!');
  }
  const [_, payload] = idToken.split('.');
  return base64decode(payload) as T;
}
