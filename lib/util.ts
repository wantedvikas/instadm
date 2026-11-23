// Pure helpers (no imports from the app) so they can be unit-tested with plain `node --test`.
import { createHmac, timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Meta signs webhook bodies: X-Hub-Signature-256: sha256=<hmac of raw body>. Any listed secret may match. */
export function verifySignature(rawBody: string, header: string | null, secrets: (string | undefined)[]) {
  if (!header?.startsWith("sha256=")) return false;
  return secrets.some(
    (s) => !!s && safeEqual(header, "sha256=" + createHmac("sha256", s).update(rawBody).digest("hex")),
  );
}

/** Empty keyword list = every comment matches. Otherwise any comma-separated keyword as a whole word, case-insensitive. */
export function matchesKeyword(text: string, keywords: string) {
  const list = keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
  if (list.length === 0) return true;
  const words = text.toLowerCase().split(/[^\p{L}\p{N}_]+/u);
  return list.some((k) => (k.includes(" ") ? text.toLowerCase().includes(k) : words.includes(k)));
}

/** Signed session value: "<igId>.<hmac>". */
export function signValue(value: string, secret: string) {
  return value + "." + createHmac("sha256", secret).update(value).digest("hex");
}

export function readSigned(signed: string | undefined, secret: string) {
  if (!signed) return null;
  const i = signed.lastIndexOf(".");
  if (i < 1) return null;
  const value = signed.slice(0, i);
  return safeEqual(signed, signValue(value, secret)) ? value : null;
}
