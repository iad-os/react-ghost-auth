import AuthenticationProvider, {
  useAuthentication,
} from './auth/Authentication';
import LogginIn from './auth/components/LogginIn';
import AutoLogin from './auth/components/AutoLogin';
import LoggedIn from './auth/components/LoggedIn';
import Public from './auth/components/Public';
import RequireAuth from './auth/components/RequireAuth';

export default AuthenticationProvider;

export type { AuthenticationConfig } from './auth/Authentication';

export { useAuthentication };

export { LogginIn, AutoLogin, LoggedIn, RequireAuth, Public };
