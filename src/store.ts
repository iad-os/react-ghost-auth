import { clearCookies, getCookie, setCookie } from './cookie.utils';
import { ProviderOptions, TokenResponse } from './models';

type StoreKey =
  | 'providers'
  | 'current_provider'
  | 'token'
  | 'redirect_uri'
  | 'state'
  | 'code_verifier';

type StoreValueMap = {
  providers: ProviderOptions[];
  current_provider?: ProviderOptions;
  token?: TokenResponse;
  redirect_uri?: string;
  state?: string;
  code_verifier?: string;
};

const COOKIE_KEYS = new Set<StoreKey>(['token']);

type StoreListener = () => void;
const storeListeners = new Set<StoreListener>();

function getSnapshot(): StoreValueMap {
  return {
    providers: get('providers') ?? [],
    current_provider: get('current_provider'),
    token: get('token'),
    redirect_uri: get('redirect_uri'),
    state: get('state'),
    code_verifier: get('code_verifier'),
  };
}

function notifyListeners() {
  storeListeners.forEach(listener => listener());
}

function isCookieKey(key: StoreKey) {
  return COOKIE_KEYS.has(key);
}

function parseValue<K extends StoreKey>(
  key: K,
  raw: string | null
): StoreValueMap[K] | undefined {
  if (!raw) return undefined;
  if (key === 'redirect_uri' || key === 'state' || key === 'code_verifier') {
    return raw as StoreValueMap[K];
  }
  try {
    return JSON.parse(raw) as StoreValueMap[K];
  } catch {
    return undefined;
  }
}

function set<K extends StoreKey>(key: K, value: StoreValueMap[K]) {
  if (value === undefined) {
    remove(key);
    return;
  }
  if (isCookieKey(key)) {
    if (key === 'token') {
      const token = value as TokenResponse;
      setCookie(key, JSON.stringify(token), {
        maxAgeSeconds: token.refresh_expires_in,
        sameSite: 'Strict',
      });
    } else {
      setCookie(key, JSON.stringify(value));
    }
  } else {
    sessionStorage.setItem(key, JSON.stringify(value));
  }
  notifyListeners();
}

function get<K extends StoreKey>(key: K): StoreValueMap[K] | undefined {
  const raw = isCookieKey(key) ? getCookie(key) : sessionStorage.getItem(key);
  return parseValue(key, raw);
}

function remove(key: StoreKey) {
  if (isCookieKey(key)) {
    clearCookies(key);
  } else {
    sessionStorage.removeItem(key);
  }
  notifyListeners();
}

function subscribe(listener: StoreListener) {
  storeListeners.add(listener);
  return () => storeListeners.delete(listener);
}

const store = { set, get, remove, subscribe, snapshot: getSnapshot };

export default store;
