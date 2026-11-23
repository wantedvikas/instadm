# InstaAutoDM

Send people the link you promised in a reel when they comment on it. If you want, only followers get it.

## How it works

1. Log in with Instagram. The dashboard lists all your videos.
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

### 1. Instagram account
Switch it to a **Professional** account (Creator or Business) and make sure it's **public**.

### 2. Meta app ([developers.facebook.com](https://developers.facebook.com/apps))
1. Create an app of type **Business**, then add the **Instagram** product and open **API setup with Instagram login**.
2. Copy the **Instagram app ID** and **Instagram app secret** into `IG_APP_ID` and `IG_APP_SECRET`.
3. Under **Set up Instagram business login**, add the OAuth redirect URL `https://<your-app>.vercel.app/api/auth/callback`.
4. Under **Configure webhooks**:
   - Callback URL: `https://<your-app>.vercel.app/api/webhook`
   - Verify token: the same value as `WEBHOOK_VERIFY_TOKEN`
   - Subscribe to `comments`, `messages` and `messaging_postbacks`.
5. Under **App roles**, add your Instagram account as an **Instagram Tester** and accept the invite in the Instagram app (Settings → Website permissions → Apps and websites).

### 3. Vercel
1. Push this folder to GitHub, then import it in Vercel.
2. Go to **Storage → Marketplace → Upstash Redis** and create the free database. It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` for you.
3. Add the rest of the variables from `.env.example` under **Settings → Environment Variables**, then redeploy.
4. Open the app, click **Connect Instagram**, and set up your videos.

A daily Vercel Cron job (`vercel.json`) refreshes the 60-day Instagram token every week.

### 4. Going live for real followers
While the app is in Development mode, Meta only delivers webhooks and DMs for accounts with a role on the app, so test with your own account and test accounts. To reach everyone:
1. Complete **Business Verification**.
2. Switch the app to **Live**.
3. Submit **App Review** for `instagram_business_manage_comments` and `instagram_business_manage_messages` (Advanced Access). You'll need a screencast of this exact flow, and at least one successful API call per permission first.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
npm test
```

Meta needs a public HTTPS URL for webhooks and OAuth. Test on a Vercel preview deployment, or use a tunnel such as `cloudflared`.

## Notes

- **Hosting:** Vercel's free Hobby plan is for non-commercial use only. Switch to Pro if the channel makes money.
- **One owner:** the first Instagram account that connects becomes the owner. Nobody else can log in.
- **If the follow check errors** (for example, because Meta changes something), the bot sends the link anyway rather than leaving people stuck.
