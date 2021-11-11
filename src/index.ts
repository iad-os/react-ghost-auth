import AuthenticationProvider, {
  useAuthentication,
} from './auth/Authentication';
import LogginIn from './auth/components/LogginIn';
import AutoLogin from './auth/components/AutoLogin';
import LoggedIn from './auth/components/LoggedIn';
import RequireAuth from './auth/components/RequireAuth';

export default AuthenticationProvider;

export type { AuthenticationOptions } from './auth/Authentication';

export { useAuthentication };

export { LogginIn, AutoLogin, LoggedIn, RequireAuth };
