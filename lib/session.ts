import { cookies } from "next/headers";
import { readSigned, signValue } from "./util";
import { getAccount } from "./store";

const COOKIE = "session";
const secret = () => process.env.SESSION_SECRET!;

export async function setSession(igId: string) {
  (await cookies()).set(COOKIE, signValue(igId, secret()), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

/** The connected account, only if this browser is logged in as it. */
export async function currentAccount() {
  const igId = readSigned((await cookies()).get(COOKIE)?.value, secret());
  if (!igId) return null;
  const account = await getAccount();
  return account?.igId === igId ? account : null;
}
