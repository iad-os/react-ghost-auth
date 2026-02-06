import Cookies from 'js-cookie';

const COOKIE_PREFIX = `@${window.location.hostname}`;

type CookieOptions = {
  maxAgeSeconds?: number;
  path?: string;
  sameSite?: 'Lax' | 'Strict' | 'None';
  secure?: boolean;
};

function buildCookieName(key: string) {
  return `${COOKIE_PREFIX}_${key}`;
}

export function setCookie(key: string, value: string, options?: CookieOptions) {
  const name = buildCookieName(key);
  const path = options?.path ?? '/';
  const secure =
    options?.secure ?? window.location.protocol.toLowerCase() === 'https:';
  const sameSite =
    options?.sameSite === 'None' && !secure
      ? 'Lax'
      : options?.sameSite ?? 'Lax';
  const expiresDays =
    options?.maxAgeSeconds !== undefined
      ? options.maxAgeSeconds / 86400
      : undefined;

  Cookies.set(name, value, {
    path,
    sameSite,
    secure,
    ...(expiresDays !== undefined && { expires: expiresDays }),
  });
}

export function getCookie(key: string) {
  const name = buildCookieName(key);
  return Cookies.get(name) ?? null;
}

export function clearCookies(key: string) {
  const name = buildCookieName(key);
  Cookies.remove(name);
}

export function clearCookiesBatch(keys: string[]) {
  keys.forEach(clearCookies);
}

export function clearAllCookies() {
  const all = document.cookie ? document.cookie.split('; ') : [];
  all.forEach(entry => {
    const name = entry.split('=')[0];
    if (name.startsWith(`${COOKIE_PREFIX}_`)) {
      Cookies.remove(name);
    }
  });
}
