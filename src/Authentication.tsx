import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  cleanAll,
  getCodeVerifier,
  getRedirectUri,
  setCodeVerifier,
  setLoggedIn,
  setRedirectUri,
} from './AuthStoreService';
import { AuthenticationConfig, EStatus, OpenIDToken, UserInfo } from './model';

import * as oauth from 'oauth4webapi';

type ProviderInfoType = {
  selected: string;
  list: string[];
  defaultProvider?: string;
};

type AuthCtxType = {
  login: (provider?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
  status: EStatus;
  changeStatus: (status: EStatus) => void;
  userInfo?: UserInfo;
  openIDToken?: OpenIDToken;
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

  const issuers = Object.keys(config.issuers || {}).map(k => k);

  const [currentIssuer, setCurrentIssuer] = useState<string>(issuers[0]);

  const [openIDToken, setOpenIDToken] = useState<OpenIDToken>();

  const [status, setStatus] = useState<AuthCtxType['status']>(
    !!getCodeVerifier() ? 'LOGGING' : 'INIT'
  );

  const [userInfo, setUserInfo] = useState<UserInfo>();

  const isAuthenticated = useMemo(
    () => !!openIDToken?.access_token,
    [openIDToken]
  );

  const onceCall = useRef<boolean>(false);

  useEffect(() => {
    if (!onceCall.current) {
      onceCall.current = true;
      const issuer = new URL(currentIssuer);
      if (isAuthenticated) {
        setStatus('LOGGED');
      } else {
        getAuthServer(issuer).then(({ as, client, issuerInfo }) => {
          const currentUrl = new URL(location.href);
          const params = oauth.validateAuthResponse(
            as,
            client,
            currentUrl,
            oauth.expectNoState
          );
          const code_verifier = getCodeVerifier();
          if (oauth.isOAuth2Error(params)) {
            setStatus('INIT');
          } else {
            setStatus('LOGGING');
            retriveToken(code_verifier!, params);
          }
        });
      }
    }
  }, []);

  /*  
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
*/
  const retriveToken = async (
    code_verifier: string,
    params: URLSearchParams
  ) => {
    const issuer = new URL(currentIssuer);
    const { as, client, issuerInfo } = await getAuthServer(issuer);

    const localRedirectUri = decodeURIComponent(
      getRedirectUri() ?? issuerInfo.redirect_uri
    );

    const response = await oauth.authorizationCodeGrantRequest(
      as,
      client,
      params,
      localRedirectUri,
      code_verifier
    );

    let challenges: oauth.WWWAuthenticateChallenge[] | undefined;
    if ((challenges = oauth.parseWwwAuthenticateChallenges(response))) {
      for (const challenge of challenges) {
        console.log('challenge', challenge);
      }
      throw new Error(); // Handle www-authenticate challenges as needed
    }

    const result = await oauth.processAuthorizationCodeOpenIDResponse(
      as,
      client,
      response
    );
    if (oauth.isOAuth2Error(result)) {
      console.log('error', result);
      throw new Error(); // Handle OAuth 2.0 response body error
    }
    setStatus(() => 'LOGGED');
    setOpenIDToken(() => result);
    const uInfo = await retriveUserInfo();
    setUserInfo(() => uInfo);
    setLoggedIn(result.id_token!);
  };

  const refreshToken = async () => {
    const issuer = new URL(currentIssuer);
    const { as, client, issuerInfo } = await getAuthServer(issuer);

    if (openIDToken?.refresh_token) {
      const request = await oauth.refreshTokenGrantRequest(
        as,
        client,
        openIDToken?.refresh_token
      );
      const result = await oauth.processRefreshTokenResponse(
        as,
        client,
        request
      );
      if (oauth.isOAuth2Error(result)) {
        console.log('error', result);
        throw new Error(); // Handle OAuth 2.0 response body error
      }
      setStatus(() => 'LOGGED');
      setOpenIDToken(() => ({ ...result } as OpenIDToken));
      const uInfo = await retriveUserInfo();
      setUserInfo(() => uInfo);
      setLoggedIn(result.id_token!);
    }
  };

  const login = async (_issuer?: string) => {
    const issuer = new URL(_issuer ?? currentIssuer);
    const { as, client, issuerInfo } = await getAuthServer(issuer);
    setCurrentIssuer(() => issuer.href);
    if (as.code_challenge_methods_supported?.includes('S256') !== true) {
      // This example assumes S256 PKCE support is signalled
      // If it isn't supported, random `nonce` must be used for CSRF protection.
      throw new Error();
    }

    const code_verifier = oauth.generateRandomCodeVerifier();
    const code_challenge = await oauth.calculatePKCECodeChallenge(
      code_verifier
    );
    const code_challenge_method = 'S256';

    setCodeVerifier(code_verifier);

    const redirect_uri = overrideRedirectUri
      ? overrideRedirectUri(location)
      : issuerInfo.redirect_uri;

    setRedirectUri(
      overrideRedirectUri
        ? overrideRedirectUri(location)
        : issuerInfo.redirect_uri
    );

    const authorizationUrl = new URL(as.authorization_endpoint!);
    authorizationUrl.searchParams.set('client_id', client.client_id);
    authorizationUrl.searchParams.set('code_challenge', code_challenge);
    authorizationUrl.searchParams.set(
      'code_challenge_method',
      code_challenge_method
    );
    authorizationUrl.searchParams.set('redirect_uri', redirect_uri);
    authorizationUrl.searchParams.set('response_type', 'code');
    authorizationUrl.searchParams.set('scope', issuerInfo.requested_scopes);

    window.location.replace(authorizationUrl);
  };

  const logout = async () => {
    if (currentIssuer && openIDToken?.access_token) {
      const { as, client } = await getAuthServer(new URL(currentIssuer));
      const request = await oauth.revocationRequest(
        as,
        client,
        openIDToken.access_token
      );
      cleanAll();

      const response = await oauth.processRevocationResponse(request);
      if (oauth.isOAuth2Error(response)) {
        console.log('error', response);
        throw new Error(); // Handle OAuth 2.0 response body error
      }
    }
  };

  const retriveUserInfo = async () => {
    if (openIDToken && openIDToken?.access_token) {
      const claims = oauth.getValidatedIdTokenClaims(openIDToken);
      const { as, client } = await getAuthServer(new URL(currentIssuer));
      const response = await oauth.userInfoRequest(
        as,
        client,
        openIDToken.access_token
      );

      let challenges: oauth.WWWAuthenticateChallenge[] | undefined;
      if ((challenges = oauth.parseWwwAuthenticateChallenges(response))) {
        for (const challenge of challenges) {
          console.log('challenge', challenge);
        }
        throw new Error(); // Handle www-authenticate challenges as needed
      }

      const result = await oauth.processUserInfoResponse(
        as,
        client,
        claims.sub,
        response
      );
      return result;
    }
  };

  const changeStatus = (status: EStatus) => setStatus(status);

  const getAuthServer = useCallback(
    async (issuer: URL) => {
      const as = await oauth
        .discoveryRequest(issuer)
        .then(response => oauth.processDiscoveryResponse(issuer, response));

      const issuerInfo = config.issuers[issuer.href];
      const client: oauth.Client = {
        client_id: issuerInfo.client_id,
        client_secret: issuerInfo.client_secret,
      };
      return { as, client, issuerInfo };
    },
    [config]
  );

  return (
    <AutenticationContext.Provider
      value={{
        login,
        logout,
        isAuthenticated,
        status,
        changeStatus,
        refreshToken,
        userInfo,
        openIDToken,
      }}
    >
      {children}
    </AutenticationContext.Provider>
  );
}

export function useAuthentication() {
  return useContext(AutenticationContext);
}

export function useToken(): OpenIDToken {
  const { isAuthenticated, openIDToken } = useAuthentication();
  if (!isAuthenticated || !!!openIDToken?.access_token) {
    throw new Error('User not authenticated!');
  }

  return openIDToken;
}

export function useUserInfo(): UserInfo {
  const { isAuthenticated, userInfo } = useAuthentication();
  if (!isAuthenticated || !!!userInfo) {
    throw new Error('User not authenticated!');
  }
  return userInfo;
}
