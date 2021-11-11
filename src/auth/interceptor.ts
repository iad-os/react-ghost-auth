import axios, { AxiosStatic } from 'axios';
import { getAccessToken } from './LocalStorageService';
import { TokenResponse } from './models/TokenResponse';
export function interceptor(
  axios: AxiosStatic,
  serviceUrl: string,
  refreshToken: () => Promise<TokenResponse>
) {
  axios.interceptors.request.use(
    config => {
      const token = getAccessToken();
      if (
        config &&
        config.headers &&
        token &&
        matchHostname(serviceUrl || '', config.url || '')
      ) {
        config.headers['Authorization'] = `Bearer ${token}`;
        config.headers = {
          ...config.headers,
        };
      }
      return config;
    },
    error => {
      Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    response => {
      return response;
    },
    error => {
      const originalRequest = error.config;
      if (
        (error?.response?.status === 401 || error?.response?.status === 403) &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;
        return refreshToken()
          .then(res => {
            axios.defaults.headers.common[
              'Authorization'
            ] = `Bearer ${res.access_token}`;
            return axios(originalRequest);
          })
          .catch(error => Promise.reject(error));
      }
      return Promise.reject(error);
    }
  );
}

function matchHostname(u1: string, u2: string) {
  if (u1 && u2) {
    const h1 = new URL(u1).hostname;
    const h2 = new URL(u2).hostname;
    return h1 === h2;
  }
  return false;
}
