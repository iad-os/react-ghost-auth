import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AuthenticationConfig,
  EStatus,
  FetchError,
  ProviderOptions,
  TokenResponse,
} from './models';
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
import { getWellKnown } from './services';
type AuthCtxType = {
  login: (provider?: string) => Promise<void>;
  logout: () => Promise<void>;
  autologin: () => void;
  isAuthenticated: () => boolean;
  status: EStatus;
  refreshToken: () => Promise<TokenResponse>;
  token?: TokenResponse;
  providers: AuthenticationConfig['providers'];
  currentProvider?: ProviderOptions;
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

  const { providers } = config;

  const localStorage = useLocalstorage();

  const [status, setStatus] = useState<AuthCtxType['status']>('INIT');

  const [token, setToken] = useState<TokenResponse>();
  const tokenRef = useRef<TokenResponse | null>(null);

  const loading = useMemo(() => status === 'INIT', [status]);

  const currentProvider = useMemo<ProviderOptions | undefined>(() => {
    const lsp = localStorage.load('provider_issuer');
    return providers.find(i => i.issuer === lsp);
  }, [status, token]);

  const defaultProvider = useMemo<ProviderOptions | undefined>(() => {
    return providers.find(i => i.defualt);
  }, []);

  const onceCall = useRef<boolean>(false);

  useLayoutEffect(() => {
    if (!onceCall.current) {
      onceCall.current = true;
      const params = parseQueryString(window.location.search);
      const code = params.code as string | undefined;
      const stateLocalStorage = localStorage.load('state');
      const code_verifier = localStorage.load('code_verifier');
      if (code && stateLocalStorage && code_verifier && currentProvider) {
        setStatus('LOGGING');
        retriveToken(code, code_verifier);
      } else if (isAuthenticated()) {
        setStatus('LOGGED-IN');
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
      const stateLocalStorage = localStorage.load('state');
      const code_verifier = localStorage.load('code_verifier');
      console.log('*** REACT GHOST AUTH STATUS ***', {
        status,
        currentProvider: currentProvider,
        code,
        stateLocalStorage,
        code_verifier,
        lsToken: saveOnLocalStorage,
        config,
        loading,
        token,
        isAuthenticated: isAuthenticated(),
      });
    }
  });

  useEffect(() => {
    if (token) {
      saveOnLocalStorage &&
        localStorage.save('access_token', token.access_token);
      localStorage.save('logged_in', token.id_token);
      setStatus(() => 'LOGGED-IN');
    }
  }, [token]);

  async function waitNewToken(): Promise<TokenResponse> {
    return new Promise<TokenResponse>(resolve => {
      const check = () => {
        if (tokenRef.current !== null) {
          resolve(tokenRef.current);
        } else {
          setTimeout(check, 500);
        }
      };
      check();
    });
  }

  function updateToken(token?: TokenResponse) {
    tokenRef.current = token === undefined ? null : token;
    setToken(() => token);
  }

  const retriveToken = async (
    code: string,
    code_verifier: string
  ): Promise<void> => {
    if (currentProvider) {
      const { token_endpoint } = await getWellKnown(currentProvider.issuer);
      const { client_id, client_secret, redirect_uri } = currentProvider;
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
        .then(res => {
          if (res.ok) {
            return res.json() as Promise<TokenResponse>;
          }
          throw new FetchError(res);
        })
        .then(data => {
          updateToken(data);
          onRoute(localRedirectUri, !!overrideRedirectUri);
        })
        .catch(error => {
          console.error(error);
        })
        .finally(() => {
          localStorage.clear(['code_verifier', 'redirect_uri', 'state']);
        });
    } else {
      updateToken(undefined);
      throw Error('OIDC Provider not found');
    }
  };

  const refreshToken = async (): Promise<TokenResponse> => {
    if (currentProvider) {
      const { client_id, client_secret } = currentProvider;
      const { token_endpoint } = await getWellKnown(currentProvider.issuer);

      if (tokenRef.current === null) {
        const newToken = await waitNewToken();
        if (newToken) {
          return newToken;
        }
        throw new Error('Error on waiting new token');
      }
      tokenRef.current = null;

      const BASIC_TOKEN = `Basic ${window.btoa(
        `${client_id}:${client_secret}`
      )}`;
      return new Promise<TokenResponse>((resolve, reject) =>
        fetch(token_endpoint, {
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
        })
          .then(res => {
            if (res.ok) {
              return res.json() as Promise<TokenResponse>;
            }
            throw new FetchError(res);
          })
          .then(data => {
            updateToken(data);
            resolve(data);
          })
          .catch(error => {
            reject(error);
            console.error(error);
            logout();
          })
      );
    } else {
      updateToken(undefined);
      throw Error('OIDC Provider not found');
    }
  };

  const login = async (issuer?: string) => {
    let provider: ProviderOptions | undefined;
    if (issuer) {
      provider = providers.find(p => p.issuer === issuer);
    } else {
      provider = defaultProvider ?? providers[0];
    }

    if (!provider) {
      throw new Error('OIDC Provider not found');
    }

    localStorage.clear();

    const { authorization_endpoint } = await getWellKnown(provider.issuer);

    if (provider) {
      localStorage.save('provider_issuer', provider.issuer);
      const {
        client_id,
        redirect_uri,
        requested_scopes,
        access_type,
        kc_idp_hint,
      } = provider;

      localStorage.save(
        'redirect_uri',
        overrideRedirectUri ? overrideRedirectUri(location) : redirect_uri
      );

      if (provider.pkce) {
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
              kc_idp_hint,
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
            kc_idp_hint,
          })
        );
      }
    } else {
      updateToken(undefined);
      throw new Error('OIDC Provider not found');
    }
  };

  const logout = async () => {
    if (currentProvider && token) {
      const { end_session_endpoint } = await getWellKnown(
        currentProvider.issuer
      );

      localStorage.clear();
      const {
        redirect_logout_uri,
        redirect_uri,
        kc_idp_hint: initiating_idp,
      } = currentProvider;
      const id_token_hint = token.id_token;
      const post_logout_redirect_uri = `${redirect_logout_uri ?? redirect_uri}`;
      const logoutUrl = `${end_session_endpoint}?${stringfyQueryString({
        post_logout_redirect_uri,
        initiating_idp,
        id_token_hint,
      })}`;
      window.location.href = logoutUrl;
    } else {
      throw new Error('OIDC Provider not found');
    }
  };

  const isAuthenticated = (): boolean => {
    return !!token && status === 'LOGGED-IN';
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
        token,
        currentProvider,
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
