"use client";

import { useActionState } from "react";
import { connect, login, type FormState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="login">
      <label>
        Password
        <input type="password" name="password" autoComplete="current-password" required autoFocus />
      </label>
      <button disabled={pending}>{pending ? "Checking…" : "Log in"}</button>
      {state.error && <p role="alert" className="err">{state.error}</p>}
    </form>
  );
}

export function ConnectButton({ label }: { label: string }) {
  const [state, action, pending] = useActionState<FormState>(connect, {});
  return (
    <form action={action} className="row">
      <button disabled={pending}>{pending ? "Connecting…" : label}</button>
      <span role="status" className={state.error ? "err" : "ok"}>
        {state.error ?? (state.ok ? "Connected ✓" : "")}
      </span>
    </form>
  );
}
