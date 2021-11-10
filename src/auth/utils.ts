import { createHash, randomBytes } from 'crypto';
// PKCE HELPER FUNCTIONS

// Generate a secure random string using the browser crypto functions
export function generateRandomBytes(): Buffer {
  return randomBytes(64);
}

// Calculate the SHA256 hash of the input text.
// Returns a promise that resolves to an ArrayBuffer
export function sha256(buffer: string) {
  return createHash('sha256').update(buffer).digest();
}

export function generateCodeVerifier() {
  return base64urlencode(generateRandomBytes());
}

export function generateRandomState() {
  return base64urlencode(generateRandomBytes());
}

// Return the base64-urlencoded sha256 hash for the PKCE challenge
export function pkceChallengeFromVerifier(v: string) {
  return base64urlencode(sha256(v));
}

export function base64urlencode(str: any) {
  return str
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
