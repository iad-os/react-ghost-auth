import { InitFlowUrlType } from './models';
import queryString from 'query-string';

function generateRandomBytes(): string {
  return makeid(64);
}

// Calculate the SHA256 hash of the input text.
// Returns a promise that resolves to an ArrayBuffer
async function sha256(codeVerifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const buffer = await window.crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (var i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

export function generateRandomString() {
  return base64urlencode(generateRandomBytes());
}

// Return the base64-urlencoded sha256 hash for the PKCE challenge
export async function pkceChallengeFromVerifier(verify: string) {
  return base64urlencode(await sha256(verify));
}

export function base64urlencode(str: string) {
  return window
    .btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
export function base64decode(str: string) {
  return JSON.parse(window.atob(str));
}

function makeid(size: number) {
  var text = '';
  var possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < size; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

export function openIdInitialFlowUrl(init: InitFlowUrlType) {
  const {
    authorization_endpoint,
    client_id,
    redirect_uri,
    requested_scopes,
    code_challenge,
    state,
    code_challenge_method,
    access_type,
  } = init;
  return `${authorization_endpoint}?${queryString.stringify({
    response_type: 'code',
    client_id,
    state,
    scope: requested_scopes,
    redirect_uri,
    code_challenge,
    code_challenge_method,
    ...(access_type && { access_type }),
  })}`;
}
