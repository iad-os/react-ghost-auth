import { useSyncExternalStore } from 'react';
import { ProviderOptions, TokenResponse } from './models';

type StoreValueMap = {
  providers: ProviderOptions[];
  token?: TokenResponse;
  refreshTokenBeforeExp: number;
};

type StoreListener = () => void;

let state: StoreValueMap = {
  providers: [],
  token: undefined,
  refreshTokenBeforeExp: 0, // 0 means disabled
};

const listeners = new Set<StoreListener>();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const getState = (): StoreValueMap => {
  return { ...state };
};

const setState = (partial: Partial<StoreValueMap>) => {
  state = { ...state, ...partial };
  notifyListeners();
};

const subscribe = (listener: StoreListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const useStore = <T>(selector: (state: StoreValueMap) => T): T => {
  return useSyncExternalStore(subscribe, () => selector(getState()));
};

const store = {
  getState,
  setState,
};

export { useStore };
export default store;
