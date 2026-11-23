import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { authorizeUrl } from "@/lib/ig";

export async function GET() {
  const state = randomBytes(16).toString("hex");
  (await cookies()).set("oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600 });
  return NextResponse.redirect(authorizeUrl(state));
}
