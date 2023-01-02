import { AxiosRequestConfig, AxiosStatic, RawAxiosRequestHeaders } from 'axios';
import { AuthorizationProps } from './Authentication';
import { getAccessToken } from './AuthStoreService';
import { TokenResponse } from './models';

export function interceptor(
  axios: AxiosStatic,
  serviceUrl: string,
  refreshToken: () => Promise<TokenResponse>,
  needAuthorization: AuthorizationProps['needAuthorization'] = (
    serviceUrl,
    requestUrl
  ) => serviceUrl === '/' || matchHostname(serviceUrl, requestUrl)
) {
  axios.interceptors.request.use(
    config => {
      const token = getAccessToken();
      if (token && needAuthorization(serviceUrl, config.url || '')) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        } as RawAxiosRequestHeaders;
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
      const originalRequest: AxiosRequestConfig & { _retry: boolean } =
        error.config;
      if (error?.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        return refreshToken()
          .then(res => {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${res.access_token}`,
            } as RawAxiosRequestHeaders;
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
