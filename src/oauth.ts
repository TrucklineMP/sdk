import { createHash, randomBytes } from "node:crypto";
import { TrucklineError } from "./errors.js";
import type { OAuthScope, OAuthTokenResponse, OAuthUserinfo } from "./models.js";
import { DEFAULT_SITE_URL } from "./types.js";
import { SDK_VERSION } from "./version.js";

export type TrucklineOAuthOptions = {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  siteUrl?: string;
  authorizePath?: string;
  tokenPath?: string;
  revokePath?: string;
  userinfoPath?: string;
  fetch?: typeof fetch;
  userAgent?: string;
};

export type AuthorizeUrlParams = {
  scope?: OAuthScope[] | string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: "S256";
  responseType?: "code";
};

export type PkcePair = {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
};

function normalizeSiteUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function scopesToString(scope?: OAuthScope[] | string): string {
  if (!scope) return "profile";
  if (typeof scope === "string") return scope;
  return scope.join(" ");
}

export function generatePkce(): PkcePair {
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: "S256",
  };
}

export class TrucklineOAuth {
  readonly clientId: string;
  readonly redirectUri: string;
  private readonly clientSecret?: string;
  private readonly siteUrl: string;
  private readonly authorizePath: string;
  private readonly tokenPath: string;
  private readonly revokePath: string;
  private readonly userinfoPath: string;
  private readonly fetchImpl: typeof fetch;
  private readonly userAgent: string;

  constructor(options: TrucklineOAuthOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.redirectUri = options.redirectUri;
    this.siteUrl = normalizeSiteUrl(options.siteUrl ?? DEFAULT_SITE_URL);
    this.authorizePath = options.authorizePath ?? "/oauth/authorize";
    this.tokenPath = options.tokenPath ?? "/api/oauth/token";
    this.revokePath = options.revokePath ?? "/api/oauth/revoke";
    this.userinfoPath = options.userinfoPath ?? "/api/oauth/userinfo";
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.userAgent = options.userAgent ?? `trucklinemp-sdk/${SDK_VERSION}`;
  }

  getAuthorizeUrl(params: AuthorizeUrlParams = {}): string {
    const url = new URL(`${this.siteUrl}${this.authorizePath}`);
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("response_type", params.responseType ?? "code");
    url.searchParams.set("redirect_uri", this.redirectUri);
    url.searchParams.set("scope", scopesToString(params.scope));
    if (params.state) url.searchParams.set("state", params.state);
    if (params.codeChallenge) {
      url.searchParams.set("code_challenge", params.codeChallenge);
      url.searchParams.set(
        "code_challenge_method",
        params.codeChallengeMethod ?? "S256",
      );
    }
    return url.toString();
  }

  async exchangeCode(
    code: string,
    options?: { codeVerifier?: string },
  ): Promise<OAuthTokenResponse> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: this.clientId,
      code,
      redirect_uri: this.redirectUri,
    });
    if (this.clientSecret) body.set("client_secret", this.clientSecret);
    if (options?.codeVerifier) body.set("code_verifier", options.codeVerifier);
    return this.tokenRequest(body);
  }

  async refresh(refreshToken: string): Promise<OAuthTokenResponse> {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: this.clientId,
      refresh_token: refreshToken,
    });
    if (this.clientSecret) body.set("client_secret", this.clientSecret);
    return this.tokenRequest(body);
  }

  async revoke(token: string, tokenTypeHint?: "access_token" | "refresh_token") {
    const body = new URLSearchParams({
      token,
      client_id: this.clientId,
    });
    if (this.clientSecret) body.set("client_secret", this.clientSecret);
    if (tokenTypeHint) body.set("token_type_hint", tokenTypeHint);

    const res = await this.fetchImpl(`${this.siteUrl}${this.revokePath}`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json",
        "user-agent": this.userAgent,
      },
      body,
    });
    if (!res.ok && res.status !== 200) {
      const text = await res.text();
      throw new TrucklineError({
        message: text || `Revoke failed with status ${res.status}`,
        status: res.status,
        code: "OAUTH_REVOKE_FAILED",
      });
    }
  }

  async userinfo(accessToken: string): Promise<OAuthUserinfo> {
    const res = await this.fetchImpl(`${this.siteUrl}${this.userinfoPath}`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${accessToken}`,
        accept: "application/json",
        "user-agent": this.userAgent,
      },
    });
    const text = await res.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    if (!res.ok) {
      const err = data as { error?: string; error_description?: string };
      throw new TrucklineError({
        message: err.error_description || err.error || `Userinfo failed (${res.status})`,
        status: res.status,
        code: err.error ?? "OAUTH_USERINFO_FAILED",
        details: data,
      });
    }
    return data as OAuthUserinfo;
  }

  private async tokenRequest(body: URLSearchParams): Promise<OAuthTokenResponse> {
    const res = await this.fetchImpl(`${this.siteUrl}${this.tokenPath}`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json",
        "user-agent": this.userAgent,
      },
      body,
    });
    const text = await res.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    if (!res.ok) {
      const err = data as {
        error?: string;
        error_description?: string;
        message?: string;
      };
      throw new TrucklineError({
        message:
          err.error_description ||
          err.message ||
          err.error ||
          `Token request failed (${res.status})`,
        status: res.status,
        code: err.error ?? "OAUTH_TOKEN_FAILED",
        details: data,
      });
    }
    return data as OAuthTokenResponse;
  }
}
