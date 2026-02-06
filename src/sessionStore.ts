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
  Object.keys(sessionStorage).forEach(key => {
    sessionStorage.removeItem(key);
  });
}

function postLoginReset() {
  sessionStorage.removeItem('state');
  sessionStorage.removeItem('code_verifier');
}

const sessionStore = {
  set: setSessionStore,
  get: getSessionStore,
  remove: removeSessionStore,
  reset: resetSessionStore,
  postLoginReset: postLoginReset,
};

export default sessionStore;
