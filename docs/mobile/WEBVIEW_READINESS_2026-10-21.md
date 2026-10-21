# AfriTrade React — WebView iOS/Android readiness

Updated 2026-10-21. Source-only UX improvements; no native iOS/Android build or live deployment performed.

## Implemented

- `overscroll-behavior-y: none` on document body and primary scroll containers; retained momentum scrolling for internal scrolling containers.
- Existing `viewport-fit=cover` retained. The TopBar has `env(safe-area-inset-top)`, the bottom navigation has `env(safe-area-inset-bottom)`, and the mobile drawer has safe-area bottom padding.
- At least 44px touch hit area for mobile coarse pointer buttons and explicit navigation controls; includes header menu button and 48px quantity steppers. Desktop density unchanged.
- `user-select: none` limited to actual buttons/role-buttons and explicit `.app-nav-item`/`.bottom-nav-item`; normal content links remain selectable.
- Mobile drawer supports Vaul bottom-sheet drag dismissal and right-edge horizontal swipe-to-open. Right edge avoids iOS system left-edge back. Menu button remains the accessible fallback.
- Framer Motion page transitions derive direction from browser history index on forward/back, with reduced-motion support. Query-only changes do not remount routes.
- Native JSX `<select>` elements replaced with Radix/shadcn Select primitives via `LegacySelect` compatibility adapter across the app. Adapter supports controlled and uncontrolled values, option groups, disabled and empty choices, and existing `onChange(event.target.value)` handlers.
- Top-of-page downward pull-to-refresh on Home, Search and Categories. Refresh waits for each feed's actual backend query completion, ignores horizontal swipes, does not run on desktop fine pointers, and retains existing retry/error handling.

## Release/QA gates not completed in this workspace

- Validate on actual WKWebView and Android System WebView devices: safe area on notched and home-indicator devices, scrolling within nested lists, keyboard focus, select portal positioning, on-screen keyboard, drawer gestures and navigation back/forward.
- Specifically check transformed forms using native HTML `required` constraints; the Radix compatibility adapter uses an explicit sentinel for empty choices rather than the native empty option value.
- Exercise WebView auth/login redirects, Base44 API availability, HTTPS/SSL, permissions, upload pickers, deep links, and payment-provider redirects before native app publishing.
- The production Base44 hostname last returned HTTP 503; this code work does not address hosting availability.
- The page-motion and pull gestures are tested by source contracts and pure gesture unit tests, not end-to-end on real hardware.
