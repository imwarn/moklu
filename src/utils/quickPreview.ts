import { getPhoneSpec } from '@/assets/mockups/specs'
import { getQuickMockupPlacement, type QuickMockup } from '@/utils/quickDesign'

export interface QuickPreviewGeometry {
  frameX: number
  frameY: number
  frameWidth: number
  frameHeight: number
  screenX: number
  screenY: number
  screenWidth: number
  screenHeight: number
  cornerRadius: number
  scale: number
}

/**
 * Derive live-preview geometry from the SAME frame spec and placement policy
 * used when saving a Quick Design. Do not store a second set of device sizes.
 */
export function getQuickPreviewGeometry(model: QuickMockup, width: number, height: number): QuickPreviewGeometry {
  const spec = getPhoneSpec(model)
  const placement = getQuickMockupPlacement(model, width, height)
  return {
    frameX: placement.x,
    frameY: placement.y,
    frameWidth: spec.frameWidth * placement.scale,
    frameHeight: spec.frameHeight * placement.scale,
    screenX: placement.x + spec.screen.x * placement.scale,
    screenY: placement.y + spec.screen.y * placement.scale,
    screenWidth: spec.screen.width * placement.scale,
    screenHeight: spec.screen.height * placement.scale,
    cornerRadius: spec.screen.cornerRadius * placement.scale,
    scale: placement.scale,
  }
}

/** SVG image embedding must escape XML characters; data URLs are not remote fetches. */
export function makeSvgImageDataUrl(xml: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml)
}
