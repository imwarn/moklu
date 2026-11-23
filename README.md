# Moklu

**Beautiful mockups, made simple.**

Moklu is an open-source screenshot and mockup studio. Start with a quick, editable design for a browser or device screenshot, then fine-tune every layer in a Konva-powered advanced editor.

> **Status:** active pre-1.0 development. v0.1–v0.8 milestones are merged into main; v0.9 JSON import hardening is under review. This project is **not yet certified as commercial-release ready**. See the [development plan](./docs/development-plan.md) and [benchmark plan](./docs/benchmark-plan.md).

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

## v0.9 project and template import safeguards

Project/Template JSON is size-bounded and checked for layer structure, unsafe URI schemes, oversized images, excessive nesting, duplicate canvas-layer IDs and unsupported schema versions before being imported. Projects are staged under new IDs and failures trigger best-effort restoration of the previous active project. Low-level storage failures may still require manual recovery; this is **not** a security certification or a fully atomic database transaction.

## Engineering roadmap & benchmarks

- [Development plan: v0.1 → v1.0 commercial release](./docs/development-plan.md)
- [Benchmark plan and reproducible measurement criteria](./docs/benchmark-plan.md)
- [Release checklist](./docs/release-checklist.md)
- [Engineering docs index](./docs/README.md)

### Screenshot framing (v0.8)

Quick Design supports 9:16 Story and **Cover**, **Contain**, **Stretch** screenshot framing, consistent between the lightweight preview and editable output. Cover crops to fill the screen, Contain shows the entire image (possibly with letterboxing), and Stretch fills without cropping (may distort the image).

## Development

```bash
npm run lint
npm run typecheck
npm test
npm run build

# Optional CPU-only microbenchmarks; NOT a substitute for browser E2E
npm run bench:core
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

## v0.7 live mockup preview

Quick Design now renders a responsive preview **before** applying a design. The preview reacts to screenshot uploads, frame choice, background styles and canvas dimensions. It reads the exact same mockup specifications and SVG artwork as the Konva editor and reuses the existing uploaded image where available. Preview geometry does not mutate your editable project; the final editor and PNG export remain the source of truth for effects, text and pixel-accurate output.

## v0.6 quick-start UX

Quick Design now accepts **drag and drop** screenshots as well as normal file selection. The selected file gets a local, disposable thumbnail preview and immediate format/size validation before applying. Existing screenshots are explicitly recognized and retained. The responsive dialog scrolls when the screen is short; users can create a blank mockup without uploading an image. The editor still handles final layout adjustments and PNG export. Files and previews are handled locally in the browser, without uploading to a server.

## v0.5 browser frame customization

Browser mockups can now display an editable window title, address label, light/dark appearance, and a show/hide address toggle directly in device properties. The SVG chrome is hollow over the screenshot viewport, rather than an opaque overlay. Window text is XML-escaped before conversion to an SVG image and is never used to fetch or navigate to a web address. Existing projects with no browser options keep sensible defaults. Chrome, Safari and Minimal remain interchangeable without affecting the uploaded screenshot.

## Roadmap

The **maintained roadmap** is in [docs/development-plan.md](./docs/development-plan.md). Historical milestones v0.1–v0.8 are merged; current priorities are framing fidelity, data import safety, end-to-end export verification and GA release engineering.

Website: [moklu.tech](https://moklu.tech).
