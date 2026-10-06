import { OAuth2Client } from "google-auth-library";
import { HttpError } from "../lib/httpError";

export type GoogleProfile = { email: string; name: string; picture: string | null };

let client: OAuth2Client | null = null;

// Checks the ID token a browser got from "Sign in with Google": signed by Google, issued for OUR app (audience), not expired,
// and the email address verified by Google. Needs GOOGLE_CLIENT_ID (Google Cloud Console → OAuth client, type "Web").
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new HttpError(503, "Google sign-in isn't set up yet");
  client ??= new OAuth2Client(clientId);
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const p = ticket.getPayload();
    if (!p?.email || !p.email_verified) throw new Error("unverified email");
    return { email: p.email.toLowerCase(), name: (p.name ?? p.email.split("@")[0]).slice(0, 100), picture: p.picture ?? null };
  } catch {
    throw new HttpError(401, "Google sign-in failed. Please try again.");
  }
}
