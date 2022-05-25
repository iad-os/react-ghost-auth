export type InitFlowUrlType = {
  authorization_endpoint: string;
  client_id: string;
  redirect_uri: string;
  requested_scopes: string;
  code_challenge: string;
  state: string;
  code_challenge_method: 'S256';
  access_type?: string;
};

export type TokenResponse = {
  access_token: string;
  expires_in: number;
  id_token: string;
  'not-before-policy'?: number;
  refresh_expires_in: number;
  refresh_token: string;
  scope: string;
  session_state: string;
  token_type: string;
};

export type AuthenticationConfig = {
  default?: string;
  providers: {
    [key in string]: ProviderOptions;
  };
  serviceUrl?: string;
};

export type ProviderOptions = {
  name: string;
  authorization_endpoint: string;
  token_endpoint: string;
  client_id: string;
  requested_scopes: string;
  access_type?: string;
  redirect_uri: string;
  redirect_logout_uri?: string;
  end_session_endpoint: string;
  client_secret?: string;
};

export type EStatus = 'INIT' | 'LOGIN' | 'LOGGING' | 'LOGGED';
