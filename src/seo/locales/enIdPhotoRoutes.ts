/**
 * [INPUT]: depends on IdPhotoRouteSlug and RouteCopy types from ../types.ts
 * [OUTPUT]: exports EN_ID_PHOTO_ROUTES containing English SEO copy for passport-photo-maker, id-photo-background-changer, and id-photo-print-sheet
 * [POS]: modular ID-photo route-copy chunk for en within src/seo/locales, spread into EN_GROWTH_ROUTES by ./enGrowthRoutes.ts to keep every file well under 800 lines
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { IdPhotoRouteSlug, RouteCopy } from '../types.ts'

export const EN_ID_PHOTO_ROUTES: Record<IdPhotoRouteSlug, RouteCopy> = {
  'passport-photo-maker': {
    navLabel: 'Passport & ID Photo Maker',
    title: 'Free Local Passport & ID Photo Maker (2x2 US, 35x45mm Visa, No Upload) | Moklu',
    metaDescription:
      'Create compliant US 2x2 inch passport photos, 35x45mm Schengen/UK/JP/KR visa photos, and 1-inch/2-inch ID photos 100% locally in your browser using MODNet FP16. Zero server uploads.',
    badge: '100% Local AI · 2x2 & 35x45mm',
    h1: 'Free Local Passport & ID Photo Maker',
    subtitle:
      'Turn any well-lit portrait into an exact 2x2 inch US passport photo, 35x45mm Schengen or UK visa photo, or 1-inch/2-inch ID photo right inside your browser tab using local MODNet FP16 matting, Guided Filter hair refinement, and zero server uploads.',
    steps: [
      {
        title: 'Drop or paste a front-facing portrait',
        description:
          'Load a clear JPG, PNG, WebP, or HEIC headshot taken against any wall. The photo stays strictly in browser RAM and never uploads to a remote server.',
      },
      {
        title: 'Pick official size, backdrop, and framing',
        description:
          'Choose US 2x2 in (600x600px), Schengen/UK/JP/KR 35x45mm, 30x40mm, 1-inch, 2-inch, or custom mm/px, verify head height with the live guide overlay, and pick White, Blue, Red, or Gray.',
      },
      {
        title: 'Export single JPG/PNG, Trio ZIP, or print sheet',
        description:
          'Download a crisp 300 DPI digital file, lock an exact exam upload size (<=30KB/50KB/100KB/200KB), or switch to a 4x6 inch (4R) / A4 print sheet with zero watermarks.',
      },
    ],
    highlights: [
      {
        title: 'Zero Hair Halo with Guided Filter & Color Decontamination',
        description:
          'Local MODNet FP16 matting pairs with Guided Filter alpha refinement and foreground color decontamination so fine hair strands stay natural without colored fringe.',
      },
      {
        title: 'Exact Official Pixel & Millimeter Presets + Exam KB Caps',
        description:
          'Built-in 300 DPI dimensions for US 2x2 in, 35x45mm visa/passport, 30x40mm resume, and 1-inch/2-inch IDs, plus deterministic binary-search JPG compression for strict portal KB limits.',
      },
      {
        title: '100% Private & Official-Compliance First',
        description:
          'All ONNX WASM inference runs locally on your device. Moklu preserves your real facial geometry and real clothing without AI face reshaping or fake suit overlays that trigger rejections.',
      },
    ],
    faqs: [
      {
        question: 'Are my face and passport photos ever uploaded to a cloud server?',
        answer:
          'Never. Moklu runs the 12.4 MB MODNet FP16 ONNX model directly inside your browser via WebAssembly and caches the model locally. Your portrait pixels stay strictly in device RAM and work offline once cached.',
      },
      {
        question: 'Which passport, visa, and ID photo dimensions are supported?',
        answer:
          'Presets cover US Passport & Visa (2x2 in / 600x600px), Schengen/UK/Australia/Japan/Korea Passport (35x45mm / 413x531px), Resume (30x40mm), China 1-inch (25x35mm / 295x413px) and 2-inch (35x49mm / 413x579px), plus custom mm or px dimensions at 300 DPI.',
      },
      {
        question: 'How does Moklu avoid jagged edges or white halos around hair?',
        answer:
          'After MODNet predicts the portrait alpha matte, Moklu runs an edge-preserving Guided Filter and foreground color decontamination pass that removes old background color spill from semi-transparent hair strands before compositing onto the new backdrop.',
      },
      {
        question: 'Can I compress my digital passport photo below 50KB or 200KB for online portals?',
        answer:
          'Yes. Turn on the Target-KB cap (30KB, 50KB, 100KB, 200KB, or custom) and Moklu runs a deterministic binary search on JPEG quality so the exported file fits strict government or exam portal byte limits while keeping maximum facial clarity.',
      },
      {
        question: 'Why does Moklu not include AI beauty filters or synthetic suit swapping?',
        answer:
          'Government passport agencies, visa centers, and biometric exam systems reject altered facial geometry, smoothed skin texture, and pasted AI clothing. Keeping your real face and real attire ensures your photo passes automated and human compliance checks.',
      },
    ],
  },
  'id-photo-background-changer': {
    navLabel: 'ID Photo Background Changer',
    title: 'ID Photo Background Changer (White, Blue, Red, Zero Hair Halo) | Moklu',
    metaDescription:
      'Change ID and passport photo backgrounds to pure White, Civil Blue, Red, Gray, or resume gradient 100% locally in your browser. Zero hair halo, 1-click White/Blue/Red Trio ZIP.',
    badge: 'White · Blue · Red · Zero Halo',
    h1: 'ID Photo Background Changer with Zero Hair Halo',
    subtitle:
      'Swap any home wall or studio backdrop on your ID photo to compliant White, Civil Blue, Red, Gray, or a subtle resume gradient locally in your browser, or export a 1-click White/Blue/Red Trio ZIP.',
    steps: [
      {
        title: 'Load your portrait or existing ID photo',
        description:
          'Drop a casual phone portrait or an older ID photo that already has a blue or red backdrop. Everything executes in browser memory with zero uploads.',
      },
      {
        title: 'Choose AI cutout or Pure-Backdrop instant swap',
        description:
          'Use local MODNet FP16 AI matting for complex home backgrounds, or switch to Pure-Backdrop mode for instant zero-model swaps on existing studio photos.',
      },
      {
        title: 'Fine-tune hair edges and export single or Trio ZIP',
        description:
          'Adjust edge shift, feathering, and color decontamination in real time, then download one backdrop or bundle White, Blue, and Red copies together in a 1-click Trio ZIP.',
      },
    ],
    highlights: [
      {
        title: 'Foreground Color Decontamination Eliminates Halo Fringe',
        description:
          'When converting a blue or red ID photo to pure white, standard cutout tools leave colored outlines in hair. Moklu decontaminates foreground edge pixels so strands blend cleanly.',
      },
      {
        title: '1-Click White, Blue & Red Trio ZIP Pack',
        description:
          'Generate matching pure White, Civil Blue, and Red versions from one framing and save all three in a single local ZIP archive for passports, HR onboarding, and exams.',
      },
      {
        title: 'Dual Engine: Local AI Matting + Pure-Backdrop Mode',
        description:
          'Run 100% local MODNet FP16 for cluttered rooms, or switch to instant Pure-Backdrop chroma extraction when swapping an already uniform studio background.',
      },
    ],
    faqs: [
      {
        question: 'Can I change a blue or red ID photo background to pure white without a colored halo?',
        answer:
          'Yes. Moklu estimates the original background color and applies foreground color decontamination along semi-transparent hair and shoulder edges before placing your portrait on pure #FFFFFF white.',
      },
      {
        question: 'What is included in the 1-click White/Blue/Red Trio ZIP export?',
        answer:
          'With one click, Moklu renders your exact cropped portrait at your chosen ID size against pure White, Civil Blue, and Red backgrounds and packages all three high-resolution files locally into one ZIP archive.',
      },
      {
        question: 'When should I use Pure-Backdrop mode instead of AI Matting mode?',
        answer:
          'Use AI Matting (MODNet FP16) for everyday rooms, doors, or uneven walls. Use Pure-Backdrop mode when your source photo already has a clean, solid studio background and you want instant processing without waiting for the local AI model.',
      },
      {
        question: 'Does changing the background alter my face, glasses, or clothing?',
        answer:
          'No. Only the background region outside the guided alpha matte is replaced. Your original facial features, skin tones, and real clothing remain untouched for official ID compliance.',
      },
    ],
  },
  'id-photo-print-sheet': {
    navLabel: '4x6 ID Photo Print Sheet',
    title: '4x6 Passport Photo Print Sheet Generator (300 DPI PNG & PDF) | Moklu',
    metaDescription:
      'Arrange 2x2 inch passport photos, 35x45mm visa photos, or 1-inch/2-inch IDs onto 300 DPI 4x6 inch (4R) and A4 print sheets with crop marks. 100% browser-local PNG and PDF export.',
    badge: '300 DPI · 4x6 (4R) & A4 PDF',
    h1: '4x6 & A4 Passport Photo Print Sheet Generator',
    subtitle:
      'Tile compliant 2x2 inch, 35x45mm, 1-inch, or 2-inch ID photos onto an exact 300 DPI 4x6 inch (4R / 102x152mm) photo lab sheet or A4 printable PDF with optional cutting marks and zero uploads.',
    steps: [
      {
        title: 'Prepare or drop your cropped ID photo',
        description:
          'Use the built-in local portrait matting and size presets, or load an already cropped passport photo directly into the Print Sheet tab.',
      },
      {
        title: 'Select 4x6 inch (4R) or A4 paper at 300 DPI',
        description:
          'Preview exact physical layout counts (such as 2x 2x2 in photos or 8x 1-inch photos on a 4R sheet) and toggle clean corner crop lines for easy scissor trimming.',
      },
      {
        title: 'Export print-ready PNG or PDF 1.4 locally',
        description:
          'Download a crisp 300 DPI PNG for pharmacy and convenience-store kiosks (CVS, Walgreens, Boots, 7-Eleven) or an exact-scale A4 PDF 1.4 for home printing.',
      },
    ],
    highlights: [
      {
        title: 'True 300 DPI Physical Millimeter Accuracy',
        description:
          'Every photo slot is calculated directly in millimeters at 300 DPI (1200x1800px for 4x6 in / 4R, 2480x3508px for A4) so printed cutouts match official rulers.',
      },
      {
        title: 'Kiosk-Ready 4R PNG & Exact-Scale PDF 1.4',
        description:
          'Export PNG for photo kiosks and drugstore 4x6 prints for pennies, or export a multi-copy PDF 1.4 sheet with embedded page dimensions for home inkjet printers.',
      },
      {
        title: 'Optional Hairline Cut Guides & Zero Platform Branding',
        description:
          'Add subtle corner or perimeter crop lines to guide straight cuts, with zero Moklu logos or forced margins cluttering your sheet.',
      },
    ],
    faqs: [
      {
        question: 'How many passport or ID photos fit on a 4x6 inch (4R) print sheet?',
        answer:
          'At exact 300 DPI physical dimensions, a 4x6 inch (102x152mm) sheet fits 2 to 6 US 2x2 inch photos (standard 2x3 or 2x2 with safe margins), 4 to 6 Schengen 35x45mm photos, 8 China 1-inch (25x35mm) photos, or 4 China 2-inch (35x49mm) photos automatically.',
      },
      {
        question: 'What print settings prevent scaling errors at kiosks or on home printers?',
        answer:
          'At photo kiosks, order a standard 4x6 inch print with Borderless or Fit-to-Page turned off if it crops edges. On a home printer with A4 PDF, always choose 100% scale ("Actual Size") instead of "Fit to Printable Area".',
      },
      {
        question: 'Should I download PNG or PDF for my ID photo print sheet?',
        answer:
          'Choose 300 DPI PNG when uploading to online photo labs or USB photo kiosks (like Walgreens, CVS, Walmart, or convenience stores). Choose PDF 1.4 when printing directly on A4 photo paper from a desktop printer.',
      },
      {
        question: 'Does the print sheet generator upload my photo or add watermarks?',
        answer:
          'No. The entire 300 DPI canvas layout and PDF 1.4 binary encoding run locally inside your browser tab with zero server uploads and zero watermarks.',
      },
    ],
  },
}
