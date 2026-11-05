# Notehub setup — no credit card

Notehub uses **Firebase Spark (free)** for Google sign-in and lesson records, and **Cloudinary Free** for board photos. Do not upgrade Firebase to Blaze or enable Firebase Storage. Both services have free usage limits; this setup is not unlimited.

## Your Firebase project is already created

- Project ID: `notehub-classroom-pj2026`
- Web app: `notehub-web`
- Google sign-in: enabled
- Database: Standard Firestore, `(default)`, Oregon (`us-west1`)
- Firestore rules: deployed; direct browser database access is denied
- Project owner: the Google account used during setup
- Both requested teacher emails are stored in this workspace's ignored `.env.local`

[Open Firebase Console](https://console.firebase.google.com/u/1/project/notehub-classroom-pj2026/overview). Use the project-owner Google account if the console says you have no access. Google Analytics, Firebase Hosting, and Firebase Storage are not needed.

The downloaded ZIP excludes `.env.local` and credentials. Copy its values into your own local configuration and Vercel environment when deploying.

## Current connection status

This workspace now has the Firebase server key and Cloudinary credentials connected in ignored `.env.local`. Authentication/Admin access, Google provider settings, Firestore write/read, and Cloudinary image upload/public delivery were verified. Temporary test data was removed. Both approved Google emails remain configured.

The embedded browser did not complete the Google popup. Finish the teacher sign-in check in a regular browser at http://localhost:3000. Deployment also requires importing this workspace's private environment settings into Vercel and authorizing its exact hostname in Firebase Authentication. The ZIP does not include any credentials.

The remaining sections explain the setup for a fresh copy and future maintenance.

## 1. Create a Cloudinary Free account

Open [Cloudinary signup](https://cloudinary.com/users/register_free), choose the **Free** plan, and complete signup yourself. No card or paid plan is needed. See [Cloudinary's free-plan guide](https://cloudinary.com/documentation/developer_onboarding_faq_free_plan).

In the Cloudinary Console, open **Settings → API Keys** (or **Go to API Keys** from the dashboard). Add these values to `.env.local`:

```dotenv
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

These are server-only values. Keep the API secret out of chat, source control, and browser code. No unsigned upload preset is required: Notehub authenticates its uploads on the server. Do not enable an unsigned upload preset for this app.

Monitor usage in the Cloudinary dashboard. The Free plan's allowance covers storage, bandwidth, and transformations together. Stay on Free; if you hit its limit, remove unused content or wait for applicable usage to reset. Do not add billing to this setup.

## 2. Add Firebase server credentials

Open **Firebase Project settings → Service accounts → Firebase Admin SDK → Generate new private key**. Complete the key-generation step yourself and save the JSON file outside this repository. Do not paste it in chat.

Copy these fields from the downloaded JSON into `.env.local`:

| JSON field | Server variable |
| --- | --- |
| `project_id` | `FIREBASE_PROJECT_ID` |
| `client_email` | `FIREBASE_CLIENT_EMAIL` |
| `private_key` | `FIREBASE_PRIVATE_KEY` |

Use `FIREBASE_PROJECT_ID=notehub-classroom-pj2026`. For `.env.local`, surround the private key with double quotes and preserve the `\n` escapes as shown in `.env.example`. On Vercel, paste the key without its surrounding JSON quotes; both literal `\n` escapes and real newlines are supported.

Server credentials are needed for Firebase Admin, even on Spark. Key generation does not require enabling Firebase Storage or upgrading to Blaze. Never put `NEXT_PUBLIC_` in an admin variable's name.

## 3. Check the remaining configuration

The current workspace already has the four public web settings. For a fresh copy, copy `.env.example` to `.env.local`, then find them in **Firebase Project settings → General → Your apps → notehub-web**:

| Firebase config field | Environment variable |
| --- | --- |
| `apiKey` | `NEXT_PUBLIC_FIREBASE_API_KEY` |
| `authDomain` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `appId` | `NEXT_PUBLIC_FIREBASE_APP_ID` |

Firebase's `storageBucket` value is not used. Photo storage is Cloudinary.

Set `TEACHER_EMAIL` to the comma-separated list of approved Google emails. Both accounts can publish and delete lessons; other Google accounts are denied teacher sessions even if Google sign-in succeeds. Students need no accounts.

For local testing use **http://localhost:3000**. Under **Firebase Authentication → Settings → Authorized domains**, ensure `localhost` and the final Vercel hostname are authorized. Use bare hostnames in this console list, without protocols, paths, or ports. `firebase.json` includes the Google provider settings for the current project; update the authorized domains when the production URL is known.

## 4. Test locally

Use Node.js 24:

```sh
npm install
npm test
npm run firebase:check
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), choose **Teacher access → Continue with Google**, and use an approved account. Publish a small board photo. Then open the library in a private window without signing in: the lesson and image should load, while publishing/deleting must require teacher access.

Also test Google sign-in with a different account; it must be denied teacher access. Teacher sessions last five days. Sign-out is available on desktop and mobile.

`firebase:check` checks Firebase Admin access, Google provider configuration, authorized domains, and Cloudinary credentials without printing secrets. A successful build alone does not test live OAuth or live uploads.

## 5. Deploy your folder to Vercel

1. Push the project to your GitHub repository and import it into [Vercel](https://vercel.com/new).
2. Choose the **Next.js** preset and Node.js **24.x**.
3. Add the **11 environment variables** from `.env.example`: four public Firebase values, three Firebase server credentials, the teacher email list, and three Cloudinary values.
4. Deploy. Add the exact resulting hostname, e.g. `notehub-school.vercel.app`, to Firebase Authentication's authorized domains.
5. Repeat the teacher/student test on the deployed site.

Environment changes require a redeploy. Public Firebase values are embedded during the build. Keep Vercel within the free plan's limits and eligibility requirements; do not add paid services automatically.

## How photo access works

The Next.js server checks teacher Google identity and the approved email list before accepting images. It uploads through Cloudinary's authenticated API and stores an ownership receipt in Firestore. Lesson publication checks those receipts atomically, rejects other teachers' uploads, and prevents a photo being reused by two lessons. Cloudinary secrets never reach students.

Photos and lesson text are public to people with their URLs. This setup does not restrict reading to enrolled students. Bookmarks stay in the student's browser. Interrupted uploads can leave unused Cloudinary images and upload receipts; clean them up if needed. Deleting a lesson requests image deletion and CDN invalidation, but does not erase copies already downloaded elsewhere.

## Maintain the Firebase rules

The supplied rules deny direct access to all Firestore collections, including upload receipts. The server uses Firebase Admin and checks authorization itself. Deploy changes to this dedicated project with:

```sh
npx -y firebase-tools@latest deploy --only firestore --project notehub-classroom-pj2026
```

`storage.rules` is an unused historical reference. `firebase.json` does not deploy Firebase Storage. Do not run a Storage deployment or enable Blaze for this version.

## Troubleshooting

| Problem | Check |
| --- | --- |
| Example classroom still appears | Complete all 11 variables, then restart or redeploy. |
| Google popup closes or reports unauthorized domain | Use localhost for local testing; add the exact deployment hostname to Firebase Auth settings; allow sign-in pop-ups. |
| Account has no teacher access | Use a verified Google email included in `TEACHER_EMAIL`. |
| Publishing or deleting fails | Run `npm run firebase:check`; check admin credentials and Cloudinary usage. |
| Photo is rejected when publishing | Upload it again. Each photo can only be attached once by its uploader. |
| Cloudinary usage limit reached | Keep the account on Free; review usage and delete unused photos. |
| Firebase asks for a credit card | You are in Firebase Storage or a billing upgrade. This app does not use either. |

Official references: [Cloudinary Free](https://cloudinary.com/documentation/developer_onboarding_faq_free_plan), [authenticated uploads](https://cloudinary.com/documentation/upload_images), [Firebase Admin setup](https://firebase.google.com/docs/admin/setup), [Google sign-in](https://firebase.google.com/docs/auth/web/google-signin).
