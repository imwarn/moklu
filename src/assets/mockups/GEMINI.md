# mockups/
> L2 | Parent: ../GEMINI.md

Device and browser mockup SVG frames, screen/status-bar geometry specs, and central frame-art registry consumed by `PhoneNode`, QuickDesign, and export pipelines.

## Member list
- `registry.ts`: Central `PhoneModel` frame-art and category registry (`getMockupCategory`, `getMockupSvg`, `MockupCategory`) mapping model IDs to static SVGs or dynamic browser chrome.
- `specs.ts`: Canonical device/browser geometry and status-bar metadata table (`PHONE_MODELS`, `getPhoneSpec`, `computePhoneFitScale`, `getModelForPlatform`, and per-device `PhoneModelSpec` constants).
- `browser.ts`: Hollow browser-window SVG generator (`renderBrowserFrame`, `escapeBrowserLabel`, `isBrowserModel`, `DEFAULT_BROWSER_CHROME`, `BrowserModel`, `BROWSER_CHROME_SVG`, `BROWSER_SAFARI_SVG`, `BROWSER_MINIMAL_SVG`) with XML-escaped title/address labels.
- `browser.test.ts`: Vitest suite verifying browser model predicates, XML label escaping, and Chrome/Safari/Minimal SVG rendering.
- `iphone-16-pro.ts`: iPhone 16 Pro (with Dynamic Island) masked vector bezel SVG (`IPHONE_16_PRO_SVG`, `390x844`).
- `iphone-16-pro-plain.ts`: iPhone 16 Pro (no Dynamic Island) masked vector bezel SVG (`IPHONE_16_PRO_PLAIN_SVG`, `390x844`).
- `pixel-9.ts`: Google Pixel 9 (with punch-hole camera) masked vector bezel SVG (`PIXEL_9_SVG`, `380x820`).
- `pixel-9-plain.ts`: Google Pixel 9 (no punch-hole camera) masked vector bezel SVG (`PIXEL_9_PLAIN_SVG`, `380x820`).
- `apple-watch.ts`: Apple Watch masked vector bezel SVG (`APPLE_WATCH_SVG`, `422x514`).
- `wear-os.ts`: Circular Wear OS watch masked vector bezel SVG (`WEAR_OS_SVG`, `480x480`).
- `ipad.ts`: iPad masked vector bezel SVG (`IPAD_SVG`, `420x560`).
- `android-tablet.ts`: Android tablet masked vector bezel SVG (`ANDROID_TABLET_SVG`, `400x640`).

[PROTOCOL]: Update this header on change, then check GEMINI.md
