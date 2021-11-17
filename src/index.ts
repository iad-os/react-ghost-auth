import AuthenticationProvider from './Authentication';
import { useAuthentication, AuthenticationConfig } from './Authentication';
import Autologin from './components/AutoLogin';
import LoggedIn from './components/LoggedIn';
import LogginIn from './components/LogginIn';
import Public from './components/Public';
import RequireAuth from './components/RequireAuth';
import { TokenResponse } from './models/TokenResponse';
export default AuthenticationProvider;

export { useAuthentication };
export type { AuthenticationConfig, TokenResponse };

export { Autologin, LoggedIn, LogginIn, Public, RequireAuth };
