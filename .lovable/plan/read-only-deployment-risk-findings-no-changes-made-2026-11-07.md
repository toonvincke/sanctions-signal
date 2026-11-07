# Read-only deployment risk findings (no changes made)

## Known facts (checked just now)
- The project's own code store is Lovable's internal repository. I cannot see which GitHub repository or branch it is synced with; that is only shown in Project settings → Git.
- The editor is on a working branch built from `fix/ss-021-nested-programme-rendering`, not `main`. Latest commit: `544e174`.
- Commit `c9da8cfb` (your GitHub main) **is not in this project**. So either the project is synced to another branch, or main's newer commits haven't arrived.
- Migrations in the code go up to 0011. 0007 is a duplicate of 0006.

## Not verified
- Whether `toonvincke/sanctions-signal` is the linked repository, and which branch is synced. Check this in **Project settings → Git**.

## What merging PR #42 or #43 into main would do
- **Editor preview:** changes only if `main` is the synced branch. Right now the evidence points to `fix/ss-021-...`, so most likely nothing changes.
- **Live site:** never changes automatically. Only Publish does that.
- **Backend functions:** on Lovable Cloud, Git sync never deploys them. They are deployed from chat.
- **SQL migrations:** never applied by sync. They are applied from chat.

## Before a safe rollout
1. In Project settings → Git, confirm the repository and the synced branch. Switch to `main`, or merge `main` into the synced branch.
2. Confirm that `c9da8cfb` (or the merge commit) shows up in the project.
3. Database: 0008–0011 are reported as applied and the Drizzle journal has 12 rows. Any new migration in #42 or #43 must start at 0012, and must be checked against the live database before it is applied.
4. Have a fresh backup and, if possible, an export before applying migrations.
5. Deploy changed functions one at a time from chat. Test each one, then publish.
