import express, { Request, Response, Router } from "express";
import { randomUUID, createHash } from "node:crypto";
import passport from "passport";
import { signJwtToken } from "../../utils/jwt";
import { config } from "../../config/app.config";

const router: Router = express.Router();

// ─── In-memory store for auth code → userId + PKCE ───────────────────────────
interface PendingCode {
  userId: string;
  expiresAt: number;
  redirectUri: string;
  codeChallenge?: string;      // PKCE: stored challenge
  codeChallengeMethod?: string; // PKCE: always "S256"
}
const pendingCodes = new Map<string, PendingCode>();

// Cleanup expired codes every minute
const codeCleanup = setInterval(() => {
  const now = Date.now();
  for (const [code, data] of pendingCodes.entries()) {
    if (now > data.expiresAt) pendingCodes.delete(code);
  }
}, 60_000);
codeCleanup.unref();

// ─── PKCE verifier helper ──────────────────────────────────────────────────────
function verifyPkce(verifier: string, challenge: string): boolean {
  const computed = createHash("sha256")
    .update(verifier)
    .digest("base64url"); // base64url (no padding, url-safe)
  return computed === challenge;
}

// ─────────────────────────────────────────────────────────────────────────────
// 0.  Dynamic Client Registration (RFC 7591) — mcp-remote calls this first
// ─────────────────────────────────────────────────────────────────────────────
//this registers the mcp client with our auth server
router.post("/register", (req: Request, res: Response) => {
  const { client_name, redirect_uris, grant_types, response_types } = req.body;
  const client_id = randomUUID();

  res.status(201).json({
    client_id,
    client_name: client_name ?? "mcp-client",
    redirect_uris: redirect_uris ?? [],
    grant_types: grant_types ?? ["authorization_code"],
    response_types: response_types ?? ["code"],
    token_endpoint_auth_method: "none",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 1.  Discovery endpoint — mounted at /.well-known/oauth-authorization-server
//     Route is '/oauth-authorization-server' (mounted via app.use('/.well-known', router))
// ─────────────────────────────────────────────────────────────────────────────
router.get("/oauth-authorization-server", (_req: Request, res: Response) => {
  const base = config.BASE_URL;
  res.json({
    issuer: base,
    authorization_endpoint: `${base}/mcp/oauth/authorize`,
    token_endpoint: `${base}/mcp/oauth/token`,
    registration_endpoint: `${base}/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],  // ← PKCE required by mcp-remote
    token_endpoint_auth_methods_supported: ["none"],
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2.  Authorization endpoint — stores PKCE challenge and redirects to Google
// ─────────────────────────────────────────────────────────────────────────────
router.get("/authorize", (req: Request, res: Response) => {
  const {
    redirect_uri,
    state,
    client_id,
    code_challenge,
    code_challenge_method,
  } = req.query as Record<string, string>;

  if (!redirect_uri) {
    res.status(400).json({ error: "redirect_uri is required" });
    return;
  }

  // Store everything (including PKCE) in a cookie for the Google callback
  res.cookie(
    "mcp_oauth_state",
    JSON.stringify({ redirect_uri, state, client_id, code_challenge, code_challenge_method }),
    {
      httpOnly: true,
      maxAge: 10 * 60 * 1000, // 10 minutes
      sameSite: "lax",
    }
  );

  passport.authenticate("google-mcp", {
    scope: ["profile", "email"],
    session: false,
  })(req, res);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3a. Google OAuth callback — issues an auth code and redirects back to Claude
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  "/google/callback",
  passport.authenticate("google-mcp", {
    session: false,
    failureRedirect: `${config.FRONTEND_ORIGIN}/auth?error=mcp_auth_failed`,
  }),
  (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user?._id) {
        res.status(401).json({ error: "Authentication failed" });
        return;
      }

      const cookieRaw = req.cookies?.mcp_oauth_state;
      if (!cookieRaw) {
        res.status(400).json({ error: "Missing OAuth state cookie. Please restart the flow." });
        return;
      }

      const { redirect_uri, state, code_challenge, code_challenge_method } = JSON.parse(
        cookieRaw
      ) as {
        redirect_uri: string;
        state?: string;
        code_challenge?: string;
        code_challenge_method?: string;
      };

      const code = randomUUID();
      pendingCodes.set(code, {
        userId: user._id.toString(),
        expiresAt: Date.now() + 5 * 60 * 1000,
        redirectUri: redirect_uri,
        codeChallenge: code_challenge,
        codeChallengeMethod: code_challenge_method,
      });

      res.clearCookie("mcp_oauth_state");

      const redirectUrl = new URL(redirect_uri);
      redirectUrl.searchParams.set("code", code);
      if (state) redirectUrl.searchParams.set("state", state);

      res.redirect(redirectUrl.toString());
    } catch (err) {
      console.error("MCP OAuth callback error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 3b. Token endpoint — verifies PKCE and exchanges auth code for access token
// ─────────────────────────────────────────────────────────────────────────────
router.post("/token", (req: Request, res: Response) => {
  const { code, redirect_uri, grant_type, code_verifier } = req.body as Record<string, string>;

  if (grant_type !== "authorization_code") {
    res.status(400).json({ error: "unsupported_grant_type" });
    return;
  }

  if (!code) {
    res.status(400).json({ error: "invalid_request", error_description: "code is required" });
    return;
  }

  const pending = pendingCodes.get(code);

  if (!pending) {
    res.status(400).json({ error: "invalid_grant", error_description: "Code not found or already used" });
    return;
  }

  if (Date.now() > pending.expiresAt) {
    pendingCodes.delete(code);
    res.status(400).json({ error: "invalid_grant", error_description: "Authorization code expired" });
    return;
  }

  if (redirect_uri && pending.redirectUri !== redirect_uri) {
    res.status(400).json({ error: "invalid_grant", error_description: "redirect_uri mismatch" });
    return;
  }

  // Verify PKCE if the auth request included a code_challenge
  if (pending.codeChallenge) {
    if (!code_verifier) {
      res.status(400).json({ error: "invalid_request", error_description: "code_verifier required" });
      return;
    }
    if (!verifyPkce(code_verifier, pending.codeChallenge)) {
      res.status(400).json({ error: "invalid_grant", error_description: "PKCE verification failed" });
      return;
    }
  }

  // Code is valid — consume it (one-time use!)
  pendingCodes.delete(code);

  const accessToken = signJwtToken({ userId: pending.userId });

  res.json({
    access_token: accessToken,
    token_type: "bearer",
    expires_in: 86400,
  });
});

export default router;
