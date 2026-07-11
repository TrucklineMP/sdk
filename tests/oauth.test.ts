import { describe, expect, it, vi } from "vitest";
import { generatePkce, TrucklineOAuth } from "../src/oauth.js";

describe("oauth", () => {
  it("builds authorize url with pkce", () => {
    const oauth = new TrucklineOAuth({
      clientId: "tlmp_client_x",
      redirectUri: "http://localhost:3000/callback",
    });
    const pkce = generatePkce();
    const url = oauth.getAuthorizeUrl({
      scope: ["profile", "vtc:read"],
      state: "abc",
      codeChallenge: pkce.codeChallenge,
    });
    const parsed = new URL(url);
    expect(parsed.origin).toBe("https://trucklinemp.com");
    expect(parsed.pathname).toBe("/oauth/authorize");
    expect(parsed.searchParams.get("client_id")).toBe("tlmp_client_x");
    expect(parsed.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/callback",
    );
    expect(parsed.searchParams.get("scope")).toBe("profile vtc:read");
    expect(parsed.searchParams.get("code_challenge")).toBe(pkce.codeChallenge);
    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
    expect(pkce.codeVerifier.length).toBeGreaterThan(20);
  });

  it("exchanges code for tokens", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          access_token: "tlmp_oat_x",
          token_type: "Bearer",
          expires_in: 3600,
          refresh_token: "tlmp_ort_x",
        }),
        { status: 200 },
      ),
    );
    const oauth = new TrucklineOAuth({
      clientId: "c",
      clientSecret: "s",
      redirectUri: "https://app.example/cb",
      fetch: fetchImpl as unknown as typeof fetch,
    });
    const tokens = await oauth.exchangeCode("code123", {
      codeVerifier: "verifier",
    });
    expect(tokens.access_token).toBe("tlmp_oat_x");
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(init.body)).toContain("grant_type=authorization_code");
    expect(String(init.body)).toContain("code=code123");
  });

  it("refreshes tokens", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          access_token: "tlmp_oat_new",
          token_type: "Bearer",
          expires_in: 3600,
          refresh_token: "tlmp_ort_new",
        }),
        { status: 200 },
      ),
    );
    const oauth = new TrucklineOAuth({
      clientId: "c",
      clientSecret: "s",
      redirectUri: "https://app.example/cb",
      fetch: fetchImpl as unknown as typeof fetch,
    });
    const tokens = await oauth.refresh("tlmp_ort_old");
    expect(tokens.access_token).toBe("tlmp_oat_new");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/api/oauth/token");
    expect(String(init.body)).toContain("grant_type=refresh_token");
    expect(String(init.body)).toContain("refresh_token=tlmp_ort_old");
  });

  it("revokes tokens", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
    const oauth = new TrucklineOAuth({
      clientId: "c",
      clientSecret: "s",
      redirectUri: "https://app.example/cb",
      fetch: fetchImpl as unknown as typeof fetch,
    });
    await oauth.revoke("tlmp_oat_x", "access_token");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/api/oauth/revoke");
    expect(String(init.body)).toContain("token=tlmp_oat_x");
    expect(String(init.body)).toContain("token_type_hint=access_token");
  });

  it("fetches userinfo", async () => {
    const profile = {
      sub: "u1",
      web_id: 42,
      name: "Driver",
      handle: "driver",
      steam_id: "76561198000000000",
    };
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify(profile), { status: 200 }),
    );
    const oauth = new TrucklineOAuth({
      clientId: "c",
      redirectUri: "https://app.example/cb",
      fetch: fetchImpl as unknown as typeof fetch,
    });
    const me = await oauth.userinfo("tlmp_oat_x");
    expect(me).toEqual(profile);
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get("authorization")).toBe("Bearer tlmp_oat_x");
  });
});
