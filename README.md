# React Ghost Auth

React library for **authentication and authorization** based on **OpenID Connect (OIDC)**. It supports multiple providers (Google, Keycloak, Microsoft, etc.), **Authorization Code** flow with **PKCE**, in-memory token storage, and automatic token refresh.

---

## Installation

```bash
npm install @iad-os/react-ghost-auth react
```

**Peer dependency:** `react` >= 16.14.0

---

## Configuration

### OIDC Provider

Each provider is a `ProviderOptions` object:

| Field | Type | Description |
|-------|------|-------------|
| `issuer` | `string` | OIDC issuer URL (e.g. `https://auth.example.com/realms/my-realm`) |
| `name` | `string` | Provider name (e.g. "Keycloak") |
| `client_id` | `string` | Application client ID |
| `client_secret` | `string` | *(optional)* Client secret (for confidential clients) |
| `redirect_uri` | `string` | Redirect URI after login |
| `redirect_logout_uri` | `string` | Redirect URI after logout |
| `requested_scopes` | `string` | Requested scopes (e.g. `openid profile email`) |
| `pkce` | `boolean` | *(optional)* Use PKCE (recommended for SPAs) |
| `defualt` | `boolean` | *(optional)* Default provider when `issuer` is not passed |
| `access_type` | `string` | *(optional)* e.g. `offline` for refresh token |
| `kc_idp_hint` | `string` | *(optional)* Keycloak identity provider hint |

### App config

```ts
import type { AuthenticationConfig } from '@iad-os/react-ghost-auth';

const config: AuthenticationConfig = {
  providers: [
    {
      issuer: 'https://keycloak.example.com/realms/my-realm',
      name: 'Keycloak',
      client_id: 'my-app',
      redirect_uri: 'https://my-app.example.com/callback',
      redirect_logout_uri: 'https://my-app.example.com',
      requested_scopes: 'openid profile email',
      pkce: true,
      defualt: true,
    },
  ],
};
```

---

## Usage

### 1. `AuthenticationProvider`

Wrap your app (or the part that uses auth) with the provider and pass the config and callbacks.

```tsx
import AuthenticationProvider from '@iad-os/react-ghost-auth';

function App() {
  const config = { providers: [/* ... */] };

  return (
    <AuthenticationProvider
      config={config}
      onRoute={(route, overrided) => {
        // Called after login/logout with the URL to use (e.g. for the router)
        window.history.replaceState({}, '', route);
      }}
      onError={(message) => console.error(message)}
      refreshTokenBeforeExp={60}
      overrideRedirectUri={(loc) => `${loc.origin}${loc.pathname}`}
      enableLog={process.env.NODE_ENV === 'development'}
    >
      <YourApp />
    </AuthenticationProvider>
  );
}
```

**`AuthenticationProvider` props:**

| Prop | Type | Default | Description |
|------|------|--------|-------------|
| `config` | `AuthenticationConfig` | **required** | Config with the list of providers |
| `children` | `ReactNode` | **required** | App content |
| `onRoute` | `(route, overrided) => void` | **required** | Callback with the route to use after login/logout |
| `onError` | `(message: string) => void` | optional | Callback for errors (e.g. from provider) |
| `refreshTokenBeforeExp` | `number` | `0` | Seconds before token expiry to trigger automatic refresh (0 = disabled) |
| `overrideRedirectUri` | `(location) => string` | optional | Override for `redirect_uri` (e.g. for hash-based SPA) |
| `enableLog` | `boolean` | `false` | Enable debug logging in console |

---

### 2. Components

#### `RequireAuth`

Renders children only when the user is authenticated; otherwise renders `loggedOut`. Optionally triggers autologin.

```tsx
import { RequireAuth } from '@iad-os/react-ghost-auth';

<RequireAuth
  loggedOut={<div>Please log in</div>}
  autologin={true}
>
  <Dashboard />
</RequireAuth>
```

| Prop | Type | Default | Description |
|------|------|--------|-------------|
| `children` | `ReactNode` | **required** | Content when logged in |
| `loggedOut` | `ReactNode` | optional | Content when not logged in |
| `autologin` | `boolean` | `false` | If `true`, in LOGGED-OUT state calls `autologin()` (starts login flow) |

---

#### `Logged`

Renders one content when logged in and another when not (no redirect, UI only).

```tsx
import { Logged } from '@iad-os/react-ghost-auth';

<Logged
  in={<p>Welcome</p>}
  out={<p>Not authenticated</p>}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `in` | `ReactNode` | Content when logged in |
| `out` | `ReactNode` | optional – Content when not logged in |

---

#### `Logging`

Renders content only during the “logging” phase (return from provider with `code`, token exchange in progress).

```tsx
import { Logging } from '@iad-os/react-ghost-auth';

<Logging in={<Spinner />} />
```

| Prop | Type | Description |
|------|------|-------------|
| `in` | `ReactNode` | Content shown during token exchange |

---

#### `AutoLogin`

When in LOGGED-OUT state and a “current” provider exists (e.g. from a previous session), calls `login(issuer)`; when status is LOGIN, can render `children` (e.g. “Redirecting to login…” screen).

```tsx
import { AutoLogin } from '@iad-os/react-ghost-auth';

<AutoLogin>
  <p>Redirecting to login...</p>
</AutoLogin>
```

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | optional – Content shown when in LOGIN phase (e.g. redirect message) |

---

### 3. Hooks

#### `useAuthentication()`

Exposes auth state and actions.

```tsx
import { useAuthentication } from '@iad-os/react-ghost-auth';

function MyComponent() {
  const {
    login,           // (issuer?: string) => Promise<void>
    logout,          // () => Promise<void>
    autologin,       // () => void – sets status to LOGIN
    isAuthenticated, // () => boolean
    status,          // 'INIT' | 'LOGIN' | 'LOGGING' | 'LOGGED-IN' | 'LOGGED-OUT' | 'LOGOUT'
    refreshToken,    // () => Promise<TokenResponse>
    token,           // TokenResponse | undefined
    getCurrentProvider, // () => ProviderOptions | undefined
    providers,       // ProviderOptions[]
  } = useAuthentication();

  return (
    <div>
      {status === 'LOGGED-IN' ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <button onClick={() => login()}>Login</button>
      )}
    </div>
  );
}
```

---

#### `useToken()`

Returns `token` and `refreshToken` only when the user is authenticated; otherwise **throws**.

```tsx
import { useToken } from '@iad-os/react-ghost-auth';

function ProtectedApi() {
  const { token, refreshToken } = useToken();
  // token: TokenResponse, refreshToken: () => Promise<TokenResponse>
  return <div>Access token: {token.access_token.slice(0, 20)}…</div>;
}
```

Use it **only** inside a protected tree (e.g. under `RequireAuth` or after checking `isAuthenticated()`).

---

#### `useUserInfo<T>()`

Decodes the `id_token` (JWT) payload and returns it typed. Throws if not authenticated or no `id_token`.

```tsx
import { useUserInfo } from '@iad-os/react-ghost-auth';

type MyClaims = { sub: string; email?: string; name?: string };

function Profile() {
  const user = useUserInfo<MyClaims>();
  return <div>{user.name ?? user.sub}</div>;
}
```

---

### 4. `tokenService`

Use when you need to handle login/logout/refresh outside React components (e.g. from services or after mount):

```ts
import { tokenService } from '@iad-os/react-ghost-auth';

// Login (redirects to provider)
await tokenService.login({ issuer: 'https://...' });
await tokenService.login(); // uses default provider

// Logout (redirects to provider end session)
await tokenService.logout();

// Refresh token
const newToken = await tokenService.refreshToken();

// Current token (from store)
const token = tokenService.getToken();
```

- `login({ issuer?, overrideRedirectUri? })` – starts the OIDC flow.
- `logout()` – clears state and redirects to provider logout.
- `refreshToken()` – refreshes the token using the refresh token.
- `getToken()` – returns the current `TokenResponse` or `undefined`.

The `code`-to-token exchange (after redirect) is handled internally by `AuthenticationProvider` via `tokenService.retriveToken`; you typically do not need to call it yourself.

---

## Exported types

- **`AuthenticationConfig`** – `{ providers: ProviderOptions[] }`
- **`TokenResponse`** – access_token, refresh_token, id_token, expires_in, etc.
- **`ProviderOptions`** – see table above.

---

## Flow overview

1. User clicks “Login” → `login()` (or `tokenService.login()`) is called.
2. The app stores in session `state`, `code_verifier`, `redirect_uri`, `current_provider_issuer` and redirects to the provider’s authorization endpoint.
3. User authenticates at the provider and is redirected back to your `redirect_uri` with `?code=...&state=...`.
4. `AuthenticationProvider` detects `code` and `state`, calls `tokenService.retriveToken({ code, code_verifier })`, stores the token in the store, and calls `onRoute`.
5. If `refreshTokenBeforeExp > 0`, an automatic refresh is scheduled before token expiry after login.
6. To sign out: `logout()` clears state and redirects to the provider’s end session.

---

## Build

```bash
npm run build
```

Output in `dist/` (CommonJS and ESM).
