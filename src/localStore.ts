type StoreValueMap = {
  current_provider_issuer?: string;
  redirect_uri?: string;
  state?: string;
  code_verifier?: string;
};

function setLocalStore(
  key: keyof StoreValueMap,
  value: StoreValueMap[keyof StoreValueMap]
) {
  localStorage.setItem(key, value ?? '');
}
function getLocalStore(
  key: keyof StoreValueMap
): StoreValueMap[keyof StoreValueMap] | undefined {
  return localStorage.getItem(key) ?? undefined;
}
function removeLocalStore(key: keyof StoreValueMap) {
  localStorage.removeItem(key);
}
function resetSessionStore() {
  Object.keys(localStorage).forEach(key => {
    localStorage.removeItem(key);
  });
}

function postLoginReset() {
  localStorage.removeItem('state');
  localStorage.removeItem('code_verifier');
}

const localStore = {
  set: setLocalStore,
  get: getLocalStore,
  remove: removeLocalStore,
  reset: resetSessionStore,
  postLoginReset: postLoginReset,
};

export default localStore;
