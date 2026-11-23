# InstaAutoDM

Send people the link you promised in a reel when they comment on it. If you want, only followers get it.

## How it works

1. Log in to the dashboard with your password. The dashboard lists all your videos.
2. For each video, turn on auto-DM and set the trigger keywords (leave them empty to reply to every comment), the first DM, and the link message.
3. Someone comments with a keyword. They get one DM (Instagram's "private reply") with a **Send me the link** button.
4. They tap the button:
   - If "Only send the link to followers" is off, or they already follow you, they get the link.
   - Otherwise they get your follow-first message with an **I followed ✅** button. Tapping it checks again and sends the link once they follow.

**Why there's a button tap.** Instagram only shows whether someone follows you (`is_user_follow_business`) after that person has messaged you, and tapping a button counts as a message. There's no "new follower" webhook, so the check runs when they tap. A commenter can also type any reply instead of tapping, and that triggers the same flow.

**Instagram's limits:**
- The first DM must go out within 7 days of the comment.
- You can send only one DM per comment until the person replies.
- After they reply, you have 24 hours to message them.
- Your account must be public.

## Setup

This app uses Meta's **Instagram API with Unified Login**. The access token is generated in the Meta dashboard, so there's no OAuth flow inside the app.

### 1. Instagram account
Switch it to a **Professional** account (Creator or Business) and make sure it's **public**.

### 2. Meta app ([developers.facebook.com/apps](https://developers.facebook.com/apps))
1. Create an app with the use case **Manage messaging & content on Instagram**. The app must belong to a business portfolio.
2. Go to **Use cases → Customize → API setup with Unified login**.
3. **1. Configure your app:** click **Create new configuration** and pick token expiration **Never**. You can leave out the `ads_*` permissions. The app needs `instagram_basic`, `instagram_manage_comments` and `instagram_manage_messages`.
4. **App roles:** add your Instagram account as an **Instagram Tester**, then accept the invite on instagram.com (Settings → Website permissions → Apps and websites → Tester invites).
5. **2. Generate access tokens:** add your Instagram account and generate a token. It's shown only once. Set it as `IG_ACCESS_TOKEN`.
6. **3. Configure webhooks:**
   - Callback URL: `https://<your-app>.vercel.app/api/webhook`
   - Verify token: the same value as `WEBHOOK_VERIFY_TOKEN`
   - Subscribe to `comments`, `messages` and `messaging_postbacks`.
7. **App settings → Basic:** copy the **App secret** into `META_APP_SECRET`.

### 3. Vercel
1. Import the repo in Vercel.
2. Go to **Storage → Marketplace → Upstash Redis** and create the free database. It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` for you.
3. Add the rest of the variables from `.env.example` under **Settings → Environment Variables**, then redeploy.
4. Open the app, log in with `DASHBOARD_PASSWORD`, click **Connect Instagram**, and set up your videos.

If you ever replace the token, update `IG_ACCESS_TOKEN`, redeploy, and click **Reconnect**.

### 4. Going live for real followers
While the app is in Development mode, Meta only delivers webhooks and DMs for accounts with a role on the app, so test with your own account and test accounts. To reach everyone:
1. Complete **Business Verification**.
2. Switch the app to **Live**.
3. Submit **App Review** for Advanced Access to `instagram_manage_comments` and `instagram_manage_messages`. You'll need a screencast of this exact flow.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
npm test
```

Meta needs a public HTTPS URL for webhooks. Test on a Vercel preview deployment, or use a tunnel such as `cloudflared`.

## Notes

- **Hosting:** Vercel's free Hobby plan is for non-commercial use only. Switch to Pro if the channel makes money.
- **One owner:** the dashboard is protected by a single password, and the app manages the one Instagram account the token belongs to.
- **If the follow check errors** (for example, because Meta changes something), the bot sends the link anyway rather than leaving people stuck.
