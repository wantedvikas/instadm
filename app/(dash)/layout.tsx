import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "../actions";
import { ConnectButton } from "../Forms";
import { Icon } from "../icons";
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
          <span className="logo">
            <Icon name="send" size={17} />
          </span>
          InstaAutoDM
        </Link>
        <Nav />
        <div className="side-card">
          <span className="avatar">{account.username[0]?.toUpperCase()}</span>
          <a href={`https://instagram.com/${account.username}`} target="_blank" rel="noreferrer">
            <strong>@{account.username}</strong>
          </a>
          <span className="badge good">Connected</span>
          <ConnectButton label="Reconnect" subtle />
        </div>
        <div className="side-links">
          <form action={logout}>
            <button className="nav">
              <Icon name="logout" />
              Log out
            </button>
          </form>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
