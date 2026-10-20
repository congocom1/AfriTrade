# Base44 repairs preserved for reconciliation

The Base44 app 6ab43a1371d65d1a911b0fe7 and this repository have diverged.
This complete source patch preserves all 117 changed files from sandbox baseline
4fe2ff4ab431a0a723dd9dcbf326c629bce6c09b through 6ca6b8d, including the
server and UI checkpoints. It is an archival migration artifact, NOT an active
replacement of this repository's backend. Do not blindly apply it to main.

GitHub already uses a separate receipt-based wallet protocol, cents-based
international shipping, new auth configuration, translations and visual redesign.
The sandbox's global CommerceControl singleton cannot be mixed with those writers.
Its singleton record ID also belongs to that specific Base44 app.

Compatible active changes ported here: cart storage validation and lazy initialization,
seller-wallet loading/error handling, accurate order payment states, mobile safe areas,
and removal of duplicated mobile Back buttons. The duplicate came from AppLayout
plus page-specific BackButton controls; checkout also had a third top link. Keep the
page-specific controls and only the bottom step-back control on mobile checkout.

All backend changes, dependencies and their 63 sandbox tests are preserved in the
patch for a separate deliberate protocol migration. Existing GitHub release gates
in docs/audit/WALLET_PROTOCOL.md remain authoritative. This sync does not claim
those archived backend changes are active, or that the app has been published.
