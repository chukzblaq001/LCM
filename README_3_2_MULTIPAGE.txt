LEARN CHEM 3.2 — MULTI-PAGE UPGRADE

Main pages:
- dashboard.html — personalised home dashboard
- learning-center.html — class selector and filtered lesson library
- exams.html — CBT practice from lesson quiz questions
- tutor.html — offline search tutor
- progress.html — completed lessons, bookmarks and quiz scores
- school.html — school group join/teacher tools (online)
- profile.html — class settings and Supabase sign up/sign in
- login.html — standalone account page
- legacy.html — previous full application retained as a fallback

Setup:
1. Keep cloud-config.js values from your existing Supabase project (Project URL and publishable/anon key only).
2. Run supabase/migrations/002_learner_class.sql in Supabase SQL Editor after migration 001.
3. Upload the contents of this folder to your GitHub Pages repository, replacing the old files.
4. Open https://chukzblaq001.github.io/LEARN-CHEM/ and hard-refresh once.

The new pages use the existing learnchem_progress_v1 local storage format and learnchem_class_level class key. Existing progress is not intentionally cleared. Lessons and quiz questions available in curriculum-data.js are shown by selected class. Cloud sign-in and school groups need internet; local lessons and progress work offline after caching.

Note: profile/login and school pages load cloud-learning.js; restore your existing Supabase URL and publishable key in cloud-config.js before using cloud accounts. Never put a service-role key or private AI API key in frontend code.


LEARN CHEM 3.3 — CURRICULUM & EXAM PREPARATION
- curriculum-content.js builds the full class-level lesson library from curriculum-data.js and preserves the authored starter lessons.
- Every listed topic has a structured lesson, key terms, formula/relationship notes, worked example, practical applications, revision checklist and 40 objective practice questions.
- The topic quiz now uses the full 40-question bank.
- Exams & CBT includes separate 40-question JAMB, WAEC and NECO practice sessions. These are original syllabus-aligned practice questions, not official past papers.
- JSS Chemistry concepts are taught within the NERDC Basic Science and Technology learning context; Chemistry is a separate Senior Secondary subject. University 100–400 are organised as standard university Chemistry foundations and are not presented as an NERDC university syllabus.
- For exact current exam requirements, use the latest JAMB IBASS syllabus and official WAEC/NECO notices.

See CURRICULUM_ALIGNMENT.md for official source links and the distinction between NERDC school curricula and undergraduate university Chemistry pathways.
