import AuthenticationProvider, {
  useAuthentication,
  useToken,
  useUserInfo,
} from './Authentication';
import AutoLogin from './components/AutoLogin';
import LoggedIn from './components/LoggedIn';
import LogginIn from './components/LogginIn';
import Public from './components/Public';
import RequireAuth from './components/RequireAuth';
import { UserInfo, OpenIDToken, AuthenticationConfig } from './model';
import { getLoggedIn } from './AuthStoreService';

export default AuthenticationProvider;

export { useAuthentication, useToken, useUserInfo };
export type { UserInfo, OpenIDToken, AuthenticationConfig };
export { AutoLogin, LoggedIn, LogginIn, Public, RequireAuth };
export { getLoggedIn };
