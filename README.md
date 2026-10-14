# Moklu

**Beautiful mockups, made simple.**

Moklu is an open-source screenshot and mockup studio. Start with a quick, editable design for a browser or device screenshot, then fine-tune every layer in a Konva-powered advanced editor.

> **Status:** v0.1.0 development preview. The upstream engine is integrated; browser mockups and quick layout controls are early features pending CI and hands-on testing.

## Quick start

Requires Node.js 22+ and npm.

```bash
npm ci
npm run dev
```

Open the Vite URL printed in your terminal (normally `http://localhost:5173`).

1. Select **Quick Design** from the toolbar.
2. Choose a canvas ratio, theme and browser/device frame. Applying a new theme retains the main screenshot.
3. Click the mockup layer and upload your screenshot in the right properties panel.
4. Use **PNG** in the toolbar to export the active canvas at its original dimensions.
5. Use the existing **Templates** and editing controls for multi-slide App Store layouts.

## Features inherited from PixelDeck

Layer-based canvas editing, draggable SVG device frames, text and shapes, project persistence, reusable templates, multiple canvases, localized content, multi-format exports, and a Playwright-based CLI.

## Architecture

React 19 + TypeScript + Vite 8 + Konva 10 + Zustand. All basic editing works locally in your browser. No account or backend is required for the first release.

## Original project and license

Moklu is based on **[PixelDeck](https://github.com/Pr0xS/PixelDeck)** by PixelDeck contributors, licensed under MIT. The repository retains PixelDeck's original `LICENSE` file and copyright notice. New Moklu browser art and quick workflow are original additions.

[Screenshot Studio](https://github.com/opennookorg/screenshot-studio) and [Shots.so](https://shots.so) serve as workflow inspiration; this repository does not include their code.

## Development

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Roadmap

- **v0.1:** browser/device mockups, quick templates, common aspect ratios, local PNG export, editable source
- **v0.2:** template slots and flexible screenshot replacement, project/format separation
- **v0.3:** extended browser chrome, export profiles, shareable presets
- **Later:** perspective rendering and optional cloud capabilities

Website: [moklu.app](https://moklu.app) (planned).
