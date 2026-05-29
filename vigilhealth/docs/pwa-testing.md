# PWA Testing Guide — VigilHealth

## 1. PWA Installability Checklist

For the browser to show the "Add to Home Screen" / install prompt, all of the following must be true:

- [ ] **HTTPS** (or `localhost` for development)
- [ ] **Valid `manifest.json`** linked in `<head>` via `<link rel="manifest" href="/manifest.json">`
- [ ] **Service worker registered** and active
- [ ] **Icon at 192×192** present and reachable
- [ ] **Icon at 512×512** present and reachable
- [ ] **`start_url`** responds with HTTP 200
- [ ] **`display`** set to `standalone`, `fullscreen`, or `minimal-ui`

> The `manifest.json` is already linked via Next.js `metadata.manifest` in `app/layout.tsx`.

---

## 2. Testing on Android (Chrome)

### DevTools Audit

1. Open the app in Chrome on desktop (or use remote debugging for a real device).
2. Open **DevTools** → **Application** tab.
3. **Manifest** section — verify all fields are parsed correctly; fix any reported errors.
4. **Service Workers** section — confirm the service worker is registered and shows "activated and running".
5. **Storage** → **IndexedDB** — after using the app offline, verify `vigilhealth-offline` database and its stores appear.

### Lighthouse PWA Audit

1. DevTools → **Lighthouse** tab.
2. Select **Progressive Web App** category.
3. Run audit — target score: **100**.
4. Address any failing audits (missing icons, non-HTTPS, missing `theme-color`, etc.).

### Install Prompt

- In Chrome on Android, look for the **"Add to Home Screen"** banner or the install icon in the address bar.
- Alternatively, tap the Chrome menu (⋮) → **Add to Home screen**.

### Offline Testing

1. In DevTools → **Network** tab, set throttling to **Offline**.
2. Navigate to `/risk-radar` — cached data should load.
3. Navigate to `/offline` — the offline fallback page should appear for uncached routes.
4. Re-enable network and verify queued actions sync automatically.

---

## 3. Testing on iOS (Safari)

### Install

1. Open the app in **Safari** on iOS (Chrome on iOS does not support PWA install).
2. Tap the **Share** button (box with arrow).
3. Tap **"Add to Home Screen"**.
4. Verify the icon and app name (`VigilHealth`) appear correctly on the home screen.
5. Launch from the home screen — it should open in standalone mode (no Safari UI chrome).

### iOS Limitations

> **Important**: iOS Safari has significant PWA limitations compared to Android Chrome.

| Feature | Android Chrome | iOS Safari |
|---|---|---|
| Background Sync API | ✅ Supported | ❌ Not supported |
| Web Push Notifications | ✅ Supported | ⚠️ iOS 16.4+ only (requires user permission) |
| Service Worker Scope | ✅ Full | ✅ Full |
| IndexedDB | ✅ Full | ✅ Full |
| Offline caching | ✅ Full | ✅ Full |
| Install prompt | ✅ Automatic | ❌ Manual (Share → Add to Home Screen) |

**Mitigation for Background Sync on iOS**: The `setupOfflineSync()` function in `lib/offline/sync.ts`
registers a `window.addEventListener('online', ...)` listener as a fallback. When the user returns
online, the sync queue is flushed manually — this covers iOS where the Background Sync API is absent.

---

## 4. Generating PWA Icons

See [`scripts/generate-icons.md`](../scripts/generate-icons.md) for full instructions.

**Quick summary**:

1. Use https://www.pwabuilder.com/imageGenerator or https://realfavicongenerator.net
2. Upload a 512×512 (or larger) source image
3. Download and place PNGs in `public/icons/`:

```
public/icons/
  icon-72x72.png
  icon-96x96.png
  icon-128x128.png
  icon-144x144.png
  icon-152x152.png
  icon-192x192.png
  icon-384x384.png
  icon-512x512.png
```

4. Ensure maskable icons have the logo within the central 80% of the canvas.

---

## 5. Lighthouse PWA Score Targets

| Category | Target |
|---|---|
| PWA | 100 |
| Performance | ≥ 90 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | ≥ 90 |

### Common PWA Audit Failures and Fixes

| Audit | Fix |
|---|---|
| Does not register a service worker | Ensure `next-pwa` is enabled (not disabled in production) |
| Web app manifest does not meet installability requirements | Check icon sizes (192 and 512 required), `start_url`, `display` |
| Is not configured for a custom splash screen | Add `background_color` and `theme_color` to manifest (already done) |
| Does not redirect HTTP to HTTPS | Configure at hosting level (Vercel does this automatically) |
| `start_url` does not respond with a 200 when offline | Ensure the root route is cached by the service worker |
