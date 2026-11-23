/**
 * [INPUT]: depends on LocaleBundle type from ../types.ts; depends on EN_TOOL_ROUTES from ./enTools.ts
 * [OUTPUT]: exports EN_LOCALE complete English UI labels and 19 intent-specific route copy entries
 * [POS]: default (root `/`) English language pack within src/seo/locales, loaded by src/seo/i18n.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { LocaleBundle } from '../types.ts'
import { EN_TOOL_ROUTES } from './enTools.ts'

export const EN_LOCALE: LocaleBundle = {
  code: 'en',
  nativeName: 'English',
  shortLabel: 'EN',
  ogLocale: 'en_US',
  ui: {
    brandName: 'Moklu',
    brandTagline: 'Local-first mockup & image workbench',
    skipToContent: 'Skip to main content',
    openStudio: 'Open Studio',
    openStudioShort: 'Studio',
    openInStudioCta: 'Open in Studio for multi-layer editing',
    proBadge: 'PRO',
    proUpgrade: 'Moklu Pro',
    proActive: 'Pro Active',
    themeLight: 'Light',
    themeDark: 'Dark',
    toggleThemeAria: 'Toggle light and dark theme',
    languageLabel: 'Language',
    menuToggleAria: 'Toggle navigation menu',
    primaryNavAria: 'Primary tools',
    mobileNavAria: 'Mobile tools',
    navCategories: {
      mockup: 'Mockups',
      merge: 'Merge',
      split: 'Split',
      compress: 'Compress',
      resize: 'Resize',
      'id-card': 'ID Card',
    },
    dropzoneTitle: 'Drop images here or paste from clipboard',
    dropzoneSubtitle: '100% local in your browser — nothing is uploaded to any server',
    privacyBadge: '100% Browser-Local · Zero Server Uploads',
    privacyBannerTitle: 'Private by architecture — your pixels never leave this device',
    privacyBannerDescription:
      'Every frame render, stitch, crop, compression pass, and ID watermark runs directly on HTML5 Canvas inside your browser tab. Disconnect Wi-Fi and every tool still works.',
    privacyProofPoints: [
      'Zero file uploads or remote queues',
      'Instant PNG, WebP, JPEG, and ZIP export',
      '1-click handoff to Moklu Studio layers',
    ],
    howToHeading: 'How it works in 3 steps',
    howToSubheading: 'Built for instant browser execution with zero account signup or cloud wait times.',
    highlightsHeading: 'Built for real workflows',
    highlightsSubheading: 'Purpose-built defaults tailored to the exact output format you need.',
    relatedToolsHeading: 'Continue with related tools',
    relatedToolsSubheading: 'Chain local workflows or jump straight into Moklu Studio for full multi-layer control.',
    directoryHeading: 'All Moklu local image tools',
    directorySubheading: 'Every tool below runs 100% client-side with zero watermarks on standard exports.',
    faqHeading: 'Frequently asked questions',
    faqSubheading: 'Answers about local privacy, output quality, supported formats, and Studio editing.',
    studioBannerTitle: 'Need custom typography, callouts, or multi-slide campaigns?',
    studioBannerDescription:
      'Send your current composition straight into Moklu Studio — our full Konva multi-layer canvas editor with shadows, gradients, annotations, and batch localization.',
    studioBannerAction: 'Launch Moklu Studio',
    studioBannerProAction: 'Explore Moklu Pro',
    footerDescription:
      'Open-source, local-first screenshot mockup studio and browser image toolkit. Zero tracking, zero server uploads.',
    footerGroups: {
      mockups: 'Mockups & Launch',
      mergeSplit: 'Merge & Split',
      optimizeResize: 'Compress & Resize',
      documentsStudio: 'Documents & Studio',
    },
    footerLanguages: 'Languages',
    footerOpenSource: 'GitHub Repository',
    footerLocalFirstNote: 'Processed 100% locally via HTML5 Canvas',
    footerCopyright: 'Moklu · Open-source visual toolkit',
  },
  routes: {
    '': {
      navLabel: 'Home Hub',
      title: 'Moklu — Free Local Screenshot Mockup & Image Toolkit',
      metaDescription:
        'Beautify browser & iPhone screenshots, merge photos, split carousels, compress WebP, and watermark ID cards 100% locally in your browser. Zero uploads.',
      badge: '100% Local · Zero Server Uploads',
      h1: 'Screenshot Mockups & Local Image Tools in One Tab',
      subtitle:
        'Drop or paste any screenshot to frame it in Chrome or iPhone 16 Pro, stitch photos, split carousels, compress images, or prepare watermarked A4 ID sheets — all processed locally with 1-click handoff to Moklu Studio.',
      steps: [
        {
          title: 'Pick a tool or paste an image',
          description: 'Use Ctrl/Cmd+V or drag local PNG, JPEG, or WebP files directly into the workspace above.',
        },
        {
          title: 'Adjust preset styling locally',
          description: 'Switch device frames, stitch layouts, compression quality, or security watermarks with live preview.',
        },
        {
          title: 'Download or refine in Studio',
          description: 'Export crisp files immediately, or click Open in Studio to add headlines, shapes, and multi-slide layouts.',
        },
      ],
      highlights: [
        {
          title: 'Instant Launch Visuals',
          description: 'Turn raw product captures into launch-ready Chrome, Safari, iPhone, and Pixel mockups in seconds.',
        },
        {
          title: 'Everyday Image Utilities',
          description: 'Merge long screenshots, slice 9-grids, convert PNG to WebP, and pad social photos without installing apps.',
        },
        {
          title: 'Seamless Studio Upgrade Path',
          description: 'Start fast in Quick Workspace, then carry your exact composition into Moklu Studio for multi-layer typography.',
        },
      ],
      faqs: [
        {
          question: 'Does Moklu upload my screenshots or photos to a server?',
          answer: 'No. Every tool in Moklu executes purely in your browser using HTML5 Canvas and Blob APIs. Your files never leave your computer.',
        },
        {
          question: 'Are standard exports free and watermark-free?',
          answer: 'Yes. All core mockup, merge, split, compress, resize, and ID card tools are free to use with no forced Moklu branding.',
        },
        {
          question: 'What is the difference between Quick Tools and Moklu Studio?',
          answer: 'Quick Tools give you immediate single-purpose workflows above the fold, while Moklu Studio unlocks an infinite multi-layer Konva canvas with custom text, badges, shadows, and multi-slide localization.',
        },
        {
          question: 'Which image formats and browsers are supported?',
          answer: 'Moklu reads and exports PNG, JPEG, and WebP across modern Chromium, Firefox, and Safari browsers on desktop and mobile.',
        },
      ],
    },
    studio: {
      navLabel: 'Moklu Studio',
      title: 'Moklu Studio — Multi-Layer Screenshot & Mockup Canvas Editor',
      metaDescription:
        'Full browser-based multi-layer mockup canvas for product launches, App Store sets, browser frames, callouts, gradients, and multi-language localization.',
      badge: 'Full Multi-Layer Canvas Editor',
      h1: 'Multi-Layer Mockup & Product Visual Studio',
      subtitle:
        'Compose layered device frames, headlines, badges, mesh gradients, and localized multi-slide decks directly in your browser with local autosave.',
      steps: [
        {
          title: 'Choose a canvas or import from Quick Tools',
          description: 'Start from curated App Store, social, or widescreen slide templates or transfer an active Quick Workspace image.',
        },
        {
          title: 'Layer frames, text, and shadows',
          description: 'Position Chrome, Safari, iPhone, or Pixel frames alongside typography, shapes, and precision drop shadows.',
        },
        {
          title: 'Export high-resolution sets',
          description: 'Download single slides or full multi-language slide packs as PNG, WebP, or ZIP directly from your browser.',
        },
      ],
      highlights: [
        {
          title: 'Non-Destructive Layer Tree',
          description: 'Reorder, lock, hide, undo, and fine-tune every background, mockup frame, image, and headline independently.',
        },
        {
          title: 'Multi-Slide Localization',
          description: 'Translate and preview App Store or marketing slide decks across languages while keeping layouts synchronized.',
        },
        {
          title: 'Local-First Persistence',
          description: 'Projects and assets stay in local browser storage with JSON backup export and zero mandatory cloud accounts.',
        },
      ],
      faqs: [
        {
          question: 'Can I send images from Quick Tools directly into Moklu Studio?',
          answer: 'Yes. Every Quick Workspace tool includes an Open in Studio action that stages your images onto an editable Studio slide automatically.',
        },
        {
          question: 'Where are my Moklu Studio projects stored?',
          answer: 'Projects are saved locally inside your browser IndexedDB and localStorage so your confidential product designs remain private.',
        },
        {
          question: 'Does Studio support custom canvas dimensions?',
          answer: 'Yes. Pick standard 16:9, 4:5, 9:16, or App Store presets, or enter exact custom pixel dimensions for any slide.',
        },
        {
          question: 'Can I undo edits and back up my Studio project?',
          answer: 'Studio tracks full undo/redo history and lets you export and re-import portable project archives at any time.',
        },
      ],
    },
    'browser-mockup': {
      navLabel: 'Browser Mockup',
      title: 'Free Browser Mockup Generator (Chrome & Safari) — Moklu',
      metaDescription:
        'Wrap web app screenshots in crisp Chrome, Safari, or minimal window frames with custom gradients and shadows. 100% browser-local, zero uploads.',
      badge: 'Chrome & Safari Window Frames',
      h1: 'Browser Mockup Generator for Web Apps & SaaS',
      subtitle:
        'Frame website or dashboard screenshots inside clean Chrome, Safari, or minimal macOS browser chrome with balanced padding and soft studio shadows — locally in your browser.',
      steps: [
        {
          title: 'Paste or drop a web screenshot',
          description: 'Capture any SaaS dashboard, landing page, or changelog view and drop or paste it straight onto the canvas.',
        },
        {
          title: 'Select Chrome, Safari, or Minimal chrome',
          description: 'Match your brand aesthetic with widescreen 16:9 or 16:10 proportions, gradient backdrops, and fit controls.',
        },
        {
          title: 'Export PNG or customize in Studio',
          description: 'Save a crisp high-res PNG instantly, or open in Moklu Studio to add headline callouts and cursor highlights.',
        },
      ],
      highlights: [
        {
          title: 'Product Hunt & Changelog Ready',
          description: 'Consistent 16:9 widescreen framing eliminates messy desktop edges and makes UI updates look editorial.',
        },
        {
          title: 'Pixel-Sharp Vector Chrome',
          description: 'Window traffic lights, address bars, and borders scale cleanly without blurry raster artifacts.',
        },
        {
          title: 'Confidential Dashboard Safe',
          description: 'Because rendering happens on your device, internal analytics and unreleased SaaS UI never touch remote servers.',
        },
      ],
      faqs: [
        {
          question: 'Which browser frame styles are included?',
          answer: 'You can switch instantly between Chrome Browser, Safari Browser, and a distraction-free Minimal Window frame.',
        },
        {
          question: 'What aspect ratio works best for Product Hunt and blog posts?',
          answer: 'The default 16:9 (1600×900) and 16:10 (1600×1000) presets fit Product Hunt galleries, X/Twitter cards, and documentation pages cleanly.',
        },
        {
          question: 'Can I customize the URL bar text or add floating annotations?',
          answer: 'Click Open in Studio to edit the browser chrome details, add arrows, badges, and headlines on separate layers.',
        },
        {
          question: 'Will my unreleased web app screenshot be stored anywhere?',
          answer: 'Never. All canvas compositing runs locally in browser memory and disappears as soon as you close the tab.',
        },
      ],
    },
    'iphone-mockup': {
      navLabel: 'iPhone Mockup',
      title: 'Free iPhone 16 Pro Mockup Generator Online — Moklu',
      metaDescription:
        'Place mobile app screenshots inside a crisp iPhone 16 Pro bezel with studio gradients and drop shadows. 100% browser-local with 1-click Studio editing.',
      badge: 'iPhone 16 Pro Titanium Bezel',
      h1: 'iPhone 16 Pro Mockup Generator',
      subtitle:
        'Showcase iOS app screens in an accurate iPhone 16 Pro frame with soft lighting, balanced margins, and zero cloud uploads.',
      steps: [
        {
          title: 'Upload or paste an iOS screen capture',
          description: 'Drop a simulator capture or device screenshot into the iPhone frame slot — or load the demo screen to preview immediately.',
        },
        {
          title: 'Tune backdrop, ratio, and screen fit',
          description: 'Pick 4:5 portrait, 9:16 story, or square framing and choose cover or contain fit for exact screen edges.',
        },
        {
          title: 'Download PNG or expand in Studio',
          description: 'Export your finished iPhone mockup immediately, or send it to Studio to pair it with feature headlines.',
        },
      ],
      highlights: [
        {
          title: 'True-to-Device Proportions',
          description: 'Screen corners and Dynamic Island spacing align with modern iPhone 16 Pro aspect ratios.',
        },
        {
          title: 'Social & Portfolio Ready',
          description: 'Switch between 4:5 Instagram portraits, 9:16 vertical reels, and 16:9 presentation slides in one click.',
        },
        {
          title: 'Private Beta Build Friendly',
          description: 'Create marketing mockups from NDA or TestFlight builds locally without uploading pre-release UI.',
        },
      ],
      faqs: [
        {
          question: 'What screenshot resolution fits the iPhone 16 Pro mockup best?',
          answer: 'Standard iPhone Pro portrait captures (such as 1206×2622 or 1290×2796) fit cleanly, and Cover mode automatically aligns other mobile sizes.',
        },
        {
          question: 'Can I place two iPhones side by side or tilt the device?',
          answer: 'Yes — click Open in Studio to duplicate the iPhone layer, rotate frames, and compose multi-device hero shots.',
        },
        {
          question: 'Does the iPhone mockup add a watermark?',
          answer: 'No. Standard high-resolution PNG exports are completely clean and free of watermarks.',
        },
        {
          question: 'Can I use these iPhone mockups commercially?',
          answer: 'Yes. Every mockup you export from your own screenshots can be used freely in landing pages, pitch decks, and App Store listings.',
        },
      ],
    },
    'device-mockup': {
      navLabel: 'Device Mockup',
      title: 'Free Multi-Device Mockup Generator (Android, Pixel & Web) — Moklu',
      metaDescription:
        'Generate clean Google Pixel 9, iPhone, and desktop browser mockups in seconds. 100% client-side rendering with custom gradients and Studio handoff.',
      badge: 'Pixel 9, iPhone & Browser Frames',
      h1: 'Multi-Device Mockup Generator for Cross-Platform Apps',
      subtitle:
        'Present Android, iOS, and responsive web screenshots inside unified hardware and browser frames with consistent lighting — processed locally on your machine.',
      steps: [
        {
          title: 'Drop your Android, iOS, or web screenshot',
          description: 'Start with a Pixel 9 capture or switch frames anytime without re-uploading your screenshot.',
        },
        {
          title: 'Match canvas proportions and lighting',
          description: 'Choose landscape, widescreen, square, or portrait ratios with Aurora, Midnight, or Warm Paper themes.',
        },
        {
          title: 'Export or combine devices in Studio',
          description: 'Save a single device mockup immediately, or open in Studio to arrange desktop and mobile frames together.',
        },
      ],
      highlights: [
        {
          title: 'Android & Google Play Ready',
          description: 'Dedicated Google Pixel 9 hardware frame gives Android releases the same polish as iOS launches.',
        },
        {
          title: 'Unified Brand Aesthetics',
          description: 'Keep identical shadows and background palettes across web, iOS, and Android marketing visuals.',
        },
        {
          title: 'Fast Client-Side Canvas',
          description: 'No server rendering wait queues — swap frames and preview updates at 60fps right in your browser.',
        },
      ],
      faqs: [
        {
          question: 'Which device models can I switch between?',
          answer: 'Quick Workspace supports Google Pixel 9, iPhone 16 Pro, Chrome Browser, Safari Browser, and Minimal Window frames.',
        },
        {
          question: 'Can I showcase an Android phone and a desktop browser in one image?',
          answer: 'Yes. Click Open in Studio to place multiple device layers onto a single shared canvas.',
        },
        {
          question: 'Does switching device frames delete my uploaded screenshot?',
          answer: 'No. Your screenshot stays attached while you test different hardware frames, aspect ratios, and color themes.',
        },
        {
          question: 'Are uploaded client mockups ever transmitted over the network?',
          answer: 'No. Everything stays strictly inside your local browser session with zero remote storage.',
        },
      ],
    },
    'app-store-screenshots': {
      navLabel: 'App Store Screenshots',
      title: 'App Store & Google Play Screenshot Generator (9:16) — Moklu',
      metaDescription:
        'Design high-converting 9:16 App Store and Google Play screenshots with iPhone 16 Pro frames, studio backgrounds, and 1-click multi-slide Studio handoff.',
      badge: '9:16 Store Listing Preset',
      h1: 'App Store & Play Store Screenshot Maker',
      subtitle:
        'Start with store-ready 9:16 vertical framing and iPhone 16 Pro hardware, then jump into Moklu Studio for multi-slide headlines and localized store sets.',
      steps: [
        {
          title: 'Import your mobile app screen',
          description: 'Drop your iOS or Android app capture into the 9:16 portrait canvas pre-configured for vertical store listings.',
        },
        {
          title: 'Choose frame style and backdrop mood',
          description: 'Pick bright Aurora, sleek Midnight, or Warm Paper gradients that make your app UI stand out in search results.',
        },
        {
          title: 'Add store captions in Studio or export',
          description: 'Export a clean framed screenshot immediately, or click Open in Studio to build a full 5-slide localized App Store gallery.',
        },
      ],
      highlights: [
        {
          title: 'Built-In Vertical 9:16 Ratio',
          description: 'Matches modern App Store and Play Store portrait preview cards without manual resizing.',
        },
        {
          title: 'Multi-Language Store Ready',
          description: 'Upgrade your slide straight into Moklu Studio to manage localized captions across English, Chinese, Japanese, and Korean.',
        },
        {
          title: 'Zero Asset Leakage',
          description: 'Keep unreleased feature screens confidential on your own workstation from first draft to submission.',
        },
      ],
      faqs: [
        {
          question: 'How do I add bold marketing headlines above the iPhone frame?',
          answer: 'Click Open in Studio right from the workspace — your framed screenshot loads into our multi-layer editor where you can add headlines, badges, and multiple slides.',
        },
        {
          question: 'Does this work for both Apple App Store and Google Play?',
          answer: 'Yes. You can switch between iPhone 16 Pro and Google Pixel 9 frames while keeping the vertical 9:16 layout consistent.',
        },
        {
          question: 'Can I batch-export localized screenshot sets?',
          answer: 'Moklu Studio includes a dedicated localization workspace for managing translated copy across multiple slides locally.',
        },
        {
          question: 'Are my App Store screenshots compressed or watermarked?',
          answer: 'No. Exports render at crisp native canvas resolution in lossless PNG without any forced watermarks.',
        },
      ],
    },
    'merge-images': {
      navLabel: 'Merge Images',
      title: 'Merge Images Online Free — Side-by-Side, Vertical & Grid | Moklu',
      metaDescription:
        'Combine multiple photos or screenshots horizontally, vertically, or in a clean grid collage. 100% browser-local processing with custom gaps and borders.',
      badge: 'Horizontal · Vertical · Grid',
      h1: 'Merge Multiple Images Locally in Seconds',
      subtitle:
        'Drop or paste two or more screenshots and combine them side-by-side, stacked vertically, or in a balanced grid with custom spacing, rounded corners, and zero uploads.',
      steps: [
        {
          title: 'Add and reorder your images',
          description: 'Select multiple files or paste screenshots sequentially, then arrange them in the exact order you want.',
        },
        {
          title: 'Pick merge layout and spacing',
          description: 'Switch between horizontal, vertical, or grid layouts and tune gap width, outer padding, corner radius, and background.',
        },
        {
          title: 'Export combined PNG or WebP',
          description: 'Download the merged high-resolution image locally, or open it in Moklu Studio for arrows and comparison labels.',
        },
      ],
      highlights: [
        {
          title: 'Automatic Size Alignment',
          description: 'Normalize mismatched image heights or widths cleanly so merged panels sit flush without awkward gaps.',
        },
        {
          title: 'Rounded Corners & Clean Padding',
          description: 'Add subtle corner rounding and neutral or gradient backdrops for presentation-grade visuals.',
        },
        {
          title: '100% Private Local Stitching',
          description: 'Merge personal photos, financial chats, or internal UI comparisons strictly inside your browser memory.',
        },
      ],
      faqs: [
        {
          question: 'How many images can I merge at once?',
          answer: 'You can add multiple images in one batch; Moklu automatically clamps extreme canvas dimensions safely so your browser stays responsive.',
        },
        {
          question: 'What happens if my images have different resolutions?',
          answer: 'Moklu normalizes heights in horizontal mode and widths in vertical mode so mixed-size screenshots line up seamlessly.',
        },
        {
          question: 'Can I add "Before" and "After" text labels to merged photos?',
          answer: 'Yes. After merging, click Open in Studio to place crisp badges, divider lines, and captions on top.',
        },
        {
          question: 'Are merged photos uploaded to cloud storage?',
          answer: 'Never. All pixel composition happens on a local HTML5 Canvas in your browser.',
        },
      ],
    },
    'combine-photos-side-by-side': {
      navLabel: 'Side-by-Side Photos',
      title: 'Combine Photos Side by Side Free (Before & After) — Moklu',
      metaDescription:
        'Join 2 or more photos horizontally side-by-side with matched heights, custom gaps, and rounded corners. 100% local in your browser with zero uploads.',
      badge: 'Horizontal Comparison Preset',
      h1: 'Combine Photos Side by Side',
      subtitle:
        'Place two or more photos or UI screenshots side-by-side in a horizontal strip with automatic height matching, crisp dividers, and 1-click Studio captioning.',
      steps: [
        {
          title: 'Drop your before and after images',
          description: 'Import two or more photos and drag or nudge them into left-to-right order.',
        },
        {
          title: 'Fine-tune gap, padding, and backdrop',
          description: 'Set pixel spacing between frames, add soft rounded corners, and choose a light, dark, or colored border.',
        },
        {
          title: 'Download or label in Studio',
          description: 'Export the finished side-by-side PNG/WebP locally, or open in Studio to add Before/After badges.',
        },
      ],
      highlights: [
        {
          title: 'Effortless Before & After Comparisons',
          description: 'Ideal for UI redesigns, photo grading comparisons, fitness progress, and product feature spotlights.',
        },
        {
          title: 'Matched-Height Alignment',
          description: 'Photos shot on different devices scale cleanly to share an identical horizontal baseline.',
        },
        {
          title: 'Zero Compression Loss Option',
          description: 'Export lossless PNG for crisp UI text or lightweight WebP for instant sharing on X and Slack.',
        },
      ],
      faqs: [
        {
          question: 'Can I put more than two photos side by side?',
          answer: 'Yes. Horizontal mode supports 2, 3, 4, or more images arranged cleanly in a single row.',
        },
        {
          question: 'Will my photos be cropped when combined side by side?',
          answer: 'No. Side-by-side mode scales images proportionally to match heights without slicing off edges.',
        },
        {
          question: 'How do I add a clean white border between two photos?',
          answer: 'Set the background color to white and adjust the Gap and Outer Padding sliders to your preferred margin.',
        },
        {
          question: 'Is this safe for private personal before-and-after photos?',
          answer: 'Yes. Processing runs 100% offline in your browser tab — nothing is ever sent to a server.',
        },
      ],
    },
    'stitch-images-vertically': {
      navLabel: 'Stitch Vertically',
      title: 'Stitch Screenshots Vertically into One Long Image — Moklu',
      metaDescription:
        'Combine multiple mobile screenshots, chat logs, or web captures into one seamless vertical long image locally in your browser. Zero uploads.',
      badge: 'Vertical Long-Screenshot Mode',
      h1: 'Stitch Images Vertically into a Long Screenshot',
      subtitle:
        'Stack chat logs, receipt captures, full-page mobile views, or tutorial steps top-to-bottom with matched widths and zero-gap seamless stitching — 100% locally.',
      steps: [
        {
          title: 'Load screenshots in reading order',
          description: 'Drop or paste your sequential mobile or desktop captures and verify their top-to-bottom sequence.',
        },
        {
          title: 'Set seamless zero-gap or spaced cards',
          description: 'Use 0px gap for continuous scrolling chats, or add padding and rounded corners for step-by-step guides.',
        },
        {
          title: 'Export one crisp vertical image',
          description: 'Download your stitched long PNG or WebP directly from your browser with zero server upload.',
        },
      ],
      highlights: [
        {
          title: 'Chat & Document Privacy',
          description: 'Stitch sensitive messaging threads, invoices, or bug reports without exposing them to cloud converters.',
        },
        {
          title: 'Consistent Column Width',
          description: 'Automatically normalizes screenshot widths so mixed desktop and mobile captures align cleanly.',
        },
        {
          title: 'Safe High-Resolution Guard',
          description: 'Preserves readable text clarity while preventing browser canvas memory overflows on very tall stacks.',
        },
      ],
      faqs: [
        {
          question: 'How do I remove lines between stitched screenshots?',
          answer: 'Set both Gap and Outer Padding to 0px and corner radius to 0px for a completely flush continuous long image.',
        },
        {
          question: 'Can I stitch desktop and mobile screenshots together?',
          answer: 'Yes. Vertical stitching scales each image proportionally to match a uniform width automatically.',
        },
        {
          question: 'What format is best for long text screenshots?',
          answer: 'PNG keeps UI fonts razor-sharp, while WebP dramatically reduces file size for sharing in chat apps.',
        },
        {
          question: 'Can I blur sensitive info or add highlights afterward?',
          answer: 'Click Open in Studio to place masking shapes, callout boxes, or numbered annotations over your stitched image.',
        },
      ],
    },
    'photo-collage-grid': {
      navLabel: 'Photo Collage Grid',
      title: 'Free Photo Collage Grid Maker (2×2, 3×3 & Custom) — Moklu',
      metaDescription:
        'Arrange photos into clean 2×2, 3×3, or custom column collage grids with adjustable gaps, aspect ratios, and rounded corners. 100% browser-local.',
      badge: 'Custom Column Grid Layout',
      h1: 'Photo Collage Grid Maker',
      subtitle:
        'Turn a folder of product shots, travel photos, or UI screens into an evenly spaced grid collage with customizable columns, cell aspect ratios, and instant local export.',
      steps: [
        {
          title: 'Select your photo set',
          description: 'Drop 4, 6, 9, or more images into the workspace and reorder tiles until the visual rhythm feels right.',
        },
        {
          title: 'Configure columns, cell ratio, and gaps',
          description: 'Choose 2 to 6 columns, square 1:1 or 4:3 cells, cover/contain framing, and rounded corners.',
        },
        {
          title: 'Download collage or add titles in Studio',
          description: 'Export your finished grid locally, or open in Studio to add header typography and brand marks.',
        },
      ],
      highlights: [
        {
          title: 'Exact Symmetrical Geometry',
          description: 'Every tile shares mathematically equal margins and corner radii without manual alignment fiddling.',
        },
        {
          title: 'Cover or Contain Fit Modes',
          description: 'Fill tiles edge-to-edge for editorial lookbooks, or keep full uncropped frames for UI showcases.',
        },
        {
          title: 'Zero Signups or Watermarks',
          description: 'Export clean collages directly from your browser without subscription paywalls or forced logos.',
        },
      ],
      faqs: [
        {
          question: 'Can I make both 2×2 and 3×3 photo collages?',
          answer: 'Yes. Adjust the column count from 2 up to 6 and drop any number of photos to build balanced rows automatically.',
        },
        {
          question: 'How do I prevent important subjects from being cropped in grid cells?',
          answer: 'Switch the cell fit mode from Cover to Contain, or choose an aspect ratio like 4:3 or 3:4 that matches your photos.',
        },
        {
          question: 'Can I customize the background color behind the collage tiles?',
          answer: 'Yes. Pick solid white, deep dark, or soft studio color backgrounds to complement your photo palette.',
        },
        {
          question: 'Does Moklu save a copy of my photo collage?',
          answer: 'No. Everything renders strictly on your own machine inside the browser.',
        },
      ],
    },
    ...EN_TOOL_ROUTES,
  },
}
