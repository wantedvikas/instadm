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

The app uses Meta's **Instagram API with Facebook Login**, which works through the Facebook Page linked to your Instagram account. Unified login (the newer setup) delivered comment webhooks but never forwarded incoming DMs, so it couldn't run the button and follow-check flow.

### 1. Instagram account and Page
1. Switch Instagram to a **Professional** account (Creator or Business).
2. Create a Facebook Page and link it to the Instagram account: **Page settings → Linked accounts → Instagram**.
3. In the Instagram app, turn on **Settings → Profile type and tools → Messaging tools → Message controls → Allow access to messages**.

### 2. Meta app ([developers.facebook.com/apps](https://developers.facebook.com/apps))
1. Create an app with two use cases: **Manage messaging & content on Instagram** and **Engage with customers on Messenger from Meta**.
2. Under **Instagram API → API setup with Facebook login**, click **Add required messaging permissions**.
3. Configure the **webhooks** for the Instagram object:
   - Callback URL: `https://<your-app>.vercel.app/api/webhook`
   - Verify token: the same value as `WEBHOOK_VERIFY_TOKEN`
   - Subscribe to `comments`, `messages` and `messaging_postbacks`.
4. **App settings → Basic:** copy the **App secret** into `META_APP_SECRET`.

### 3. Page access token (`IG_ACCESS_TOKEN`)
1. In [Graph API Explorer](https://developers.facebook.com/tools/explorer/), pick your app and add these permissions:
   - `instagram_basic`, `instagram_manage_comments`, `instagram_manage_messages`
   - `pages_show_list`, `pages_read_engagement`, `pages_messaging`, `pages_manage_metadata`
   - `business_management`
2. Click **Generate Access Token** and approve.
3. Extend the token in the [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/) with **Extend Access Token**.
4. Call `GET /me/accounts?fields=access_token,instagram_business_account` with the extended token. The `access_token` of the Page linked to your Instagram account is a Page token that **never expires**. Set it as `IG_ACCESS_TOKEN`.

### 4. Vercel
1. Import the repo, and add **Upstash Redis** from the Marketplace. It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` for you.
2. Set the rest of the variables from `.env.example`, then deploy.
3. Log in with `DASHBOARD_PASSWORD` and click **Connect Instagram**. This subscribes the Page to DM webhooks. **Reconnect** shows the active webhook fields, the token's permissions and recent DM threads.

### 5. Going live for real followers
In Development mode, only accounts linked to someone with a role on the app get DMs. To reach everyone:
1. Complete **Business Verification**.
2. Pass **App Review** for Advanced Access to `instagram_manage_comments`, `instagram_manage_messages` and `pages_messaging`.
3. Switch the app to **Live**.

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
