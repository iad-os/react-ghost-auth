import { ProviderOptions } from './models';

export function setProviders(providers: ProviderOptions[]) {
  sessionStorage.setItem('providers', JSON.stringify(providers));
}

export function getProviders() {
  return JSON.parse(
    sessionStorage.getItem('providers') ?? '[]'
  ) as ProviderOptions[];
}

export function setCurrentProvider(provider?: ProviderOptions) {
  sessionStorage.setItem('current_provider', JSON.stringify(provider));
}

export function getCurrentProvider() {
  const currentProvider = sessionStorage.getItem('current_provider');
  if (currentProvider) {
    return JSON.parse(currentProvider) as ProviderOptions | undefined;
  }
  return undefined;
}

export function clearProviderStore() {
  sessionStorage.removeItem('providers');
  sessionStorage.removeItem('current_provider');
}
