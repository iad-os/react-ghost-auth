import { WellKnown } from './models';

export async function getWellKnown(issuer: string): Promise<WellKnown> {
  const wellKnownUrl = `${issuer}/.well-known/openid-configuration`;
  const response = await fetch(wellKnownUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch well-known: ${wellKnownUrl}`);
  }
  const data = await response.text();
  return JSON.parse(data) as WellKnown;
}
