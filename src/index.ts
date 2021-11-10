import AuthenticationProvider, {
  useAuthentication,
} from './auth/Authentication';
import Anonymous from './auth/components/Anonymous';
import AutoLogin from './auth/components/AutoLogin';
import LoggedIn from './auth/components/LoggedIn';

export default AuthenticationProvider;

export type { AuthenticationOptions } from './auth/Authentication';

export { useAuthentication };

export { Anonymous, AutoLogin, LoggedIn };
