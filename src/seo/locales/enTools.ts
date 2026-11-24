/**
 * [INPUT]: depends on RouteCopy and SecondaryToolSlug types from ../types.ts
 * [OUTPUT]: exports EN_TOOL_ROUTES containing English copy for split, compress, resize, and ID-card routes
 * [POS]: secondary route-copy chunk for en within src/seo/locales, merged into EN_LOCALE by ./en.ts to keep every file <= 800 lines
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { RouteCopy, SecondaryToolSlug } from '../types.ts'

export const EN_TOOL_ROUTES: Record<SecondaryToolSlug, RouteCopy> = {
  'carousel-splitter': {
    navLabel: 'Carousel Splitter',
    title: 'Seamless Carousel Panorama Splitter for Instagram & Xiaohongshu | Moklu',
    metaDescription:
      'Slice wide panoramas or multi-panel designs into seamless 4:5, 3:4, or 1:1 swipeable carousel slides and download as a ZIP. 100% browser-local.',
    badge: 'Seamless Swipe Carousel Slices',
    h1: 'Seamless Social Carousel Panorama Splitter',
    subtitle:
      'Split any panoramic photo or wide story layout into exact, pixel-aligned swipeable slides for Instagram, Xiaohongshu, and LinkedIn with 1-click ZIP download.',
    steps: [
      {
        title: 'Drop a wide panorama or multi-slide canvas',
        description: 'Load a horizontal photo or wide infographic; Moklu draws live cut lines directly over your preview.',
      },
      {
        title: 'Choose slide count and social ratio',
        description: 'Pick 2 to 10 slides in 4:5 (1080×1350), 3:4 (1080×1440), 1:1 square, or auto equal-width slices.',
      },
      {
        title: 'Export numbered ZIP or refine in Studio',
        description: 'Download all slices in order inside one ZIP archive, or open the slide set in Studio to add per-slide captions.',
      },
    ],
    highlights: [
      {
        title: 'Zero-Seam Swipe Continuity',
        description: 'Exact sub-pixel boundary calculations eliminate 1px white lines between adjacent carousel cards.',
      },
      {
        title: 'Instagram & Xiaohongshu Presets',
        description: 'Built-in 4:5 and 3:4 output ratios ensure platforms never unexpectedly crop your carousel.',
      },
      {
        title: 'Studio Multi-Slide Handoff',
        description: 'Send your split slices into Moklu Studio as an ordered slide deck to overlay page numbers or titles.',
      },
    ],
    faqs: [
      {
        question: 'Which ratio should I pick for Instagram vs. Xiaohongshu carousels?',
        answer: 'Choose 4:5 (1080×1350) for Instagram portrait carousels and 3:4 (1080×1440) for Xiaohongshu and vertical feeds.',
      },
      {
        question: 'How many slides can I split one panorama into?',
        answer: 'You can split a wide image into anywhere from 2 to 10 seamless sequential slides.',
      },
      {
        question: 'Are the slices numbered in posting order?',
        answer: 'Yes. Both individual downloads and the bundled ZIP archive number every slide sequentially (01, 02, 03...) from left to right.',
      },
      {
        question: 'Does splitting happen locally without uploading high-res panoramas?',
        answer: 'Yes. Even large 8K panoramas are sliced locally in your browser with zero network upload wait.',
      },
    ],
  },
  'image-grid-splitter': {
    navLabel: 'Grid Splitter',
    title: '9-Grid Image Splitter Online (3×3 & Custom Matrix) | Moklu',
    metaDescription:
      'Split any image into a crisp 3×3 nine-grid, 2×2, or custom rows × columns matrix and export numbered tiles as a ZIP. 100% local in your browser.',
    badge: '3×3 Nine-Grid & Matrix Slicer',
    h1: '9-Grid & Custom Matrix Image Splitter',
    subtitle:
      'Slice a single hero photo or poster into 3×3 WeChat Moments / Instagram grids or custom row-by-column tiles with live cut guides and instant local ZIP export.',
    steps: [
      {
        title: 'Upload your square or rectangular image',
        description: 'Drop any artwork, banner, or photo to preview the exact matrix cut lines immediately.',
      },
      {
        title: 'Select 3×3 or custom rows and columns',
        description: 'Pick classic 3×3 nine-grid, 2×2 quad, or any custom matrix from 1×1 up to 6×6.',
      },
      {
        title: 'Download individual tiles or full ZIP',
        description: 'Grab single tiles or download the complete ordered ZIP pack ready for immediate posting.',
      },
    ],
    highlights: [
      {
        title: 'Live Grid Cut Preview',
        description: 'See exactly where every horizontal and vertical cut falls before exporting a single file.',
      },
      {
        title: 'Ordered Tile Naming',
        description: 'Files are numbered left-to-right, top-to-bottom so uploading a 9-grid never gets scrambled.',
      },
      {
        title: 'Lossless Local Slicing',
        description: 'Tiles are extracted directly from the original pixel buffer in your browser with no server re-compression.',
      },
    ],
    faqs: [
      {
        question: 'How do I create a classic 3×3 nine-grid for WeChat Moments or Instagram?',
        answer: 'Select 3 rows and 3 columns (the default preset), drop your image, and click Download All ZIP to get tiles 1 through 9 in order.',
      },
      {
        question: 'Can I split an image into non-square grids like 3×1 or 2×3?',
        answer: 'Yes. Independently set rows (1–6) and columns (1–6) for banners, profile headers, or printable poster tiles.',
      },
      {
        question: 'Should I crop my image to 1:1 before splitting into a 3×3 grid?',
        answer: 'For square 9-grid feeds, cropping to 1:1 first produces perfectly square tiles; you can also slice rectangular images as-is.',
      },
      {
        question: 'Is there any limit on file size or daily exports?',
        answer: 'No artificial daily caps. Everything executes on your own device CPU and memory.',
      },
    ],
  },
  'compress-image': {
    navLabel: 'Compress Image',
    title: 'Free Local Image Compressor (PNG, JPEG, WebP) | Moklu',
    metaDescription:
      'Shrink PNG, JPEG, and WebP file sizes in batch right inside your browser with live KB savings badges, quality sliders, and ZIP export. Zero uploads.',
    badge: 'Batch Local Compression · Live KB Savings',
    h1: 'Local Batch Image Compressor in Your Browser',
    subtitle:
      'Reduce image payloads by up to 80% with visual quality control, optional max-width downscaling, before/after byte counters, and 1-click ZIP download with zero server uploads.',
    steps: [
      {
        title: 'Drop one or dozens of images',
        description: 'Queue PNG, JPEG, or WebP assets locally without waiting for cloud upload progress bars.',
      },
      {
        title: 'Dial in quality, format, and max width',
        description: 'Compare exact original vs. compressed KB and percentage savings for every file in real time.',
      },
      {
        title: 'Download individually or as a ZIP',
        description: 'Save individual optimized images or bundle the entire batch into a single clean ZIP archive.',
      },
    ],
    highlights: [
      {
        title: 'Core Web Vitals Friendly',
        description: 'Export crisp WebP or progressive JPEG images that cut LCP load times for blogs and landing pages.',
      },
      {
        title: 'Transparent Per-File Savings',
        description: 'Inspect exact byte reduction and percentage saved per file before downloading.',
      },
      {
        title: 'Zero Privacy Exposure',
        description: 'Compress client deliverables, HR documents, or internal product screenshots without third-party servers.',
      },
    ],
    faqs: [
      {
        question: 'How much smaller do images get with local WebP compression?',
        answer: 'Typical UI screenshots and product photos shrink 50%–85% at 0.80–0.85 WebP quality with virtually invisible visual difference.',
      },
      {
        question: 'Does Moklu strip unnecessary metadata during compression?',
        answer: 'Re-encoding through HTML5 Canvas naturally strips bulky EXIF camera headers and GPS location tags for leaner, more private files.',
      },
      {
        question: 'Can I downscale oversized 4K photos while compressing?',
        answer: 'Yes. Set an optional max width or height cap (such as 1920px or 1200px) to resize and compress in one pass.',
      },
      {
        question: 'Why compress in the browser instead of a cloud compressor?',
        answer: 'Local compression finishes instantly with no upload bandwidth delay, no file count paywalls, and total data confidentiality.',
      },
    ],
  },
  'convert-image-format': {
    navLabel: 'Convert Format',
    title: 'Batch Image Format Converter (PNG, JPEG, WebP) | Moklu',
    metaDescription:
      'Convert images between PNG, WebP, and JPEG locally in batch with quality control and ZIP download. Zero file uploads, instant browser conversion.',
    badge: 'PNG · WebP · JPEG Batch Converter',
    h1: 'Batch Image Format Converter',
    subtitle:
      'Convert WebP downloads back to PNG, turn heavy PNGs into compact JPEGs or WebP, and export entire folders in one local ZIP without uploading a single byte.',
    steps: [
      {
        title: 'Add mixed-format source files',
        description: 'Drop WebP, PNG, or JPEG images into the batch queue at once.',
      },
      {
        title: 'Pick your target output format',
        description: 'Choose lossless PNG for editing, JPEG for universal compatibility, or WebP for modern web performance.',
      },
      {
        title: 'Download converted files or ZIP',
        description: 'Every output receives the proper file extension automatically and exports locally in seconds.',
      },
    ],
    highlights: [
      {
        title: 'WebP to PNG Made Effortless',
        description: 'Quickly convert web-saved .webp graphics into universally compatible PNG files for Keynote, Figma, or print.',
      },
      {
        title: 'Batch Processing with ZIP',
        description: 'Convert 20+ screenshots in a single pass and download them neatly packaged in one archive.',
      },
      {
        title: 'Clean File Extensions',
        description: 'Output filenames preserve your original stem and swap only the extension cleanly (.png, .jpg, .webp).',
      },
    ],
    faqs: [
      {
        question: 'Can I convert WebP files back to lossless PNG?',
        answer: 'Yes. Drop any WebP images, keep Target Format on PNG, and download clean .png files immediately.',
      },
      {
        question: 'What happens to transparency when converting PNG to JPEG?',
        answer: 'Because JPEG does not support alpha transparency, transparent areas are cleanly flattened onto a solid backdrop.',
      },
      {
        question: 'Does batch conversion preserve original dimensions?',
        answer: 'Yes. Unless you explicitly enter a max width/height limit, every converted image retains its exact original pixel dimensions.',
      },
      {
        question: 'Are converted files stored on Moklu servers?',
        answer: 'Never. Conversion runs strictly inside your browser using native Canvas encoding.',
      },
    ],
  },
  'png-to-webp': {
    navLabel: 'PNG to WebP',
    title: 'PNG to WebP Converter Online Free (Local Batch) | Moklu',
    metaDescription:
      'Convert PNG screenshots and graphics to lightweight WebP in batch right inside your browser while preserving transparency. Zero server uploads.',
    badge: 'Web-Ready WebP Optimization',
    h1: 'Convert PNG to WebP Locally in Batch',
    subtitle:
      'Shrink heavy PNG screenshots and transparent UI icons into modern WebP files with alpha transparency intact, instant KB savings readouts, and 1-click ZIP export.',
    steps: [
      {
        title: 'Drop your PNG files',
        description: 'Drag single screenshots or an entire folder of website PNG assets directly into the converter.',
      },
      {
        title: 'Adjust WebP quality slider',
        description: 'Use 82%–90% for crisp UI typography and inspect exact per-file byte reduction before saving.',
      },
      {
        title: 'Export .webp files or ZIP pack',
        description: 'Download ready-to-deploy .webp assets directly into your web project with zero upload delay.',
      },
    ],
    highlights: [
      {
        title: 'Preserves Alpha Transparency',
        description: 'Unlike JPEG, WebP retains smooth transparent backgrounds on logos, stickers, and UI mockups.',
      },
      {
        title: 'Faster Lighthouse Scores',
        description: 'Replacing large hero PNGs with WebP immediately shrinks page weight and improves SEO Core Web Vitals.',
      },
      {
        title: 'Built for Developers & Designers',
        description: 'No CLI setup needed. Batch-convert assets offline right in a browser tab.',
      },
    ],
    faqs: [
      {
        question: 'Does converting PNG to WebP keep transparent backgrounds?',
        answer: 'Yes. WebP fully supports 8-bit alpha transparency, so logos and cutouts stay crisp on any backdrop.',
      },
      {
        question: 'What WebP quality setting is recommended for UI screenshots?',
        answer: 'Quality 85% (0.85) typically keeps sharp UI text crisp while cutting PNG file size by 60% to 80%.',
      },
      {
        question: 'Are WebP images supported by all modern browsers?',
        answer: 'Yes. Chrome, Safari, Firefox, and Edge all natively support WebP across desktop and mobile.',
      },
      {
        question: 'Is there a limit on how many PNGs I can convert?',
        answer: 'No server quota exists because all WebP encoding happens locally on your own machine.',
      },
    ],
  },
  'resize-image': {
    navLabel: 'Resize Image',
    title: 'Free Batch Image Resizer (Exact Pixels & Scale %) | Moklu',
    metaDescription:
      'Resize images to exact pixel dimensions or percentage scale with aspect ratio lock locally in your browser. Batch ZIP export, zero uploads.',
    badge: 'Exact Pixels · Scale % · Batch',
    h1: 'Batch Image Resizer by Pixels or Percentage',
    subtitle:
      'Scale screenshots, avatars, and product photos to exact target widths, heights, or percentage ratios with aspect lock and clean local batch export.',
    steps: [
      {
        title: 'Load one or more images',
        description: 'Drop or paste images into the resize workspace; Moklu reads each file’s native dimensions immediately.',
      },
      {
        title: 'Enter target pixels or scale percentage',
        description: 'Lock aspect ratio to prevent stretching, or pick quick social and HD dimension presets.',
      },
      {
        title: 'Download resized images or ZIP',
        description: 'Export crisp resized files locally, or click Open in Studio to place them inside device mockups.',
      },
    ],
    highlights: [
      {
        title: 'Aspect-Lock Protection',
        description: 'Update width or height and the companion dimension recalculates automatically so images never distort.',
      },
      {
        title: 'High-Quality Canvas Smoothing',
        description: 'Uses high-quality bicubic-grade image smoothing for clean downscaling on text and photography.',
      },
      {
        title: 'Batch Productivity',
        description: 'Standardize an entire batch of blog thumbnails or product photos to uniform pixel dimensions in one click.',
      },
    ],
    faqs: [
      {
        question: 'Can I resize by percentage like 50% instead of exact pixels?',
        answer: 'Yes. Toggle between exact pixel dimensions and percentage scaling to halve or standardize image sizes effortlessly.',
      },
      {
        question: 'Will resizing distort my image proportions?',
        answer: 'Keep Aspect Ratio Lock enabled (on by default) so width and height always stay proportional.',
      },
      {
        question: 'Can I resize multiple product photos to the same width at once?',
        answer: 'Yes. Add multiple images, set your target width, and export the entire resized batch as a ZIP.',
      },
      {
        question: 'Does resizing happen on a remote server?',
        answer: 'No. Every pixel is resampled locally inside your browser tab.',
      },
    ],
  },
  'crop-image': {
    navLabel: 'Crop Image',
    title: 'Free Image Cropper with Social Aspect Ratios (1:1, 4:5, 16:9) | Moklu',
    metaDescription:
      'Crop photos and screenshots to exact 1:1, 4:5, 3:4, 16:9, 9:16, or custom aspect ratios locally in your browser. Zero uploads, instant PNG/WebP export.',
    badge: 'Exact Social Aspect Presets',
    h1: 'Precision Image Cropper for Social & Web Ratios',
    subtitle:
      'Trim photos and UI captures cleanly to 1:1 avatars, 4:5 Instagram cards, 16:9 thumbnails, or 9:16 stories with instant visual preview and zero server uploads.',
    steps: [
      {
        title: 'Drop or paste your photo',
        description: 'Open any PNG, JPEG, or WebP locally to inspect its native dimensions and framing.',
      },
      {
        title: 'Pick a preset ratio or custom framing',
        description: 'Select 1:1, 4:5, 3:4, 16:9, 9:16, or 3:2 to frame the focal area cleanly.',
      },
      {
        title: 'Export cropped image or frame in Studio',
        description: 'Download the cropped asset instantly, or send it straight to Moklu Studio for device mockups and text.',
      },
    ],
    highlights: [
      {
        title: 'All Major Platform Ratios',
        description: 'Switch between YouTube 16:9, Instagram 4:5, Xiaohongshu 3:4, Square 1:1, and Story 9:16 effortlessly.',
      },
      {
        title: 'Lossless Pixel Extraction',
        description: 'Crops directly from full-resolution source data without blurry intermediate scaling.',
      },
      {
        title: 'Batch Consistent Crops',
        description: 'Apply the same aspect ratio cleanly across a whole batch of portraits or product images.',
      },
    ],
    faqs: [
      {
        question: 'Which aspect ratio presets are built into the cropper?',
        answer: 'Built-in presets include 1:1 Square, 4:5 Portrait, 3:4 Vertical, 16:9 Widescreen, 9:16 Story, and 3:2 Classic.',
      },
      {
        question: 'Can I keep the entire photo without cutting anything off?',
        answer: 'Yes. Switch to the Border & Pad mode right inside the tool to fit your photo into any aspect ratio with clean padding instead of cropping.',
      },
      {
        question: 'Does cropping reduce image sharpness?',
        answer: 'No. Cropping extracts exact native pixels from your original image and exports cleanly in PNG or WebP.',
      },
      {
        question: 'Are my personal photos uploaded while cropping?',
        answer: 'Never. All cropping happens strictly inside your local browser.',
      },
    ],
  },
  'add-border-to-photo': {
    navLabel: 'Add Border & Pad',
    title: 'Add White Border & Pad Photos Without Cropping | Moklu',
    metaDescription:
      'Add clean white, colored, or gradient borders and pad photos to 1:1, 4:5, or 3:4 social ratios without cropping a pixel. 100% browser-local.',
    badge: 'No-Crop Border & Ratio Padding',
    h1: 'Add Borders & Pad Photos to Any Aspect Ratio',
    subtitle:
      'Give photography a gallery mat border or fit horizontal shots into 4:5 and 1:1 social feeds without cropping, complete with rounded corners, soft shadows, and zero uploads.',
    steps: [
      {
        title: 'Drop your uncropped photos',
        description: 'Load landscape, portrait, or panoramic photos directly in your browser.',
      },
      {
        title: 'Choose target ratio, border width, and backdrop',
        description: 'Pick classic gallery white, dark charcoal, or gradient backdrops plus optional rounded corners and soft drop shadow.',
      },
      {
        title: 'Export padded PNG or WebP',
        description: 'Download single or batch bordered photos locally, or open in Studio to add camera EXIF captions.',
      },
    ],
    highlights: [
      {
        title: 'Zero Cropping Compromises',
        description: 'Post wide 3:2 or 16:9 photography on Instagram and Xiaohongshu with every millimeter preserved.',
      },
      {
        title: 'Gallery Mat & Polaroid Aesthetic',
        description: 'Combine generous white margins, subtle corner radius, and soft shadows for an instant fine-art frame.',
      },
      {
        title: 'Batch Consistent Feeds',
        description: 'Apply identical border thickness and background color across an entire photo series in one click.',
      },
    ],
    faqs: [
      {
        question: 'How do I fit a horizontal 16:9 photo into a 4:5 Instagram post without cropping?',
        answer: 'Select the 4:5 ratio preset in Border & Pad mode and pick a white or dark backdrop. Moklu centers your full uncropped photo automatically.',
      },
      {
        question: 'Can I add rounded corners and a subtle shadow to the inner photo?',
        answer: 'Yes. Toggle drop shadow and tune corner radius and border thickness with real-time preview.',
      },
      {
        question: 'Can I add camera focal length or watermark captions on the white border?',
        answer: 'Click Open in Studio to place custom typography neatly inside the bottom margin of your framed photo.',
      },
      {
        question: 'Does adding borders upload my high-res photography?',
        answer: 'No. Everything renders strictly on your local device at full quality.',
      },
    ],
  },
  'id-card-watermark': {
    navLabel: 'ID Card Watermark',
    title: 'Offline ID Card A4 Sheet & Anti-Fraud Watermark Maker | Moklu',
    metaDescription:
      'Combine front and back ID card photos onto a 300 DPI A4 print sheet with customizable anti-fraud watermarks. 100% offline browser-local, never uploaded.',
    badge: '100% Offline · 300 DPI A4 · Anti-Fraud',
    h1: 'ID Card A4 Composer & Anti-Fraud Watermark Tool',
    subtitle:
      'Place ID card front and back at exact physical ISO/IEC 7810 ID-1 scale onto a print-ready A4 sheet with diagonal security watermarks, 100% offline inside your browser.',
    steps: [
      {
        title: 'Load ID front and back locally',
        description: 'Select front and back photos (or a single certificate). Disconnect the internet first if you want extra peace of mind.',
      },
      {
        title: 'Customize your anti-fraud watermark',
        description: 'Enter purpose-specific text (e.g. "FOR BANK VERIFICATION ONLY"), adjust opacity, angle, tiled vs. card-only mode, and optional B&W photocopy look.',
      },
      {
        title: 'Download print-ready 300 DPI A4 PNG',
        description: 'Export a crisp 2480×3508 A4 sheet scaled to real 85.6mm × 54mm card dimensions ready for immediate printing.',
      },
    ],
    highlights: [
      {
        title: 'True 1:1 Physical Card Proportions',
        description: 'Maps standard 85.6mm × 54mm ID cards to exact 1011×638 px dimensions on a 300 DPI A4 canvas.',
      },
      {
        title: 'Tamper-Resistant Tiled Watermarks',
        description: 'Overlay diagonal semi-transparent purpose text across the card surface so copies cannot be reused elsewhere.',
      },
      {
        title: 'Verifiably Zero Network Uploads',
        description: 'Enforced by strict browser CSP and zero upload endpoints, so your identity documents never leave RAM.',
      },
    ],
    faqs: [
      {
        question: 'Is it truly safe to process my ID card or passport here?',
        answer: 'Yes. Moklu has no file-upload backend at all. You can load this page, turn on Airplane Mode, and generate your watermarked A4 sheet completely offline.',
      },
      {
        question: 'Will the printed ID card match actual physical card size on A4 paper?',
        answer: 'Yes. The 300 DPI A4 layout (2480×3508 px) renders each card at 1011×638 px, matching the standard 85.6mm × 54mm ID-1 size when printed at 100% scale.',
      },
      {
        question: 'What text should I write in an anti-fraud ID watermark?',
        answer: 'Specify the exact recipient, purpose, and date, for example: "For Apartment Lease Application Only · Invalid Otherwise · Nov 2026".',
      },
      {
        question: 'Can I make the output look like a traditional black-and-white photocopy?',
        answer: 'Yes. Toggle the B&W Photocopy filter to convert color phone snapshots into a clean monochrome print sheet.',
      },
    ],
  },
}
