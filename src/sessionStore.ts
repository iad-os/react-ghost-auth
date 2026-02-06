type StoreValueMap = {
  current_provider_issuer?: string;
  redirect_uri?: string;
  state?: string;
  code_verifier?: string;
};

function setSessionStore(
  key: keyof StoreValueMap,
  value: StoreValueMap[keyof StoreValueMap]
) {
  sessionStorage.setItem(key, value ?? '');
}
function getSessionStore(
  key: keyof StoreValueMap
): StoreValueMap[keyof StoreValueMap] | undefined {
  return sessionStorage.getItem(key) ?? undefined;
}
function removeSessionStore(key: keyof StoreValueMap) {
  sessionStorage.removeItem(key);
}
function resetSessionStore() {
  sessionStorage.clear();
}

const sessionStore = {
  set: setSessionStore,
  get: getSessionStore,
  remove: removeSessionStore,
  reset: resetSessionStore,
};

export default sessionStore;
