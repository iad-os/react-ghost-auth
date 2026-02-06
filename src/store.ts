import { useSyncExternalStore } from 'react';
import { ProviderOptions, TokenResponse } from './models';

type StoreValueMap = {
  providers: ProviderOptions[];
  token?: TokenResponse;
};

type StoreListener = () => void;

let state: StoreValueMap = {
  providers: [],
  token: undefined,
};

const listeners = new Set<StoreListener>();

function notifyListeners() {
  listeners.forEach(listener => listener());
}

function getState(): StoreValueMap {
  return { ...state };
}

function setState(partial: Partial<StoreValueMap>) {
  state = { ...state, ...partial };
  notifyListeners();
}

function subscribe(listener: StoreListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function snapshot(): StoreValueMap {
  return getState();
}

function useStore<T>(selector: (state: StoreValueMap) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getState())
  );
}

const store = {
  getState,
  setState,
  subscribe,
  snapshot,
};

export { useStore };
export default store;
