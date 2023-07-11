
const HOSTNAME = `@${window.location.hostname}`;

const LS = {
  state: `${HOSTNAME}_state`,
  code_verifier: `${HOSTNAME}_code_verifier`,
  provider_oidc: `${HOSTNAME}_provider_oidc`,
  access_token: `${HOSTNAME}_access_token`,
  redirect_uri: `${HOSTNAME}_reditect_uri`,
  logged_in: `${HOSTNAME}_logged_id`,
};

type LSType = typeof LS;

const useLocalstorage = () => {
  const save = <T extends keyof LSType>(key: T, value: string) => {
    localStorage.setItem(key, value);
  };

  const load = <T extends keyof LSType>(key: T) => {
    return localStorage.getItem(key);
  };

  const clear = <T extends keyof LSType>(keys?: T[]) => {
    if (keys) {
      keys.forEach(key => localStorage.removeItem(key));
    } else {
      localStorage.clear();
    }
  };

  return { save, load, clear };
};

export default useLocalstorage;
