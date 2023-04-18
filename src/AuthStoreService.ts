const HOSTNAME = process.env.REACT_APP_GA_PREFIX || window.location.hostname;
const STATE = `${HOSTNAME}_state`;
const CODE_VERIFIER = `${HOSTNAME}_code_verifier`;
const ISSUER = `${HOSTNAME}_issuer`;
const ACCESS_TOKEN = `${HOSTNAME}_access_token`;
const REDIRECT_URI = `${HOSTNAME}_reditect_uri`;
const LOGGED_IN = `${HOSTNAME}_logged_id`;

export function clearCodeVerifierAndSate() {
  localStorage.removeItem(STATE);
  localStorage.removeItem(CODE_VERIFIER);
}
export function cleanAfterRedirect() {
  clearCodeVerifierAndSate();
  localStorage.removeItem(REDIRECT_URI);
}
export function cleanAll() {
  cleanAfterRedirect();
  localStorage.removeItem(LOGGED_IN);
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
export function setCodeVerifier(value: string) {
  return localStorage.setItem(CODE_VERIFIER, value);
}

export function getIssuer() {
  return localStorage.getItem(ISSUER);
}
export function setIssuer(value: string) {
  return localStorage.setItem(ISSUER, value);
}
