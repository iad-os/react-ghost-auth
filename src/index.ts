import AuthenticationProvider, {
  useAuthentication,
} from './auth/Authentication';

export default AuthenticationProvider;

export type { AuthenticationOptions } from './auth/Authentication';
export { useAuthentication };
