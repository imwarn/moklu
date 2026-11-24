# bridge/
> L2 | Parent: ../GEMINI.md

Member list
studioHandoff.ts: Defines `StudioHandoffPayload` (including `mode: 'mockup' | 'canvas' | 'carousel' | 'layers'`, `layers`, `background`, `theme`, `screenshotFit`, `scaleFactor`, `browserChrome`), `stageImagesIntoStudio()`, and `stageImagesIntoStudioAfterBootstrap()`, registering browser-generated images in `useAssetStore` and staging editable `SlideGroup` layouts in `useEditorStore` (scaling >4096px multi-layer canvases and layer coords/radii uniformly).
studioHandoff.test.ts: Unit tests covering mockup, canvas, carousel, and multi-layer collage handoffs (solid/gradient/transparent backgrounds, >4096px uniform scaling, rotation, cornerRadius), user style preservation, non-destructive SlideGroup preservation, and empty-payload safety.

[PROTOCOL]: Update this header on change, then check GEMINI.md
