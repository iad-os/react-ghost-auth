import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { ProviderOptions, TokenResponse } from './models';

type StoreValueMap = {
  providers: ProviderOptions[];
  token?: TokenResponse;
};

const store = createStore<StoreValueMap>(() => ({
  providers: [],
  token: undefined,
}));

const useZStore = (selector: (state: StoreValueMap) => any) =>
  useStore(store, selector);

export { useZStore as useStore };

export default store;
