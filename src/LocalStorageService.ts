import { TokenResponse } from './models/TokenResponse';

const HOSTNAME = process.env.REACT_APP_GA_PREFIX || window.location.hostname;
const STATE = `${HOSTNAME}_state`;
const CODE_VERIFIER = `${HOSTNAME}_code_verifier`;
const PROVIDER_OIDC = `${HOSTNAME}_provider_oidc`;

let tokenInfo: TokenResponse | null = null;

export function setTokens(tokenObj: TokenResponse) {
  tokenInfo = JSON.parse(JSON.stringify(tokenObj)) as TokenResponse;
}

export function getAccessToken() {
  return tokenInfo?.access_token || null;
}

export function getRefreshToken() {
  return tokenInfo?.refresh_token || null;
}
export function getIdToken() {
  return tokenInfo?.id_token || null;
}

export function clearToken() {
  tokenInfo = null;
  localStorage.removeItem(PROVIDER_OIDC);
}

export function clear() {
  tokenInfo = null;
  localStorage.removeItem(PROVIDER_OIDC);
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
