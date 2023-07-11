# React Ghost Auth

React Ghost Auth is an easy to use multi-provider authentication and authorisation library.
The library uses the OpenID Connect Flow.
You simply set your configurations options for all providers to be used, and use them. It's that simple.

## Author

👤 **Nicola Vurchio**
Github: [@nicolavurchio-iad2](https://github.com/nicolavurchio-iad2)

## Installation

```bash
npm i @iad-os/react-ghost-auth
```

## Playground

See how the library is used here
Github: [Ghost Auth Playground](https://github.com/iad-os/ghost-oauth2-playground)

## Usage

##### 1. Create an authConfig file and setup each provider's configuration options.

You can get the provider options from your chosen provider i.e Google, Keycloak, Microsoft etc.
NOTE: AuthenticationConfig is solely for type checking

```typescript
import { AuthenticationConfig } from '@iad-os/react-ghost-auth';

export const authConfig: AuthenticationConfig = {
  providers: {
    //Options example
    google: {
      name: 'google',
      authorization_endpoint: 'https://accounts.google.com/o/oauth2/auth',
      token_endpoint: 'https://oauth2.googleapis.com/token',
      client_id: 'xxxxxxxxxxxxxx.apps.googleusercontent.com',
      requested_scopes: 'profile email openid',
      redirect_uri: 'http://localhost:3000/redirect',
      end_session_endpoint: '',
      redirect_logout_uri: 'http://localhost:3000',
      access_type: 'offline',
      client_secret: 'xxxxxxxxxxxxxxxxxx',
    },

    keycloak: {
      //Put options here
    },

    microsoft: {
      //Put options here
    },
  },
};
```

&nbsp;

##### 2. Import the AuthenticationProvider and wrap your App Component

&nbsp;

```typescript
import AuthenticationProvider from '@iad-os/react-ghost-auth';

<AuthenticationProvider
  config={authConfig}
  axios={axios}
  onRoute={handleRoute}>

    </App> // Your app

</AuthenticationProvider>
```

&nbsp;

##### 3. Setup login on the UI by importing the useAuthentication hook

This exposes api's that can be found below i.e Public Api's

```typescript
import { useAuthentication } from '@iad-os/react-ghost-auth';

const Login: React.FC = () => {
  const { login } = useAuthentication();

  function handleGoogle() {
    login("google");
  }

  function handleKeyCloak() {
    login("keycloak");
  }

  return (
      <Button onClick={handleGoogle}>
        Login with Google
      </Button>

      <Button onClick={handleKeyCloak}>
        Login with Keycloak
      </Button>
  );
};
```

&nbsp;

## Public APIs

The public api's below are returned from the **useAuthentication** hook
| API | Purpose |
| ------ | ------ |
| login(providerName: string) | A function that initaites the login flow by redirecting the user to the chosen provider |
| logout() | A function that clears the userInfo and tokenInfo and logs the user out of the app |
| userInfo() | A function that returns the user information provided by the chosen provider |
| tokenInfo() | A function that returns the access and refresh tokens|
| isAuthenticated() | A method that returns true if user is authenticated and false otherwise |
| status: EStatus | A variable that returns the login state which can be 'INIT', 'LOGIN', 'LOGGING' or 'LOGGED' |
| changeStatus(status: EStatus) | A function that sets the login state i.e status|
|providerInfo() | A function that returns the selected provider and default provider if one is provided|

## Components

The components below can be used as wrappers to trigger preffered behaviour
| Component | Purpose |
| ------ | ------ |
| RequireAuth | A wrapper component that requires user to be authenticated before it's content is exposed|
| Public | A wrapper component that exposes it's content, it doesn't require user to be logged in|
| LogginIn | A wrapper component that exposes its content **while** the log in process is running|
| LoggedIn | A wrapper component that exposes its content after the log in process is successful|
| AutoLogin | A wrapper or standalone component that initiates the login process automatically on page/site reload|
