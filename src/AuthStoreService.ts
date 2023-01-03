import { TokenResponse } from './models';

const HOSTNAME = process.env.REACT_APP_GA_PREFIX || window.location.hostname;
const STATE = `${HOSTNAME}_state`;
const CODE_VERIFIER = `${HOSTNAME}_code_verifier`;
const PROVIDER_OIDC = `${HOSTNAME}_provider_oidc`;
const ACCESS_TOKEN = `${HOSTNAME}_access_token`;
const REDIRECT_URI = `${HOSTNAME}_reditect_uri`;
const LOGGED_IN = `${HOSTNAME}_logged_id`;

export function setTokens(tokenObj: TokenResponse, lsToken: boolean) {
  tokenInfo.setData(JSON.parse(JSON.stringify(tokenObj)) as TokenResponse);
  if (lsToken) {
    localStorage.setItem(ACCESS_TOKEN, tokenObj.access_token);
  }
}

export function getAccessToken() {
  return tokenInfo.getData()?.access_token || null;
}

export function getRefreshToken() {
  return tokenInfo.getData()?.refresh_token || null;
}
export function getIdToken() {
  return tokenInfo.getData()?.id_token || null;
}

export function clearToken() {
  tokenInfo.setData(null);
  localStorage.removeItem(PROVIDER_OIDC);
}
export function clearCodeVerifierAndSate() {
  localStorage.removeItem(STATE);
  localStorage.removeItem(CODE_VERIFIER);
}
export function cleanAfterRedirect() {
  clearCodeVerifierAndSate();
  localStorage.removeItem(REDIRECT_URI);
}
export function cleanAll() {
  clearToken();
  cleanAfterRedirect();
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(LOGGED_IN);
}

export function getState() {
  return localStorage.getItem(STATE);
}

export function getCodeVerifier() {
  return localStorage.getItem(CODE_VERIFIER);
}
export function getRedirectUri() {
  return localStorage.getItem(REDIRECT_URI);
}
export function getLoggedIn() {
  return localStorage.getItem(LOGGED_IN);
}

export function setLoggedIn(value: string) {
  return localStorage.setItem(LOGGED_IN, value);
}
export function setRedirectUri(value: string) {
  return localStorage.setItem(REDIRECT_URI, value);
}
export function setState(value: string) {
  return localStorage.setItem(STATE, value);
}

export function setCodeVerifier(value: string) {
  return localStorage.setItem(CODE_VERIFIER, value);
}

export function setProviderOidc(value: string) {
  return localStorage.setItem(PROVIDER_OIDC, value);
}

export function getProviderOidc() {
  return localStorage.getItem(PROVIDER_OIDC);
}

const tokenInfo = (function () {
  let data: TokenResponse | null = null;

  const getData = function () {
    return data;
  };
  const setData = function (input: TokenResponse | null) {
    data = input;
  };

  return {
    getData,
    setData,
  };
})();
