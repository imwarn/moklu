# bridge/
> L2 | Parent: ../GEMINI.md

Member list
studioHandoff.ts: Defines `StudioHandoffPayload` (including `mode: 'mockup' | 'canvas' | 'carousel' | 'layers'`, `layers`, `background`, `theme`, `screenshotFit`, `scaleFactor`, `browserChrome`, `redactions`), `StudioRedactionRegion`, `renderRedactionCropOnCanvas()`, `stageImagesIntoStudio()`, and `stageImagesIntoStudioAfterBootstrap()`, registering browser-generated images in `useAssetStore` and staging editable `SlideGroup` layouts (including non-destructive Blur, Pixelate, and Spotlight overlay layers above unmodified screenshots) in `useEditorStore`.
studioHandoff.test.ts: Unit tests covering mockup, canvas, carousel, multi-layer collage, and non-destructive blur/pixelate/spotlight redaction handoffs (including `imageSmoothingEnabled = false` offscreen pixelation, `contain`/`cover` coordinate projection, and >4096px uniform scaling), user style preservation, non-destructive SlideGroup preservation, and empty-payload safety.

[PROTOCOL]: Update this header on change, then check GEMINI.md
