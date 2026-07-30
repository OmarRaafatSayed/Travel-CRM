/**
 * Supabase auth helper (frontend)
 * ================================
 * Lightweight session store — no @supabase/supabase-js SDK required.
 *
 * Persistence strategy
 * --------------------
 * The session is stored in localStorage under SESSION_KEY so it survives
 * page refreshes and browser restarts (until the token expires or the user
 * logs out).  An in-memory cache avoids repeated JSON.parse on every request.
 *
 * Token expiry
 * ------------
 * Supabase access tokens expire after 1 hour.  The `expires_at` field
 * (Unix seconds) is stored alongside the token so callers can detect
 * expiry without making a network round-trip.  Token refresh is handled
 * by re-logging in via the backend; automatic silent refresh can be added
 * later once @supabase/supabase-js is introduced.
 *
 * If you later add @supabase/supabase-js, replace this file with the
 * official `createClient()` call and keep the same exported function names
 * so that api.ts and App.tsx require no changes.
 */

// ── Storage key ───────────────────────────────────────────────────────────────
// Intentionally namespaced so multiple projects on the same localhost
// do not collide.
const SESSION_KEY = 'travel_crm_sb_session';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  /** Unix timestamp (seconds) — when the access_token expires */
  expires_at?: number;
}

export interface StoredUser {
  id: string;
  email: string;
}

export interface StoredAuth {
  session: SupabaseSession;
  user: StoredUser;
}

// ── In-memory cache ───────────────────────────────────────────────────────────
let _auth: StoredAuth | null = null;

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Persist the session returned by the backend `/auth/login` endpoint.
 * Call this immediately after a successful login or signup.
 *
 * @example
 *   const data = await res.json();
 *   setSupabaseSession(data.session, { id: data.user.id, email: data.user.email });
 */
export function setSupabaseSession(
  session: SupabaseSession,
  user: StoredUser,
): void {
  const auth: StoredAuth = { session, user };
  _auth = auth;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(auth));
  } catch {
    // localStorage blocked (private browsing / quota exceeded) — memory only
    console.warn('[auth] localStorage unavailable; session is memory-only.');
  }
}

// ── Clear ─────────────────────────────────────────────────────────────────────

/**
 * Remove the session from memory and localStorage.
 * Call on logout or when a 401 is received from the backend.
 */
export function clearSupabaseSession(): void {
  _auth = null;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Load auth from localStorage into the in-memory cache.
 * Call once on app mount (re-hydration).
 *
 * Returns the stored auth object, or null if none exists / data is corrupt.
 */
export function loadStoredSession(): StoredAuth | null {
  // Already in memory — nothing to do
  if (_auth) return _auth;

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed: StoredAuth = JSON.parse(raw);
    // Basic structure check before trusting the data
    if (!parsed?.session?.access_token || !parsed?.user?.id) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    _auth = parsed;
    return _auth;
  } catch {
    // Corrupt JSON — wipe it
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    return null;
  }
}

/**
 * Return the current access token, or null if the user is not logged in.
 * Used by api.ts on every request.
 */
export function getAccessToken(): string | null {
  if (_auth) return _auth.session.access_token;

  const stored = loadStoredSession();
  return stored?.session.access_token ?? null;
}

/**
 * Return the stored user object, or null if not logged in.
 */
export function getStoredUser(): StoredUser | null {
  if (_auth) return _auth.user;
  return loadStoredSession()?.user ?? null;
}

/**
 * Returns true when there is a session whose token has not yet expired.
 * Note: the server is the ultimate source of truth — this is a client-side
 * optimisation to avoid obviously stale tokens.
 */
export function isSessionValid(): boolean {
  const auth = _auth ?? loadStoredSession();
  if (!auth) return false;

  const { expires_at } = auth.session;
  if (!expires_at) return true; // no expiry metadata — assume valid

  const nowSeconds = Math.floor(Date.now() / 1000);
  // Treat the token as expired 60 s early to account for clock skew
  return expires_at - 60 > nowSeconds;
}

