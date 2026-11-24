import { redirect } from "next/navigation";
import { LoginForm } from "../Forms";
import { isLoggedIn } from "@/lib/session";

export default async function LoginPage() {
  if (await isLoggedIn()) redirect("/");
  return (
    <main className="center">
      <div className="panel narrow">
        <h1>InstaAutoDM</h1>
        <p className="muted">Auto-DM your promised links to people who comment on your reels.</p>
        <LoginForm />
      </div>
    </main>
  );
}
