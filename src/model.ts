import {
  OpenIDTokenEndpointResponse,
  TokenEndpointResponse,
  UserInfoResponse,
} from 'oauth4webapi';

export type UserInfo = UserInfoResponse;

export type OpenIDToken = OpenIDTokenEndpointResponse;

export type AuthenticationConfig = {
  default?: string;
  issuers: {
    [key in string]: ProviderOptions;
  };
  serviceUrl?: string;
};

export type ProviderOptions = {
  client_id: string;
  requested_scopes: string;
  access_type?: string;
  redirect_uri: string;
  redirect_logout_uri?: string;
  end_session_endpoint: string;
  client_secret?: string;
  pkce?: boolean;
};

export type EStatus = 'INIT' | 'LOGIN' | 'LOGGING' | 'LOGGED';
