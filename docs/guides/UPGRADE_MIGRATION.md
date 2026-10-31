# Upgrade & Migration Guide — AfriTrade

This guide covers dependency upgrades and asset migrations for the AfriTrade repository.

## Dependency upgrades

### Frontend (npm)

1. Check for outdated packages:

   ```bash
   npm outdated
   ```

2. Update one dependency at a time. Prefer patch/minor updates; major updates need a separate PR.

   ```bash
   npm install <pkg>@<version>
   ```

3. Regenerate the lockfile only when intentionally updating:

   ```bash
   npm install
   ```

4. Run the full check suite:

   ```bash
   npm run lint
   npm run typecheck
   npm test
   npm run build
   ```

### Flutter (pub)

1. Check for outdated packages:

   ```bash
   flutter pub outdated
   ```

2. Upgrade:

   ```bash
   flutter pub upgrade
   ```

3. Analyze and test:

   ```bash
   flutter analyze
   flutter test
   ```

Do not upgrade `flutter_secure_storage` beyond 10.x without verifying the Windows backend (`flutter_secure_storage_windows`) compiles on this machine — see the `dependency_overrides` note in `pubspec.yaml`.

## Asset migrations (images)

Product images live in `public/images/` as PNG sources. Responsive WebP variants are generated under `public/images/webp/`:

```bash
node scripts/optimize-images.js
```

The script produces 300/600/900/1200w WebP variants at quality 82, never upscaling above the source width.

### Committing WebP variants

WebP variants are generated artifacts but are committed so CDN/hosting can serve them directly:

```bash
git add public/images/webp/
git commit -m "feat: optimize images and add WebP variants

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

Keep the PNG sources in place — they are the master assets. Do not delete them.

## Breaking changes

| Area | What changed | Migration |
|------|--------------|-----------|
| ESLint | `settings.react.version = "detect"` | No action needed; removes React version mismatch warnings |
| Vite | `manualChunks` bundle splitting | No action needed; chunk names are internal |
| Security headers | Build-time HTML meta tags | No action needed; headers are embedded in output |

## Rollback

If a dependency upgrade breaks the build:

1. Revert `package.json` and `package-lock.json` for that dependency.
2. Run `npm ci` to restore the locked tree.
3. Re-run `npm run build` to confirm.
