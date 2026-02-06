import { FetchError, ProviderOptions, TokenResponse } from './models';
import { getWellKnown } from './services';
import sessionStore from './sessionStore';
import store from './store';
import {
  generateRandomString,
  makeid,
  openIdInitialFlowUrl,
  pkceChallengeFromVerifier,
  stringfyQueryString,
} from './utils';

export const retriveToken = async (args: {
  code: string;
  code_verifier: string;
}): Promise<TokenResponse> => {
  const { code, code_verifier } = args;
  const currentProviderIssuer = sessionStore.get('current_provider_issuer');
  const currentProvider = store
    .getState()
    .providers.find(p => p.issuer === currentProviderIssuer);
  if (currentProvider) {
    const { token_endpoint } = await getWellKnown(currentProvider.issuer);
    const { client_id, client_secret } = currentProvider;
    const BASIC_TOKEN = `Basic ${window.btoa(`${client_id}:${client_secret}`)}`;

    const redirect_uri = sessionStore.get('redirect_uri');

    const response = await fetch(token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(client_secret && {
          Authorization: BASIC_TOKEN,
        }),
      },
      body: stringfyQueryString({
        grant_type: 'authorization_code',
        redirect_uri,
        code,
        code_verifier,
        ...(!client_secret && { client_id }),
      }),
    });
    if (response.ok) {
      const data = (await response.json()) as TokenResponse;
      store.setState({ token: data });
      return data;
    } else {
      throw new FetchError(response);
    }
  }
  throw Error('OIDC Provider not found');
};

export const refreshToken = async (): Promise<TokenResponse> => {
  const currentProviderIssuer = sessionStore.get('current_provider_issuer');
  const token = store.getState().token;
  const currentProvider = store
    .getState()
    .providers.find(p => p.issuer === currentProviderIssuer);

  if (currentProvider && token) {
    const { client_id, client_secret } = currentProvider;
    const { token_endpoint } = await getWellKnown(currentProvider.issuer);

    if (sessionStorage.getItem('token_status') === 'refreshing') {
      const refreshed = await waitNewToken();
      const newToken = store.getState().token;
      if (refreshed && newToken) {
        return newToken;
      }
      throw new Error('Error on waiting new token');
    }
    sessionStorage.setItem('token_status', 'refreshing');

    const BASIC_TOKEN = `Basic ${window.btoa(`${client_id}:${client_secret}`)}`;

    const response = await fetch(token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(client_secret && {
          Authorization: BASIC_TOKEN,
        }),
      },
      body: stringfyQueryString({
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token,
        ...(!client_secret && { client_id }),
      }),
    });
    if (response.ok) {
      const data = (await response.json()) as TokenResponse;
      store.setState({ token: data });
      return data;
    } else {
      throw new FetchError(response);
    }
  } else {
    throw Error('OIDC Provider not found');
  }
};

async function waitNewToken(): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    const check = () => {
      if (sessionStorage.getItem('token_status') === 'refreshed') {
        resolve(true);
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  });
}

export const login = async (args: {
  issuer?: string;
  overrideRedirectUri?: (location: Location) => string;
}) => {
  const { issuer, overrideRedirectUri } = args;
  let provider: ProviderOptions | undefined;
  const providers = store.getState().providers ?? [];
  if (issuer) {
    provider = providers.find(p => p.issuer === issuer);
  } else {
    provider = providers.find(p => p.defualt) ?? providers[0];
  }

  if (!provider) {
    throw new Error('OIDC Provider not found');
  }

  const { authorization_endpoint } = await getWellKnown(provider.issuer);

  if (provider) {
    sessionStore.set('current_provider_issuer', provider.issuer);
    const {
      client_id,
      redirect_uri,
      requested_scopes,
      access_type,
      kc_idp_hint,
    } = provider;

    const localRedirectUri = overrideRedirectUri
      ? overrideRedirectUri(location)
      : redirect_uri;

    sessionStore.set('redirect_uri', localRedirectUri);

    if (provider.pkce) {
      const new_code_verifier = generateRandomString();
      const new_state = generateRandomString();
      sessionStore.set('state', new_state);
      sessionStore.set('code_verifier', new_code_verifier);
      pkceChallengeFromVerifier(new_code_verifier).then(code_challenge => {
        window.location.replace(
          openIdInitialFlowUrl({
            authorization_endpoint,
            client_id,
            redirect_uri: localRedirectUri,
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
      sessionStore.set('state', new_state);
      sessionStore.set('code_verifier', 'NO_PKCE');
      window.location.replace(
        openIdInitialFlowUrl({
          authorization_endpoint,
          client_id,
          redirect_uri: localRedirectUri,
          requested_scopes,
          state: new_state,
          access_type,
          kc_idp_hint,
        })
      );
    }
  }
};

export const logout = async () => {
  const currentProviderIssuer = sessionStore.get('current_provider_issuer');
  const token = store.getState().token;
  const currentProvider = store
    .getState()
    .providers.find(p => p.issuer === currentProviderIssuer);
  if (currentProvider && token) {
    const { end_session_endpoint } = await getWellKnown(currentProvider.issuer);

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
    sessionStore.reset();
    window.location.href = logoutUrl;
  } else {
    throw new Error('OIDC Provider not found');
  }
};

const getToken = (): TokenResponse | undefined => {
  return store.getState().token;
};

const tokenService = {
  retriveToken,
  refreshToken,
  login,
  logout,
  getToken,
};
export default tokenService;
