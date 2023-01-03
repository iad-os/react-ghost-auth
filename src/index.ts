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
import { TokenResponse, AuthenticationConfig } from './models';
import ReactGhostAuthProvider from './ReactGhostAuthProvider';
export default ReactGhostAuthProvider;

export { useAuthentication, useToken, useUserInfo };
export type { AuthenticationConfig, TokenResponse };
export { AutoLogin, LoggedIn, LogginIn, Public, RequireAuth };
