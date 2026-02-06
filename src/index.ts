import AuthenticationProvider, {
  useAuthentication,
  useToken,
  useUserInfo,
} from './Authentication';
import AutoLogin from './components/AutoLogin';
import Logged from './components/Logged';
import Logging from './components/Logging';
import RequireAuth from './components/RequireAuth';
import { TokenResponse, AuthenticationConfig } from './models';
import tokenService from './token';

export default AuthenticationProvider;

export { useAuthentication, useToken, useUserInfo, tokenService };
export type { AuthenticationConfig, TokenResponse };
export { AutoLogin, Logged, Logging, RequireAuth };
