# Release checklist

1. npm: `npm login` → `npm publish --access public` (first release, from this folder).
   Later releases: bump `version` in package.json and merge to main (workflow publishes if that version is not on npm; needs repo secret `NPM_TOKEN`). Manual run: Actions → publish → Run workflow.
2. Verify: `npx rules-bench@latest --help`
3. Agensi: upload `dist/context-cost-audit.zip` at agensi.io/dashboard/submit using `agensi/LISTING.md`.
   Do this AFTER step 2, because the skill tells agents to run `npx rules-bench`.
