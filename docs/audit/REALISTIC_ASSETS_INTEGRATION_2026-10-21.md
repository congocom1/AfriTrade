# AfriTrade realistic imagery integration

The generated media ZIP is provided in the user's ChatGPT conversation as `afritrade-realistic-assets.zip`. The Base44 sandbox cannot directly read this conversation attachment, so the binary WebP assets have **not** been committed to the app. Do not report them as installed.

To install: download that ZIP to the computer running the AfriTrade repository and run `node scripts/install-realistic-assets.mjs /path/to/afritrade-realistic-assets.zip`; commit the eight generated files at `public/images/realistic/` and push/publish through the normal authorized workflow.

The homepage hero and electronics category now look for the curated files; if files are missing they use the previous bundled hero image. The logo concept is *not* automatically substituted for the established brand logo because it may contain inaccurate typography and requires brand review. Fashion, beauty, fulfillment, and delivery assets are staged for later use; product imagery from real sellers is left untouched.

Verification: full lint, typecheck, 318 Node tests, and Vite production build pass before and after the integration code changes. Actual public site remains HTTP 503; browser checks, payments and staging deployment still need verification. No production deployment was attempted.
