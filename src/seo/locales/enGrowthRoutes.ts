/**
 * [INPUT]: depends on GrowthRouteSlug and RouteCopy types from ../types.ts
 * [OUTPUT]: exports EN_GROWTH_ROUTES containing English SEO copy for the 7 high-intent growth slugs (ipad-mockup, watch-mockup, stitch-screenshots, heic-to-jpg, remove-exif, compress-image-to-200kb, redact-screenshot)
 * [POS]: growth route-copy chunk for en within src/seo/locales, merged into EN_LOCALE by ./en.ts to keep every file <= 800 lines
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { GrowthRouteSlug, RouteCopy } from '../types.ts'

export const EN_GROWTH_ROUTES: Record<GrowthRouteSlug, RouteCopy> = {
  'ipad-mockup': {
    navLabel: 'iPad Mockup',
    title: 'Free iPad Pro 13 Mockup Generator Online (Local) | Moklu',
    metaDescription:
      'Frame tablet apps, dashboards, and reading workflows inside an iPad Pro 13 or Android Tablet bezel with studio lighting and shadows. 100% browser-local, zero uploads.',
    badge: 'iPad Pro 13 & Tablet Frames',
    h1: 'iPad Pro 13 & Tablet Mockup Generator',
    subtitle:
      'Place iPadOS app screens, split-view dashboards, or digital planners inside a crisp iPad Pro 13 or Android Tablet bezel with balanced margins and zero server uploads.',
    steps: [
      {
        title: 'Drop or paste your tablet screenshot',
        description: 'Paste from clipboard with Cmd/Ctrl+V or drop an iPadOS simulator capture or Android tablet screenshot directly onto the canvas.',
      },
      {
        title: 'Pick iPad Pro 13 or Android Tablet framing',
        description: 'Switch between landscape and portrait ratios, adjust corner padding and drop shadows, and test Aurora, Midnight, or Warm Paper backdrops.',
      },
      {
        title: 'Download PNG or open in Studio',
        description: 'Export a crisp 2K PNG with zero watermarks, or hand off your framed iPad straight to Moklu Studio to add headlines and multi-device scenes.',
      },
    ],
    highlights: [
      {
        title: 'Accurate 13-Inch Tablet Proportions',
        description: 'Slim symmetrical bezels match modern iPad Pro 13 and Android tablet screens without awkward stretching or clipped navigation bars.',
      },
      {
        title: 'Built for App Store iPad Listings',
        description: 'Produce clean landscape 4:3 and widescreen product previews ready for App Store Connect tablet slots, pitch decks, and changelogs.',
      },
      {
        title: '100% Private Local Rendering',
        description: 'Unreleased tablet builds and internal BI dashboards render strictly inside browser memory with zero remote storage.',
      },
    ],
    faqs: [
      {
        question: 'Which tablet frames are available in the iPad Mockup generator?',
        answer: 'You can switch between the iPad Pro 13 bezel and an Android Tablet frame, plus 11 other browser, phone, watch, and frameless styles in the same workspace.',
      },
      {
        question: 'Does the iPad mockup support both landscape and portrait screenshots?',
        answer: 'Yes. Pick landscape 4:3 or 16:9 canvases for split-view iPad apps, or switch to portrait and square ratios for social feeds.',
      },
      {
        question: 'Can I pair an iPad frame with an iPhone or browser frame in one graphic?',
        answer: 'Yes. Click Open in Studio to place iPad, iPhone 16 Pro, and Chrome browser layers together on one multi-layer canvas.',
      },
      {
        question: 'Are iPad mockup exports free of watermarks?',
        answer: 'Yes. Standard high-resolution PNG exports are completely free and contain zero Moklu watermarks.',
      },
    ],
  },
  'watch-mockup': {
    navLabel: 'Watch Mockup',
    title: 'Free Apple Watch & Smartwatch Mockup Generator Online | Moklu',
    metaDescription:
      'Showcase watchOS and Wear OS fitness, widget, and companion screens inside crisp Apple Watch and Wear OS frames. 100% browser-local with zero watermarks.',
    badge: 'Apple Watch & Wear OS Frames',
    h1: 'Apple Watch & Smartwatch Mockup Generator',
    subtitle:
      'Frame watchOS complications, workout trackers, and Wear OS tiles inside crisp Apple Watch or round Wear OS bezels with soft studio backdrops, rendered locally in your browser.',
    steps: [
      {
        title: 'Load your watchOS or Wear OS screen',
        description: 'Drop a simulator capture or smartwatch screenshot into the square canvas, or preview immediately with the sample screen.',
      },
      {
        title: 'Switch between Apple Watch and Wear OS',
        description: 'Choose the rounded-rectangle Apple Watch case or circular Wear OS bezel, then dial in background gradients and drop shadow depth.',
      },
      {
        title: 'Export crisp PNG or compose in Studio',
        description: 'Download a clean square or vertical PNG immediately, or send the watch layer to Studio alongside your companion iPhone app.',
      },
    ],
    highlights: [
      {
        title: 'Apple Watch & Round Wear OS Ready',
        description: 'Purpose-built bezels preserve curved corners and circular watch dials cleanly without ragged pixel masks.',
      },
      {
        title: 'Companion App Showcase Workflow',
        description: 'Hand off your watch mockup into Moklu Studio to present an Apple Watch next to an iPhone 16 Pro on a single launch slide.',
      },
      {
        title: 'Instant Offline Canvas Rendering',
        description: 'Swap watch models, canvas ratios, and palettes at 60fps in browser RAM without uploading beta builds.',
      },
    ],
    faqs: [
      {
        question: 'Does Moklu include both Apple Watch and Wear OS frames?',
        answer: 'Yes. You can switch instantly between the Apple Watch frame and the circular Wear OS smartwatch frame inside the same mockup tool.',
      },
      {
        question: 'What canvas ratio works best for smartwatch screenshots?',
        answer: 'The default 1:1 square preset centers the watch bezel with generous studio breathing room for product cards, and 4:5 or 9:16 presets work well for social posts.',
      },
      {
        question: 'How do I show an Apple Watch beside an iPhone in one promo banner?',
        answer: 'Click Open in Studio to stage your watch frame onto the multi-layer Konva canvas and add an iPhone 16 Pro frame and headline right beside it.',
      },
      {
        question: 'Is there any upload wait or daily export limit for watch mockups?',
        answer: 'No. Everything renders locally in your browser tab with unlimited free PNG exports and zero server queues.',
      },
    ],
  },
  'stitch-screenshots': {
    navLabel: 'Stitch Screenshots',
    title: 'Stitch Scrolling Screenshots Online (Auto Remove Overlap) | Moklu',
    metaDescription:
      'Merge scrolling chat logs, long articles, and movie subtitles into one clean screenshot with automatic local overlap removal and ghost-overlay seam fine-tuning.',
    badge: 'Auto Overlap Removal & Seam Tuning',
    h1: 'Stitch Scrolling Screenshots with Smart Overlap Removal',
    subtitle:
      'Combine overlapping iMessage, Slack, WeChat, or web page captures into one seamless vertical image using 100% local pixel matching, fixed header/footer bar trimming, and ghost-overlay seam fine-tuning.',
    steps: [
      {
        title: 'Drop your scrolling screenshots in order',
        description: 'Select or paste consecutive screen captures from chat apps, articles, or video subtitles. Reorder thumbnails by drag-and-drop if needed.',
      },
      {
        title: 'Auto-detect overlap and tune seams',
        description: 'Local pixel matching trims repeated scroll lines and sticky top/bottom bars automatically; use the ghost-overlay slider to nudge any seam by the pixel.',
      },
      {
        title: 'Export lossless PNG, Copy, or open in Studio',
        description: 'Download a crisp long screenshot, copy directly to clipboard, or hand off individual layers to Moklu Studio for redaction and annotations.',
      },
    ],
    highlights: [
      {
        title: '100% Local Scroll-Overlap Deduplication',
        description: 'Detects duplicated lines between consecutive captures directly in browser memory so chat bubbles and paragraphs flow without repeats.',
      },
      {
        title: 'Fixed Header & Footer Bar Trimming',
        description: 'Automatically strips sticky app navigation bars, keyboard edges, and bottom tab bars that otherwise break long screenshots.',
      },
      {
        title: 'Interactive Ghost-Overlay Seam Control',
        description: 'Override any seam manually with a live translucent alignment preview when stitching subtle subtitles or low-contrast feeds.',
      },
    ],
    faqs: [
      {
        question: 'How is Stitch Screenshots different from Stitch Images Vertically?',
        answer: 'Stitch Screenshots starts with smart scroll-overlap removal and fixed top/bottom bar trimming enabled by default for scrolling UI captures, whereas Stitch Images Vertically defaults to clean edge-to-edge photo joining.',
      },
      {
        question: 'What if automatic overlap detection misses a subtle seam?',
        answer: 'You can open the seam fine-tuning control to adjust the exact pixel overlap with a live ghost overlay, or leave unmatched frames intact safely.',
      },
      {
        question: 'Can I stitch private Slack, WhatsApp, or banking chats safely?',
        answer: 'Yes. Both pixel-matching overlap detection and canvas rendering execute 100% locally in your browser with zero server uploads, and you can redact sensitive text right afterward.',
      },
      {
        question: 'What happens if my stitched long screenshot exceeds 8192px tall?',
        answer: 'Moklu enforces an 8192px / 64MP browser safety ceiling by proportionally scaling the output and displaying a clear notice so the tab never crashes.',
      },
    ],
  },
  'heic-to-jpg': {
    navLabel: 'HEIC to JPG',
    title: 'Convert HEIC & AVIF to JPG Online Free (100% Local) | Moklu',
    metaDescription:
      'Convert iPhone HEIC, HEIF, and AVIF photos to JPG, PNG, or WebP in batch right inside your browser. Native decode plus local WASM fallback, zero server uploads.',
    badge: 'Local HEIC / AVIF · Zero Uploads',
    h1: 'Convert iPhone HEIC & AVIF to JPG Locally',
    subtitle:
      'Turn Apple iPhone .heic, .heif, and modern .avif photos into universally compatible JPEG, PNG, or WebP files in batch without uploading a single personal photo to any cloud server.',
    steps: [
      {
        title: 'Drop iPhone HEIC, HEIF, or AVIF files',
        description: 'Select one or dozens of Apple HEIC or AVIF photos; Moklu detects HEIC headers automatically and queues them locally in memory.',
      },
      {
        title: 'Choose JPG, PNG, or WebP and quality',
        description: 'Keep the default high-compatibility JPEG preset, optionally set a max width or target KB cap, and strip sensitive EXIF metadata automatically.',
      },
      {
        title: 'Download individual files or 1-click ZIP',
        description: 'Inspect before/after byte sizes and save every converted photo directly from your browser with zero wait queues.',
      },
    ],
    highlights: [
      {
        title: 'Native First, Local WASM Fallback',
        description: 'Uses zero-overhead native decoding on Safari and automatically loads a local WebAssembly HEIC decoder in Chrome, Edge, and Firefox.',
      },
      {
        title: 'Private Family & Document Photos',
        description: 'Unlike online converters that upload iPhone camera rolls to remote buckets, every HEIC byte stays strictly inside your own device.',
      },
      {
        title: 'Batch Conversion Plus Size Control',
        description: 'Convert entire photo sets to JPG, PNG, or WebP at once and package everything into a single local ZIP download.',
      },
    ],
    faqs: [
      {
        question: 'How does Moklu convert HEIC to JPG in Chrome or Firefox without a server?',
        answer: 'Moklu tries native browser decoding first and seamlessly falls back to a local client-side WebAssembly HEIC decoder in Chromium and Firefox, so files never leave your computer.',
      },
      {
        question: 'Can I convert AVIF photos as well as iPhone HEIC and HEIF files?',
        answer: 'Yes. Drop .heic, .heif, .avif, PNG, or WebP images into the same batch and export them as JPEG, PNG, or WebP.',
      },
      {
        question: 'Are GPS location tags kept when converting HEIC to JPG?',
        answer: 'Re-encoding through HTML5 Canvas automatically strips GPS coordinates and camera EXIF metadata so your converted JPGs are clean to share.',
      },
      {
        question: 'Is there a daily file limit or maximum upload cap for HEIC conversion?',
        answer: 'There is no daily quota or account wall because all decoding runs on your own CPU and RAM rather than a remote server.',
      },
    ],
  },
  'remove-exif': {
    navLabel: 'Remove EXIF',
    title: 'Remove EXIF & GPS Metadata from Photos Locally | Moklu',
    metaDescription:
      'Inspect hidden GPS coordinates, camera model, lens, and timestamps inside JPEG, PNG, WebP, and HEIC files and strip all EXIF metadata 100% offline in your browser.',
    badge: 'EXIF & GPS Inspector · Offline Strip',
    h1: 'Inspect & Remove EXIF / GPS Data from Photos',
    subtitle:
      'Scan photos locally for hidden GPS latitude/longitude, camera model, software, and timestamps, then export clean metadata-free images before sharing online.',
    steps: [
      {
        title: 'Drop photos to inspect hidden metadata',
        description: 'Load JPEG, PNG, WebP, or HEIC images; Moklu parses binary EXIF and GPS tags in memory and flags any sensitive location or device fields.',
      },
      {
        title: 'Review detected GPS, camera, and date tags',
        description: 'See exact tag counts, GPS coordinates, camera make/model, exposure settings, and capture timestamps without uploading your file.',
      },
      {
        title: 'Export clean, metadata-free copies',
        description: 'Download single stripped photos or a batch ZIP re-encoded locally with zero EXIF, zero GPS, and zero watermarks.',
      },
    ],
    highlights: [
      {
        title: 'Zero-Dependency Binary EXIF Parser',
        description: 'Reads JPEG APP1, PNG eXIf, WebP EXIF, and HEIC EXIF headers directly via browser DataView before stripping them cleanly.',
      },
      {
        title: 'Privacy Safe for Marketplace & Social Posts',
        description: 'Stop accidental home-address leaks when posting secondhand listings, forum screenshots, or investigative photos.',
      },
      {
        title: 'Works Completely Offline',
        description: 'Disconnect Wi-Fi after loading the page and inspect or scrub sensitive photos with provable zero network activity.',
      },
    ],
    faqs: [
      {
        question: 'What sensitive metadata can Moklu detect and remove?',
        answer: 'The built-in binary inspector detects GPS latitude and longitude, camera make and model, editing software, capture date/time, ISO, aperture, shutter speed, and orientation tags, then strips all of them on export.',
      },
      {
        question: 'Which image formats are supported by the EXIF inspector and remover?',
        answer: 'Moklu inspects EXIF blocks inside JPEG, PNG, WebP, and HEIC/HEIF files and exports clean JPEG, WebP, or PNG copies without metadata.',
      },
      {
        question: 'Why should I use a browser-local EXIF remover instead of a cloud tool?',
        answer: 'Uploading a photo containing your home GPS coordinates to a third-party server exposes the very data you want to erase. Running locally guarantees the original file never leaves your device.',
      },
      {
        question: 'Does removing EXIF data rotate my vertical smartphone photos incorrectly?',
        answer: 'No. Browser decoding applies EXIF orientation pixels upright before re-encoding, so portrait photos stay upright after metadata is stripped.',
      },
    ],
  },
  'compress-image-to-200kb': {
    navLabel: 'Compress to 200KB',
    title: 'Compress Image to 200KB (or 100KB / 500KB) Online Free | Moklu',
    metaDescription:
      'Hit exact 100KB, 200KB, or 500KB portal upload limits using deterministic local binary-search compression. Zero uploads, live byte counters, and batch ZIP export.',
    badge: 'Exact Target-KB Compression · Local',
    h1: 'Compress Images to Exact 200KB Target Size',
    subtitle:
      'Meet strict job portal, visa, exam, and government photo limits (100KB, 200KB, 500KB, or custom KB) using local binary-search quality tuning with zero server uploads.',
    steps: [
      {
        title: 'Drop passport, ID, or application photos',
        description: 'Add one or multiple JPEG, PNG, WebP, or HEIC images that exceed your portal upload cap.',
      },
      {
        title: 'Pick 200KB, 100KB, 500KB, or custom target KB',
        description: 'Moklu runs a deterministic local binary search over encoder quality and optionally scales dimensions only if needed to fit under your limit.',
      },
      {
        title: 'Verify exact file size and download',
        description: 'Check the green target-met badge and before/after KB readout, then save individually or as a local ZIP.',
      },
    ],
    highlights: [
      {
        title: 'Deterministic Binary-Search Quality',
        description: 'Finds the highest visual quality that stays safely under 200KB instead of blindly crushing every photo to blurry low quality.',
      },
      {
        title: 'Optional Preserve-Dimensions Guard',
        description: 'Keep exact pixel dimensions when required by exam portals, or allow smart proportional downscaling for multi-megapixel camera shots.',
      },
      {
        title: 'Private Application & Document Uploads',
        description: 'Passport headshots, tax scans, and HR documents compress completely offline in browser RAM.',
      },
    ],
    faqs: [
      {
        question: 'How does Moklu compress an image to an exact 200KB limit?',
        answer: 'Moklu runs a fast local binary search across encoder quality settings to maximize sharpness under your KB ceiling, and can proportionally downscale oversized photos if minimum quality is still above 200KB.',
      },
      {
        question: 'Can I target 100KB, 500KB, or a custom size instead of 200KB?',
        answer: 'Yes. While this page presets 200KB for fast portal uploads, you can switch to 100KB, 500KB, or enter any custom KB target in one click.',
      },
      {
        question: 'Should I choose JPEG or WebP when compressing to 200KB?',
        answer: 'WebP delivers sharper detail per kilobyte for modern websites, while JPEG is recommended if a legacy government or job application portal only accepts .jpg uploads.',
      },
      {
        question: 'Are my application photos sent to a server during compression?',
        answer: 'No. Every compression iteration runs inside your local browser tab with zero network transfers.',
      },
    ],
  },
  'redact-screenshot': {
    navLabel: 'Redact Screenshot',
    title: 'Blur, Pixelate & Redact Screenshots Online (100% Local) | Moklu',
    metaDescription:
      'Hide API keys, emails, names, and sensitive numbers in screenshots with local blur, pixelate, solid mask, and spotlight tools before sharing. Zero server uploads.',
    badge: 'Blur · Pixelate · Spotlight · Local',
    h1: 'Redact, Blur & Pixelate Screenshots Locally',
    subtitle:
      'Mask API tokens, customer emails, revenue figures, and personal details in 3 seconds with local Blur, Pixelate, Solid Mask, and Spotlight focus tools before framing or sharing.',
    steps: [
      {
        title: 'Paste or drop your screenshot',
        description: 'Use Cmd/Ctrl+V right after capturing a dashboard, terminal, or chat window; nothing is ever uploaded.',
      },
      {
        title: 'Drag to Blur, Pixelate, Mask, or Spotlight',
        description: 'Draw redaction boxes over secrets or highlight the one UI control that matters, with instant undo and adjustable intensity.',
      },
      {
        title: 'Export framed PNG or refine in Studio',
        description: 'Download a clean redacted screenshot immediately, optionally wrapped in a Chrome or iPhone frame, or carry non-destructive layers into Studio.',
      },
    ],
    highlights: [
      {
        title: 'True Local Privacy for Secrets',
        description: 'Never upload an unredacted API key or customer table to a cloud blur site just to hide it. Everything stays in local browser RAM.',
      },
      {
        title: 'Four Precision Redaction Modes',
        description: 'Switch between irreversible Solid Mask for secrets, smooth Gaussian Blur, classic Mosaic Pixelate, and dim-backdrop Spotlight callouts.',
      },
      {
        title: 'Frame & Redact in One Flow',
        description: 'Combine privacy redaction with Chrome, Safari, iPhone, or frameless exports, and preserve non-destructive base layers in Moklu Studio.',
      },
    ],
    faqs: [
      {
        question: 'Is Solid Mask or Pixelate safer for hiding API keys and passwords?',
        answer: 'For credentials, tokens, and personal IDs, Solid Mask is the strongest option because it completely replaces the underlying pixels with an opaque block; Blur and Pixelate work well for casual obfuscation.',
      },
      {
        question: 'Does the unredacted screenshot ever get uploaded before I draw blur boxes?',
        answer: 'Never. Moklu loads your image purely inside local browser memory and renders every redaction box on client-side HTML5 Canvas.',
      },
      {
        question: 'What does Spotlight mode do in the screenshot redaction tool?',
        answer: 'Spotlight softly dims the rest of the screenshot while keeping your chosen focal region bright and crisp so readers spot the exact button or metric immediately.',
      },
      {
        question: 'Can I keep editing my redaction boxes after sending the image to Moklu Studio?',
        answer: 'Yes. Handing off to Moklu Studio preserves your base screenshot non-destructively underneath redaction layers so you can reposition regions or add arrows and labels.',
      },
    ],
  },
}
