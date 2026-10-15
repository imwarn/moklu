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

## v0.2 screenshot-first workflow

- The toolbar's **Replace Screenshot** button updates the primary screenshot slot without changing the existing frame, background, text or artboard.
- The **Templates** gallery now offers **Use on current canvas** as well as the original **Add slides to project** action. The first suitable template slide is scaled to the active artboard, and the primary screenshot is rebound to the imported style.
- In the gallery, applying a style can replace text and decorations; use **Canvas Size** for non-destructive aspect-ratio adjustments.
- Screenshot uploads use distinct asset IDs so two images named `screenshot.png` do not overwrite each other in project storage.
- Template slots are an optional field on editable phone layers (`primary-screenshot` / `secondary-screenshot`), allowing backward-compatible template JSON and future multi-slot workflows.

## v0.4 granular style transfer

With **Style only · keep content** selected in Templates, individually enable or disable **Background**, **Frame effects**, and **Text style**. Unticked categories keep their existing style properties. At least one category must be selected. No option ever replaces the uploaded screenshot, any user-defined text, or artwork geometry.

## v0.3 template appearance options

The Templates gallery offers two deliberate ways to apply a style to an existing canvas:

- **Use template layout** (the original v0.2 behavior): recompose the active slide using the selected template and keep its main screenshot.
- **Style only · keep content**: copy the template background colors, frame shadow/border and text typography while preserving every existing screenshot, text string, image, group, position and layer ID.

The original **+ Add slides to project** still works. Style-only does not change canvas dimensions or source device model, and does not remove user-uploaded background images.

## v0.5 browser frame customization

Browser mockups can now display an editable window title, address label, light/dark appearance, and a show/hide address toggle directly in device properties. The SVG chrome is hollow over the screenshot viewport, rather than an opaque overlay. Window text is XML-escaped before conversion to an SVG image and is never used to fetch or navigate to a web address. Existing projects with no browser options keep sensible defaults. Chrome, Safari and Minimal remain interchangeable without affecting the uploaded screenshot.

## Roadmap

- **v0.1:** browser/device mockups, quick templates, common aspect ratios, local PNG export, editable source
- **v0.2:** template slots and flexible screenshot replacement, project/format separation
- **v0.3:** extended browser chrome, export profiles, shareable presets
- **Later:** perspective rendering and optional cloud capabilities

Website: [moklu.app](https://moklu.app) (planned).
