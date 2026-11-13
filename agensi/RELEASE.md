# Release checklist

npm uses Trusted Publishing (OIDC), no token needed.

1. Bump `version` in package.json and merge to main. The `publish` workflow publishes it if that version is not on npm yet.
   Manual run: Actions -> publish -> Run workflow.
2. If your npm account has staged publishing on, approve the release at npmjs.com -> Staged Packages.
3. Verify: `npx rules-bench@latest --help`
4. Agensi: upload `dist/context-cost-audit.zip` at agensi.io/dashboard/submit using `agensi/LISTING.md` (first release or skill changes only).
