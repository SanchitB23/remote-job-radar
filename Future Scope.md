# Remote Job Radar: Roadmap & Next Steps

## 🔜 Next Steps (High-Level)

### A. Core Feature Expansion

1. **Semantic Search & “Similar Jobs”**
   - Query jobs by free-text, using vectors (like “React engineer remote”).
   - Show “Similar jobs” button on a job card.
   - ✅ Uses pgvector & embedder you already have.
   - ⚡ _Suggested first: low effort, big visible value._

2. **Job Alerts / Notifications**
   - User sets cadence (daily/weekly) & channel (email/Telegram).
   - Cron job queries for new high-fit jobs → sends via SendGrid/SMTP.
   - ⚡ _High user value, but needs infra (cron, email service)._

3. **Resume Upload → Auto Skills**
   - Upload PDF → extract text → embed → suggest skills.
   - Store in resumes table, link to user_profile.
   - ✅ Future-proof; adds “wow” factor for personalization.
   - ⚠ _Requires file storage (Vercel Blob/S3/UploadThing)._

4. **Analytics Dashboard**
   - Show job trends: top companies, skills demand, salary ranges.
   - Great for portfolio/demo, not urgent for job-search UX.

---

### B. UX & Product Polish

1. **Kanban Board Improvements**
   - Notes per pipeline item, due dates/reminders.
   - Export to CSV/Notion.
   - Medium effort, good “workflow” appeal.

2. **UI/UX Enhancements**
   - Show “Personalized” badge, fit score indicator, better filters.
   - Switch skills textarea → nice chip input (shadcn/ui).
   - Add dark/light theming polish.
   - Quick wins for demo-readiness.

3. **User Profile Consolidation**
   - Keep Personalization, Notifications, Privacy inside Clerk’s avatar modal (already started).
   - Add “Delete my data” → cascades bookmarks, pipeline, skills.
   - Good hygiene & completeness.

---

### C. Infra & Scalability

1. **Deployment Hardening**
   - Health checks for all services (API, aggregator, embedder).
   - Logging & monitoring (Sentry, structured logs).
   - Rate limits on API.
   - Important for production readiness, less for demo.

2. **Search Performance Tuning**
   - Verify IVFFlat index usage, adjust probes.
   - Cap personalized queries to “last 30 days” jobs.
   - Needed only once dataset grows.

3. **Multi-tenancy / Teams (future scope)**
   - Users share pipelines (like Trello boards).
   - Out of scope now, but could be a later selling point.

---

## 🚦 Suggested Order (What to Do First)

1. **Semantic Search & Similar Jobs** ✅
   - Already 80% ready with your infra.
   - Super visible “wow” feature for a portfolio/demo.

2. **Resume Upload → Auto Skills** ⚡
   - Future-proofs personalization beyond manual skills.
   - Shows off AI integration & full-stack chops.

3. **Job Alerts (email/Telegram)**
   - Adds stickiness.
   - Nice for a demo: “Get an email when new React jobs match your profile.”

4. **Analytics Dashboard**
   - Visual candy for portfolio — graphs of jobs/skills/salaries.

5. **Polish** (UI chips, badges, Kanban notes/reminders).

6. **Infra** (logging, monitoring, health checks, scaling).

---
