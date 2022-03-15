// Generate a secure random string using the browser crypto functions
function generateRandomBytes(): string {
  return makeid(64);
}

// Calculate the SHA256 hash of the input text.
// Returns a promise that resolves to an ArrayBuffer
async function sha256(buffer: string) {
  const msgUint8 = new TextEncoder().encode(buffer); // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
}

export function generateCodeVerifier() {
  return base64urlencode(generateRandomBytes());
}

export function generateRandomState() {
  return base64urlencode(generateRandomBytes());
}

// Return the base64-urlencoded sha256 hash for the PKCE challenge
export async function pkceChallengeFromVerifier(verify: string) {
  return base64urlencode(await sha256(verify));
}

export function base64urlencode(hexStr: string) {
  return window
    .btoa(hexStr)
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
