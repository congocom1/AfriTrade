# Deployment — October 17, 2026

Target app: `6ab43a1371d65d1a911b0fe7`.
Hosted origin: `https://afritrade-1.base44.app`.

## Completed

- Deployed the refund safety guard first.
- Pushed 71 entity schemas from an isolated directory that preserved the
  downloaded remote-only PlatformSecret schema. No deletions were reported.
  The main workspace still lacks that schema: do not perform a full entity sync
  from it without preserving remote-only schemas again.
- Deployed all 48 local functions without `--force`: 9 deployed, 39 unchanged.
  Remote-only functions were retained. Subsequent listing returned 54 functions,
  including settle-wallet-payout.
- Built with Base44 app-ID injection and deployed the site successfully.
- Hosted homepage returned HTTP 200; its entry asset matched the local build.

## Verification limitations

All five hosted public-page smoke tests failed at their title assertions:
the hosted titles contain Congo Commerce rather than AfriTrade (including
Discover, Cart, Legal and About). The homepage snapshot includes AfriTrade
branding. Tests were not weakened to mask this discrepancy. Deployment succeeded;
hosted acceptance checks have not passed.

Refunds remain disabled with HTTP 503. Hosted wallet CAS semantics and financial
end-to-end behavior remain unverified; public-page checks do not establish them.
No live financial test transactions were initiated.

The unintended app `6ad35f967cfc0088309e830b` created by the earlier eject command
has not been deleted. It is separate from this deployment and needs cleanup.
No git push or hosted CI publication was performed.