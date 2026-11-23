import { cookies } from "next/headers";
import { readSigned, signValue } from "./util";

const COOKIE = "session";
const secret = () => process.env.SESSION_SECRET!;

export async function setSession() {
  (await cookies()).set(COOKIE, signValue("owner", secret()), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function isLoggedIn() {
  return readSigned((await cookies()).get(COOKIE)?.value, secret()) === "owner";
}
