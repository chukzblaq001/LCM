# LEARN CHEM — Free Offline Chemistry Learning App

A beginner-friendly Chemistry learning PWA built with plain HTML, CSS and JavaScript. No framework, paid API, account, subscription or backend is required.

## Included
- Responsive layout for Android phones and Windows computers
- Curriculum roadmap from JSS 1 through University 400
- Detailed starter lessons with explanations, formulae and diagrams
- Topic quizzes with answers and explanations
- Quick mixed quiz
- Search and level filters
- Local progress, best score and bookmarks using `localStorage`
- PWA manifest, app icon and service worker for offline caching
- Installable experience on supported Android and desktop browsers

## Important content note
The roadmap spans all requested levels, but the first build contains a starter set of fully written detailed lessons and questions. A roadmap topic is not automatically a completed lesson. Expand the lesson bank progressively and review content against current NERDC, WAEC, NECO, JAMB and university syllabuses before describing it as comprehensive exam preparation. University curricula vary by institution.

## Run on Windows
1. Extract the ZIP file.
2. Open the `LEARN_CHEM` folder in VS Code.
3. Install the free **Live Server** extension if you do not already have it.
4. Open `index.html`, right-click and select **Open with Live Server**.
5. Try opening a lesson, saving a bookmark and submitting a quiz.

Do not double-click `index.html` to test PWA installation. Service workers require HTTPS or localhost.

## Install on Windows
1. Publish the folder to a free HTTPS host such as GitHub Pages, or run it locally through Live Server for testing.
2. Open the HTTPS website in Chrome or Edge.
3. Use the install icon in the address bar or browser menu → **Install LEARN CHEM** (wording varies).
4. Open it from the desktop or Start menu.

## Install on Android
1. Publish the folder to GitHub Pages or another HTTPS static host.
2. Open the website in Chrome on your phone while online.
3. Wait for the app to load fully once.
4. Tap Chrome's three-dot menu → **Install app** or **Add to Home screen**.
5. Open LEARN CHEM from the new icon.
6. Test it in airplane mode.

The first visit and initial cache require internet. After the app files have been cached, the lessons, quizzes and saved progress work offline. Progress is stored separately in each browser/device and does not sync between phone and computer.

## Files
- `index.html` — page structure
- `styles.css` — responsive design
- `app.js` — lesson interactions, quizzes, diagrams, progress and bookmarks
- `curriculum-data.js` — JSS 1 to University 400 curriculum roadmap
- `manifest.json` — installable app metadata
- `service-worker.js` — offline cache
- `icon.svg` — app icon

## Add a lesson
Open `app.js` and add a lesson object to `window.LEARNCHEM_LESSONS` in the separate lesson data section (currently at the top of `app.js`). Use a unique `id`, one of the curriculum `level` names, a `title`, `summary`, `sections`, `formula`, `diagram`, and `quiz` array.

Each quiz question has this structure:
```js
[
  "Question text?",
  ["Option A", "Option B", "Option C", "Option D"],
  1,
  "Explanation of why option B is correct."
]
```
The answer index starts at zero. For example, `0` is the first option and `1` is the second.

## Offline and privacy
- No login or internet connection is needed for the learning features after initial caching.
- Progress is stored in browser local storage on that device only. Clearing site data can erase it.
- The app does not collect learner data or send progress to a server.
- The starter does not include a cloud AI tutor, user accounts, school groups or synced leaderboards.
- Increment `CACHE_NAME` in `service-worker.js` whenever you publish updated app files.
- The Google Fonts import is optional online decoration; the app uses fallback fonts if unavailable. For a strict fully self-contained build, remove the `@import` line from `styles.css`.


## Expanded learning pack and offline tutor

This upgraded build includes 18 additional detailed lessons (with explanations, key terms, revision points, selected worked examples and extra quiz questions) and an offline topic-aware Chemistry study tutor. The tutor searches the bundled explanations and provides prepared concept explanations. It is **not** a live generative AI model and does not send questions to an external service.

To add a true conversational AI later, connect a server-side endpoint (for example, a secure serverless function) and keep the provider API key on that server. Never place an API key in `app.js`, HTML, or any public GitHub repository. A live AI service requires internet and may have usage costs; the local tutor continues to work offline.

After replacing files on GitHub Pages, reload the site once while online so the updated service worker can download the new cache. If an older version remains, close the installed app and refresh the website; on desktop Chrome you can also clear the site's cached data.


## Expanded curriculum library (v3)

The curriculum roadmap now opens a lesson for every listed topic from JSS 1 to University 400. Every topic page includes a guided explanation, worked example, key terms, revision checklist and 30 practice questions with answer feedback. Existing authored lessons are preserved. For topics that did not yet have a fully authored lesson, the app creates a structured study guide from a subject-area knowledge pack; these generated guides are useful learning scaffolds and should be reviewed by a Chemistry teacher before being treated as a final textbook or examination authority. The 30-question sets for these generated topics are practice checks, not official past questions.

### Curriculum alignment

The Nigerian NERDC e-Curriculum portal lists JSS 1–3 and SSS 1–3 levels. The WAEC and JAMB examination syllabuses provide additional senior-secondary/examination coverage. University 100–400 content is a broad undergraduate Chemistry pathway; course titles, depth and year placement differ among Nigerian universities and degree programmes. Teachers and learners should compare the relevant course outline for their institution.

Reference starting points:
- NERDC e-Curriculum: https://www.nerdc.org.ng/CurriculumView.aspx
- NERDC Senior Secondary Curriculum: https://www.nerdc.gov.ng/content_manager/new_senior_curriculum_home.html
- WAEC Chemistry syllabus overview: https://myschool.ng/classroom/waec-syllabus/chemistry
- JAMB syllabus explorer: https://www.campusai.com.ng/syllabus

After replacing files, refresh the browser. The service-worker cache has been updated to v3 so the new content can be fetched.

## LEARN CHEM 2.0 upgrades

This package now includes additional offline learning tools:

- Student dashboard with quiz average, activity streak, saved topics, a weekly quiz goal and low-scoring topic reminders.
- Virtual lab models for pH, reaction-rate factors, separation methods and electrolysis concepts. These are learning simulations, not real laboratory measurements.
- Element explorer with 26 selected common elements, plus interactive atom, water molecule, ionic-bonding and electrolysis diagrams.
- Timed mixed-topic CBT practice using questions already included in the app. These are practice questions, not official JAMB, WAEC or NECO past papers.
- Flashcards generated from lesson headings and explanations.
- Existing offline lesson library, tutor, bookmarks, quiz scores and local progress remain in place.

### Updating an existing GitHub Pages copy

1. Make a backup of your current project folder.
2. Extract this ZIP file.
3. Copy all files from the extracted `LEARN_CHEM` folder into your existing GitHub repository folder.
4. Replace files when Windows asks. Make sure the new `feature-upgrades.js` is included.
5. Commit and push the changes to GitHub.
6. Open your GitHub Pages website and refresh it. If the old version remains, close the installed app/browser tab and reopen the website after the service worker updates.

The new `feature-upgrades.js` file must stay beside `index.html`, `app.js` and `styles.css`. Do not upload it into a separate subfolder.

### Offline tutor and privacy

The built-in tutor remains a local topic-aware helper. It does not call ChatGPT or another online AI service. No API key is required. Progress and quiz results are stored in the browser on the current device and are not automatically synchronised between devices.


## LEARN CHEM 3.0 — Optional cloud accounts, schools and online AI

The offline app remains intact. The cloud layer requires internet and your own Supabase project.

### Included
- Email/password student accounts. All new accounts start as students.
- Teacher access is granted manually by the project administrator after verification.
- Teacher-created school groups with join codes and student membership.
- Teacher roster view with completed-topic counts for group members.
- Manual two-way merge sync of completed/bookmarked topic IDs (quiz score history is not yet synced).
- Protected online AI Chemistry Tutor through a Supabase Edge Function.
- Example limit of 30 AI questions per user per day.

### Costs and security
- Supabase free-tier limits can change.
- OpenAI API usage is separate from a ChatGPT subscription and may cost money. Set provider-side budgets/limits before enabling it.
- Never put an OpenAI API key or Supabase service-role key in `cloud-config.js`, browser code, or GitHub. Store them as Supabase Edge Function secrets.
- The Supabase URL and publishable/anon key are public client settings; Row Level Security protects the database.
- The sync feature uploads completed/bookmarked topic IDs only; it does not yet sync every quiz answer, streak or setting.
- Use school groups with appropriate school/guardian permission and avoid collecting unnecessary data from minors.

### 1. Create Supabase project
1. Visit https://supabase.com and create a project.
2. Open Project Settings → API (or API Keys).
3. Copy the Project URL and publishable key (or legacy anon public key).
4. Replace placeholders in `cloud-config.js`. Never use the service-role/secret key here.

### 2. Create database tables and security rules
1. Open Supabase → SQL Editor → New query.
2. Open `supabase/migrations/001_learnchem_cloud.sql` in VS Code, copy all its contents into SQL Editor, and run it.
3. Confirm tables `profiles`, `school_groups`, `group_members`, `learner_progress`, and `ai_usage` exist.

### 3. Enable email login
1. Open Authentication → Providers → Email and enable email/password.
2. Set Site URL and allowed redirect URLs to your GitHub Pages URL.
3. Email confirmation may be enabled; users must confirm their email if required.

### 4. Promote a verified teacher
The teacher must first register as a normal student. Verify the teacher, then run this in SQL Editor after replacing the email:

```sql
update public.profiles set role='teacher'
where id=(select id from auth.users where email='teacher@example.com');
```

Do not allow public registration to select teacher privileges.

### 5. Deploy online AI tutor (optional)
Requires Supabase CLI and an OpenAI API key. See https://supabase.com/docs/guides/cli for CLI installation. From the project folder:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set OPENAI_API_KEY=your_openai_api_key
supabase secrets set OPENAI_MODEL=gpt-6-astra
supabase functions deploy chemistry-tutor
```

Supabase provides its project URL/anon/service-role environment values to deployed functions. If your environment does not expose the names used by the function, set them as Edge Function secrets from the dashboard. Never share the service-role key. Check OpenAI API billing and configure a conservative spend limit. The example function also limits each user to 30 requests daily.

### 6. Publish
Keep `cloud-learning.js`, `cloud-config.js`, and `cloud-learning.css` beside `index.html`. Keep the `supabase` folder in your GitHub repository as source backup; the static website does not execute that folder directly. Commit/push the files, visit the site online, and test account creation, sign-in, teacher group creation, student join, progress sync, and (only after deployment) AI tutor.

### Offline behaviour
Without internet, account/group/sync/online AI features pause. Offline lessons, offline tutor, quizzes, periodic table, lab simulations, CBT and flashcards continue working. Local progress is not deleted by signing out.

### Troubleshooting
- **Setup required:** Check the Project URL and publishable key in `cloud-config.js`, then redeploy.
- **Permission denied:** Run the SQL migration and verify teacher role promotion.
- **Join code invalid:** Ask the teacher for the current code.
- **AI tutor unavailable:** Check Edge Function deployment, secrets, sign-in and OpenAI billing; inspect Supabase function logs.
- **Old version remains:** Close the installed app and refresh the website online to update the service worker.


## LEARN CHEM 3.1 — Student sign-in and class-personalised Learning Centre

The Learning Centre now provides a more visible account area and class selector.

- Student registration asks for a name, email, password (minimum 8 characters) and class.
- Supported classes: JSS 1–3, SS 1–3, and University 100–400.
- Sign-in restores the class saved in the learner's Supabase profile.
- The selected class filters the lesson library, curriculum roadmap, quick quiz and offline tutor's lesson search.
- Students can change class later. Existing local lesson completion, bookmarks and quiz history are not erased.
- The selected class is saved locally for offline use. Saving it to the Supabase profile requires internet and a signed-in account.
- Existing lessons remain available offline after the app has cached successfully. Account creation, sign-in, cloud class saving, school groups, progress sync and online AI require internet.

### One-time database update for existing Supabase projects

Because LEARN CHEM 3.0's original `profiles` table did not contain a class field, run the new migration once:

1. Open your Supabase project → SQL Editor → New query.
2. Open `supabase/migrations/002_learner_class.sql` from this project.
3. Copy the complete SQL into the editor and click Run.
4. Confirm `profiles` now contains a `class_level` column.

Do not rerun the original 001 migration to apply this feature. Migration 002 is designed to be safe to run more than once.

### Supabase browser settings

Open `cloud-config.js` and make sure it contains your own Supabase Project URL and publishable (or legacy anon public) key. The ZIP intentionally does not contain private credentials. Never use a service-role key in browser code.

In Supabase → Authentication → URL Configuration, set the Site URL to your published LEARN CHEM address and add that address plus `/**` to the allowed redirect URLs. Email confirmation settings depend on your preference; if confirmation is enabled, learners must confirm their email before they can sign in.

### Publish the update

1. Back up your current LEARN CHEM folder.
2. Extract this ZIP and copy the contents of `LEARN_CHEM` into your GitHub repository folder, replacing older files.
3. Re-enter your Supabase URL and publishable key in `cloud-config.js` if the placeholders are present.
4. Run migration 002 in Supabase.
5. Commit and push the updated files to GitHub Pages.
6. Open the website once while online and allow the service worker to update. The cache name was increased to `learnchem-v6`.

### Class content note

The app filters the existing roadmap and lesson bank by the learner's selected class. The ZIP's roadmap is broader than the authored lesson bank; where a topic has no authored lesson, the app uses its structured topic guide. Review generated topic guides with a Chemistry teacher and compare senior-secondary and university material with the learner's current syllabus.


## LEARN CHEM 3.2 Multi-page interface
See `README_3_2_MULTIPAGE.txt`. The new dashboard, Learning Centre, Exams & CBT, Tutor, Progress, School Groups and Profile pages are separate HTML files. The previous single-page app is retained as `legacy.html`.


## Curriculum and exam practice (3.3)
The app now loads curriculum-content.js after curriculum-data.js. Do not remove or rename either file. Every roadmap topic receives a structured lesson and 40 practice questions. Topic quizzes use all 40 questions. Exams & CBT offers separate 40-question JAMB, WAEC and NECO practice sessions. The practice banks are original syllabus-aligned questions, not official past papers.
