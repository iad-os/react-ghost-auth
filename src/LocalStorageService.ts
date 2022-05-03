import { TokenResponse } from './models/TokenResponse';

const HOSTNAME = process.env.REACT_APP_GA_PREFIX || window.location.hostname;
const ACCESS_TOKEN = `${HOSTNAME}_access_token`;
const REFRESH_TOKEN = `${HOSTNAME}_refresh_token`;
const ID_TOKEN = `${HOSTNAME}_id_token`;
const STATE = `${HOSTNAME}_state`;
const CODE_VERIFIER = `${HOSTNAME}_code_verifier`;
const PROVIDER_OIDC = `${HOSTNAME}_provider_oidc`;
export function setTokens(tokenObj: TokenResponse) {
  localStorage.setItem(ACCESS_TOKEN, tokenObj.access_token);
  localStorage.setItem(REFRESH_TOKEN, tokenObj.refresh_token);
  localStorage.setItem(ID_TOKEN, tokenObj.id_token);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN);
}
export function getIdToken() {
  return localStorage.getItem(ID_TOKEN);
}

export function clearToken() {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
  localStorage.removeItem(ID_TOKEN);
  localStorage.removeItem(PROVIDER_OIDC);
}

export function clear() {
  localStorage.removeItem(PROVIDER_OIDC);
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
  localStorage.removeItem(ID_TOKEN);
  localStorage.removeItem(STATE);
  localStorage.removeItem(CODE_VERIFIER);
}

export function getState() {
  return localStorage.getItem(STATE);
}

export function getCodeVerifier() {
  return localStorage.getItem(CODE_VERIFIER);
}

export function setState(value: string) {
  return localStorage.setItem(STATE, value);
}

export function setCodeVerifier(value: string) {
  return localStorage.setItem(CODE_VERIFIER, value);
}

export function clearCodeVerifierAndSate() {
  localStorage.removeItem(STATE);
  localStorage.removeItem(CODE_VERIFIER);
}

export function setProviderOidc(value: string) {
  return localStorage.setItem(PROVIDER_OIDC, value);
}

export function getProviderOidc() {
  return localStorage.getItem(PROVIDER_OIDC);
}

const SessionData = (function () {
  let data: Record<string, any> = {};

  const getItem = function (key: string) {
    return data[key];
  };

  const setItem = function (key: string, value: any) {
    data[key] = value;
  };

  const removeItem = function (key: string) {
    delete data[key];
  };

  const clear = function () {
    data = {};
  };

  return {
    getItem,
    setItem,
    removeItem,
    clear,
  };
})();
