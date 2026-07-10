import { generatePkce, TrucklineOAuth } from "../dist/oauth-entry.js";

const oauth = new TrucklineOAuth({
  clientId: process.env.TRUCKLINE_CLIENT_ID ?? "tlmp_client_example",
  redirectUri: process.env.TRUCKLINE_REDIRECT_URI ?? "http://localhost:3000/callback",
});

const pkce = generatePkce();
const url = oauth.getAuthorizeUrl({
  scope: ["profile", "vtc:read"],
  state: "demo",
  codeChallenge: pkce.codeChallenge,
});

console.log("Open:", url);
console.log("Store code_verifier for token exchange:", pkce.codeVerifier);
