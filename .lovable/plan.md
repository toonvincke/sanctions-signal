# Pre-launch check: backups, restore and function deployment (read-only findings)

No actions were taken. Nothing was changed, backed up, restored or deployed.

## 1. Backup status: what I can and cannot verify

- **I cannot see your backups myself.** No tool I have can read the backup list, so I can't confirm the newest backup time, how many backups there are, or whether a given backup is complete.
- What Lovable Cloud gives you, per its documentation:
  - One automatic backup of the whole database per day (structure and data, user accounts included).
  - Backups kept for about 14 days.
  - **No point-in-time recovery.** You can only go back to one of the daily snapshots, not to a chosen minute between them.
  - Files in storage are **not** included in backups.
- The last backup time you gave me was **5 November 2026, 01:07:33 UTC**. A newer daily one may exist now. Please check.

## 2. How to confirm it yourself

- Desktop and mobile: **More → Database → Manage → Backups**. Each row shows the snapshot time in UTC. Use the newest row as your restore point.
- To keep a copy you control before launch: **More → Database → Manage → Settings → Export project data → Export data → Database → Export → Start export**. You get a download link by email, and the file is also saved under **More → Storage**.
  - Limits: up to 15 GB database, 5 GB file, one export every 24 hours. The backend must be running.
  - The export includes the full database and user accounts (with password hashes). It does not include storage files, function code, secrets or sign-in provider settings.

## 3. Exact restore steps

1. Open **More → Database → Manage → Backups**.
2. Pick the snapshot you want and click **Restore to this backup**.
3. Confirm the dialog. The database is unavailable for a few minutes.

Before you restore, know that:
- It is **permanent**. Everything written after that snapshot is lost (new users, subscriptions, bookmarks, imports).
- The database structure goes back too, so newer migrations are undone and the app code may no longer match. After a restore, test the app and fix mismatches with a new migration.
- It restores this same project in place only. To test a restore without touching production, load the export into a separate project you own.

## 4. Does merging to GitHub main update the backend functions?

**No.** On Lovable Cloud, GitHub sync brings the code into the project but **never deploys backend functions**, and it **never applies migration files**. After a PR merges:
- Functions such as `sanctions-sync`, `intelligence-discover`, `candidate-review` and `assistant` keep running their previously deployed version until they are deployed from chat.
- New SQL migrations stay pending until they are applied from chat.
- The website changes appear in the preview, but the live site changes only when you publish.

## Suggested launch order (for when you're ready, not done now)

1. Check the newest backup time on the Backups page and send it to me.
2. Run a database export as an extra safety copy.
3. Apply the pending migrations one at a time from chat, checking data after each one.
4. Deploy the changed functions from chat and check that each one responds.
5. Publish the website with the subscription paywall, then test sign-up, payment and portal access with a real account.
