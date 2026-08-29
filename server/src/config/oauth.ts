import { Issuer, BaseClient, generators } from 'openid-client';
import { env } from './env';

let oidcClient: BaseClient | null = null;

/**
 * Initialize OIDC Client
 */
export async function getOidcClient(): Promise<BaseClient | null> {
  if (oidcClient) {
    return oidcClient;
  }

  // If mock credentials or dev mode with no valid issuer, skip network discovery
  if (
    env.OAUTH_CLIENT_ID.startsWith('mock-') ||
    env.OAUTH_PROVIDER === 'dev' ||
    !env.OAUTH_ISSUER
  ) {
    return null;
  }

  try {
    const issuer = await Issuer.discover(env.OAUTH_ISSUER);
    oidcClient = new issuer.Client({
      client_id: env.OAUTH_CLIENT_ID,
      client_secret: env.OAUTH_CLIENT_SECRET,
      redirect_uris: [env.OAUTH_REDIRECT_URI],
      response_types: ['code'],
    });
    return oidcClient;
  } catch (error) {
    console.warn('⚠️ OIDC Discovery failed or external network unreachable. Operating in Sandbox/Fallback mode:', error);
    return null;
  }
}

/**
 * Generate PKCE code verifier and challenge pair
 */
export function generatePkcePair() {
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
}

/**
 * Generate state and nonce for OAuth security
 */
export function generateSecurityState() {
  return {
    state: generators.state(),
    nonce: generators.nonce(),
  };
}
