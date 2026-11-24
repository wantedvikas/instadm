# InstaAutoDM

**Self-hosted Instagram comment-to-DM automation.** Someone comments on your reel, and they get the link you promised in their DMs, optionally only if they follow you. Built for creators who say "comment LINK and I'll send it to you" and want that to happen automatically, for free, on their own infrastructure.

It runs on Next.js, deploys to Vercel, and stores data in Upstash Redis. You need no third-party automation service and no monthly fee.

---

## Contents

- [Features](#features)
- [How it works](#how-it-works)
- [What you need](#what-you-need)
- [Setup, step by step](#setup-step-by-step)
  1. [Prepare your Instagram account](#1-prepare-your-instagram-account)
  2. [Link a Facebook Page](#2-link-a-facebook-page)
  3. [Create the Meta app](#3-create-the-meta-app)
  4. [Deploy to Vercel](#4-deploy-to-vercel)
  5. [Connect the webhook](#5-connect-the-webhook)
  6. [Get a never-expiring Page access token](#6-get-a-never-expiring-page-access-token)
  7. [Log in and create your first automation](#7-log-in-and-create-your-first-automation)
- [Do I need Meta App Review?](#do-i-need-meta-app-review)
- [Local development](#local-development)
- [Project structure](#project-structure)
- [Instagram rules and limits](#instagram-rules-and-limits)
- [Troubleshooting](#troubleshooting)
- [Security and privacy](#security-and-privacy)
- [Limitations and ideas](#limitations-and-ideas)
- [License](#license)

---

## Features

**Automations**
- **One automation per reel.** Pick a reel from a grid of your videos, then set up the DM.
- **Trigger keywords.** `link, repo, code` matches whole words, case-insensitive. Leave it empty to reply to every comment.
- **Two delivery modes:**
  - **Link in first DM:** the commenter gets your message and link in a single DM. This is the simplest and most reliable mode.
  - **Followers only:** the commenter gets a DM with a **Send me the link** button. Tapping it checks whether they follow you. Followers get the link. Everyone else gets a "follow me first" message with an **I followed ✅** button that checks again.
- **Public reply under the comment** ("Sent you a DM 📩"), so people know to look in their inbox or Message requests. Write several and one is picked at random, so replies don't all look identical.
- **Pause / Resume / Delete** from the list, without editing anything.
- **Live DM preview**, a phone-style mock-up of exactly what commenters will receive, updated as you type.

**Dashboard and analytics**
- **Home:** totals for comments, DMs sent, links delivered and conversion, with **week-over-week change**. Also a 7-day **comments vs DMs** chart, your **top automations**, and a **live activity feed**.
- **Per-reel analytics:** everyone who commented, what they wrote, and what happened. The statuses are *Link sent*, *Asked to follow*, *Waiting for tap*, *No keyword*, *Paused* and *Failed*.
- **CSV export** of a reel's commenters.
- Password-protected, works on a phone, light theme.

**Reliability**
- Webhook signatures are verified with your Meta app secret.
- Duplicate webhook deliveries are ignored, so nobody gets two DMs.
- Your own comments and the app's own replies are ignored, so there are no loops.
- If the follow check itself errors, the link is sent anyway, so nobody gets stuck in a follow loop.

---

## How it works

```
Someone comments on your reel
        │
        ▼
Meta sends a "comments" webhook  ──►  /api/webhook (signature verified)
        │
        ├─ reel not automated / own comment / duplicate  →  ignored
        ├─ automation paused / keyword doesn't match       →  recorded, no DM
        │
        ├─ "Link in first DM"  →  private reply with your message + link
        │
        └─ "Followers only"    →  private reply with a "Send me the link" button
                                      │  (commenter taps it → "messages" webhook)
                                      ▼
                               follows you? ── yes ─►  DM with the link
                                      │
                                      no ─►  "Follow me first" + "I followed ✅" button
                                             (tap again → checked again)

After the first DM: optional public reply under the comment ("Sent you a DM 📩")
Every step is recorded in Redis and shown on the dashboard.
```

Under the hood it uses Meta's **Instagram API with Facebook Login**, which works through the Facebook Page linked to your Instagram account:

| What | Meta API |
|---|---|
| DM to a commenter | Private reply, `POST /me/messages` with `recipient.comment_id` |
| Buttons | Quick replies on the message |
| Follow check | `GET /{user-id}?fields=is_user_follow_business` |
| Public reply | `POST /{comment-id}/replies` |
| Your reels | `GET /{ig-id}/media` |

> **Why Facebook Login and not Unified login?** In our testing, Meta's newer **Unified login** setup delivered comment webhooks but **never forwarded incoming DMs**, so button taps never reached the app. Facebook Login with a Page token, plus subscribing the Page to `messages`, works.

---

## What you need

| | Cost | Notes |
|---|---|---|
| Instagram **Professional** account (Creator or Business) | Free | Must be **public**. |
| A **Facebook account** and a **Facebook Page** | Free | The Page is linked to your Instagram. It can be an empty Page. |
| A **Meta developer** account | Free | developers.facebook.com |
| **Vercel** account | Free (Hobby) | The Hobby plan is for **non-commercial use only**. Use Pro if you earn money with it. |
| **Upstash Redis** | Free tier | Added from the Vercel Marketplace in one click. |
| A **GitHub** account | Free | To fork this repo and deploy. |

Setup takes about 45 minutes the first time.

---

## Setup, step by step

### 1. Prepare your Instagram account

1. Switch to a **Professional** account: Instagram app → **Settings and activity → Account type and tools → Switch to professional account**, then pick **Creator** or **Business**.
2. Make sure the profile is **public**. Instagram doesn't send comment events for private accounts.
3. **Allow apps to read your messages.** Without this, Meta silently sends no DM events at all:
   - In the Instagram app: **Settings → Profile type and tools → Messaging tools → Message controls → Connected tools → Allow access to messages** → **On**.
   - On older app versions it's under **Settings → Privacy → Messages → Connected tools**.

### 2. Link a Facebook Page

1. On Facebook, create a Page (**Pages → Create new Page**) if you don't have one. Any name and category will do.
2. Link it to Instagram: open the Page → **Settings → Linked accounts → Instagram → Connect account**. Log in as your Instagram account and **allow message access** when asked.
3. Check that your Facebook account and Instagram account are in the same **Meta Account** (Accounts Center): Instagram → **Settings → Meta Account**.

### 3. Create the Meta app

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps). Register as a developer if asked; it's free.
2. Click **Create app**.
   - **Use case:** filter by **Business messaging** and choose **Manage messaging & content on Instagram**.
   - **Business portfolio:** you can skip it ("I don't want to connect a business portfolio yet"), or pick your own.
   - Finish creating the app.
3. **Add the Messenger use case.** It provides the Page messaging permissions the app needs. Go to **Use cases → Add use cases →** filter **All →** tick **Engage with customers on Messenger from Meta → Save**.
4. **Add the Instagram messaging permissions:** **Use cases → Manage messaging & content on Instagram → Customize → API setup with Facebook login → Add required messaging permissions**.
5. Copy the **App secret**: **App settings → Basic → App secret → Show**. You'll need it in step 4 as `META_APP_SECRET`.
   - Use the **Meta app** secret. It's not the "Instagram app secret" shown on some setup screens.

> Leave the app in **Development mode**. For your own account that's enough. See [Do I need Meta App Review?](#do-i-need-meta-app-review)

### 4. Deploy to Vercel

1. **Fork** this repository on GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and **import** your fork. Don't deploy yet, or let the first deploy fail; that's fine.
3. **Add Redis:** in the Vercel project, go to **Storage → Marketplace → Upstash → Upstash for Redis → Create** (free plan) and connect it to the project. This sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` for you.
4. **Add the environment variables** under **Settings → Environment Variables** (Production):

   | Variable | What to put |
   |---|---|
   | `META_APP_SECRET` | The App secret from step 3.5 |
   | `WEBHOOK_VERIFY_TOKEN` | Any random string you make up, e.g. from `openssl rand -hex 32` |
   | `DASHBOARD_PASSWORD` | The password you'll use to log in to the dashboard (make it long) |
   | `SESSION_SECRET` | Another random string, e.g. from `openssl rand -hex 32` |
   | `IG_ACCESS_TOKEN` | Leave it out for now; you'll get it in step 6 |

   To generate random strings in a terminal:
   ```bash
   openssl rand -hex 32
   ```
5. **Deploy.** Note your production URL, e.g. `https://your-app.vercel.app`.

### 5. Connect the webhook

The webhook is how Meta tells your app "someone commented" or "someone tapped the button".

1. In the Meta app, open **Use cases → Manage messaging & content on Instagram → Customize**. Find **Configure webhooks**, or the **Webhooks** product with **Instagram** selected.
2. Fill in:
   - **Callback URL:** `https://your-app.vercel.app/api/webhook`
   - **Verify token:** exactly the same value as your `WEBHOOK_VERIFY_TOKEN`
3. Click **Verify and save**. Meta calls your app, and it should pass straight away. If it fails, the token doesn't match or the deploy isn't live yet.
4. In the list of fields below, **subscribe** to `comments`, `messages` and `messaging_postbacks`.

### 6. Get a never-expiring Page access token

The app acts as your Facebook Page, so it needs a **Page access token**. A Page token created from a *long-lived* user token **never expires**.

**6a. Generate a user token with the right permissions**

1. Open [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Under **Meta App**, pick your app.
3. Under **Permissions → Add a Permission**, tick all of these:
   - `instagram_basic`
   - `instagram_manage_comments`
   - `instagram_manage_messages`
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_messaging`
   - `pages_manage_metadata`
   - `business_management`
4. Click **Generate Access Token**. A Facebook popup opens: select your **Page** and your **Instagram account**, approve, and the popup closes by itself.

**6b. Make it long-lived**

1. Click the copy icon next to the token.
2. Open the [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/), paste it, click **Debug**, then **Extend Access Token** at the bottom. Copy the new **long-lived** token.

**6c. Swap it for your Page token**

Run this in a terminal, pasting the long-lived token where shown. The leading space keeps the token out of your shell history in most shells:
```bash
 curl -s "https://graph.facebook.com/v27.0/me/accounts?fields=name,access_token,instagram_business_account&access_token=PASTE_LONG_LIVED_TOKEN_HERE"
```
In the output, find the Page whose `instagram_business_account` is your Instagram account, and copy its **`access_token`**. That's your Page token.

To confirm it never expires (optional): paste it into the Access Token Debugger. **Expires** should say **Never**.

**6d. Save it**

1. In Vercel, add `IG_ACCESS_TOKEN` with the Page token, then **redeploy**: **Deployments → … → Redeploy**.
2. Treat this token like a password. Anyone who has it can send DMs as you.

### 7. Log in and create your first automation

1. Open `https://your-app.vercel.app`, log in with `DASHBOARD_PASSWORD`, and click **Connect Instagram**. This finds your Instagram account through the Page and **subscribes the Page to DM events**, which is required for the button flow.
2. Click **+ New automation**, pick a reel, set a keyword and your link, choose the delivery mode, and click **Save automation**.
3. **Test it** from a second Instagram account: comment the keyword on that reel.
   - The DM arrives in their **Message requests** if they don't follow you; that's normal Instagram behaviour.
   - The commenter appears on the reel's page in the dashboard within a few seconds.
   - You can watch the server logs in Vercel → **Logs**. Look for `Link sent directly`, `Private reply with button sent`, `Event: quick reply`, `Sent link message` and `Public reply posted`.

---

## Do I need Meta App Review?

**Not for your own account.** In our testing (November 2026), with the app in **Development mode** and no Business Verification:
- ✅ **Strangers' comments** arrived, and they received the **link DM**.
- ✅ The **followers-only flow** worked for strangers: button tap → follow check → "follow first" → link.
- ✅ **Public replies** under comments were posted.

Meta can change these rules at any time. If your automation stops reaching people who aren't linked to your accounts, check the server logs for permission errors.

**You do need App Review** if you let **other creators** connect *their* Instagram accounts to your deployment, for example if you run it as a SaaS. That means:
1. **Business Verification** of a registered business.
2. **App Review** for Advanced Access to `instagram_manage_comments`, `instagram_manage_messages` and `pages_messaging`, with a screencast of the flow.
3. Switching the app to **Live**.

---

## Local development

```bash
git clone https://github.com/<you>/<your-fork>.git
cd <your-fork>
npm install
cp .env.example .env.local   # fill in the values (KV_* from your Upstash database)
npm run dev                  # http://localhost:3000
npm test                     # unit tests (keywords, signatures, analytics)
npm run lint
```

Meta can only send webhooks to a **public HTTPS URL**. To test webhooks locally, expose your dev server with a tunnel such as `cloudflared tunnel --url http://localhost:3000`, and point the Meta webhook at that URL temporarily. Or simply test on a Vercel preview deployment.

`.env.local` is git-ignored, so keep your real values there and **never** in `.env.example`.

---

## Project structure

```
app/
  (dash)/                     Password-protected dashboard (shared sidebar layout)
    page.tsx                  Home: stats, chart, top automations, activity feed
    automations/page.tsx      All automations: pause/resume, edit, delete
    automations/new/          Step 1: pick a reel
    automations/[mediaId]/    Settings + live DM preview + commenters + CSV export
  login/                      Password login
  api/webhook/route.ts        Meta webhook: verification (GET) + events (POST, signed)
  api/export/[mediaId]/       CSV export (login required)
  actions.ts                  Server actions: login, connect, save/pause/delete automation
  RuleForm.tsx                Automation editor with the phone preview
  ui.tsx, icons.tsx           Stat tiles, badges, area chart (SVG), icons
lib/
  bot.ts                      The automation logic (comment → DM → follow check → link)
  ig.ts                       Meta Graph API calls
  store.ts                    Redis: account, automations, events, de-duplication
  util.ts                     Pure helpers: keywords, signatures, analytics (unit-tested)
  session.ts                  Signed session cookie
tests/util.test.ts            Unit tests (node --test)
```

**What's stored in Redis:**

| Key | Contents |
|---|---|
| `account` | Your Instagram account ID and username |
| `rules` | One automation per reel |
| `events:<reelId>` | The last 1,000 comments/DMs for that reel (for analytics) |
| `pending:<user>` | Which reel a commenter is waiting on (expires in 7 days) |
| `seen:<id>` | De-duplication of webhook deliveries (expires in 7 days) |

---

## Instagram rules and limits

- **One DM per comment.** Instagram allows a single "private reply" per comment, sent within **7 days** of the comment.
- **24-hour window:** after someone taps a button or replies, you can message them for 24 hours.
- **Message requests:** DMs to people who don't follow you land in their **Requests** folder. The public reply helps them find it.
- **Rate limit:** about **750 private replies per hour** per account.
- **Only new comments** are handled. Comments made before an automation existed aren't processed.
- **Public account required** for comment events.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Webhook **Verify and save** fails | `WEBHOOK_VERIFY_TOKEN` in Vercel doesn't match, or you haven't redeployed since setting it. |
| Nothing arrives in the logs when someone comments | The reel isn't automated, the account is private, or `comments` isn't subscribed in the webhook settings. |
| `Webhook rejected: bad signature` in the logs | `META_APP_SECRET` is wrong. It must be the **Meta app** secret (App settings → Basic). |
| The first DM works, but **tapping the button does nothing** | 1) Turn on **Allow access to messages** (step 1.3). 2) Click **Reconnect** in the dashboard to subscribe the Page to DM events. 3) Make sure `messages` and `messaging_postbacks` are subscribed in the webhook settings. |
| **Reconnect** says "permissions needed: pages_messaging / pages_manage_metadata" | Add the **Messenger** use case (step 3.3) and regenerate the token with all 8 permissions (step 6). |
| "IG_ACCESS_TOKEN must be a Page token…" | You saved the user token. Do step 6c to get the Page token. |
| **Tester invite** shows "There was a problem accepting" | That's a Meta bug. Retry in a private window, or remove and re-add the tester. Not needed for Facebook Login anyway. |
| The commenter says no DM arrived | Check their **Message requests**. On the dashboard, a **Failed** status means Meta refused; the Vercel logs show the exact error. |
| "API setup with Instagram login is not available for newer apps" | Expected. Use **API setup with Facebook login** as described above. |

---

## Security and privacy

- **Secrets live only in environment variables:** Vercel, or `.env.local` locally. The repo ignores every `.env*` file except the blank `.env.example`. Before pushing, you can double-check with `git status` that no `.env.local` is listed.
- **Webhooks are verified** with an HMAC-SHA256 signature of the raw body, using your app secret. Unsigned or forged requests get `401`.
- **Dashboard access:** one password, compared in constant time, and a signed, HTTP-only, secure cookie valid for 30 days.
- **If a token leaks:** generate a new Page token (step 6), update `IG_ACCESS_TOKEN`, redeploy, and change your Facebook password to invalidate the old one. To rotate `SESSION_SECRET` or `DASHBOARD_PASSWORD`, just change them and redeploy.
- **Commenter data:** the app stores commenters' usernames, comment text and statuses (last 1,000 per reel) to show you analytics. Deleting an automation deletes its data. If you run this for other people, publish a privacy policy.

---

## Limitations and ideas

**Current limits:**
- One Instagram account per deployment.
- Reels only. Photos and carousels aren't listed in the picker.
- Analytics keep the last 1,000 events per reel.
- Chart days are cut at server time (UTC on Vercel).

**Ideas welcome as PRs:**
- Story-reply and DM-keyword automations
- Link-click tracking
- Multiple accounts
- AI-written replies

---

## License

[MIT](LICENSE): free to use, modify and self-host.
