import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "../actions";
import { ConnectButton } from "../Forms";
import { Nav } from "../Nav";
import { isLoggedIn } from "@/lib/session";
import { getAccount } from "@/lib/store";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await isLoggedIn())) redirect("/login");

  const account = await getAccount();
  if (!account) {
    return (
      <main className="center">
        <div className="panel narrow">
          <h1>Connect Instagram</h1>
          <p className="muted">Reads the account behind IG_ACCESS_TOKEN and subscribes it to webhooks.</p>
          <ConnectButton label="Connect Instagram" />
        </div>
      </main>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          InstaAutoDM
        </Link>
        <Link href="/automations/new" className="button block">
          + New automation
        </Link>
        <Nav />
        <div className="account">
          <a href={`https://instagram.com/${account.username}`} target="_blank" rel="noreferrer">
            @{account.username}
          </a>
          <ConnectButton label="Reconnect" subtle />
          <form action={logout}>
            <button className="link">Log out</button>
          </form>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
