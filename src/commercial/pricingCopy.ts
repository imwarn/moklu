/**
 * [INPUT]: depends on ProFeature from ./entitlements; depends on BRAND_NAME from @/config
 * [OUTPUT]: exports PricingLocale, PricingModalLabels, ResolvedPricingLabels, and resolvePricingLabels()
 * [POS]: Localized copy registry (EN/ZH/JA/KO) for PricingModal; separated from TSX to satisfy Fast Refresh
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import { BRAND_NAME } from '@/config'
import type { ProFeature } from './entitlements'

export type PricingLocale = 'en' | 'zh' | 'ja' | 'ko'

export interface PricingModalLabels {
  title?: string
  subtitle?: string
  closeLabel?: string
  freePlanName?: string
  freePlanPrice?: string
  freePlanTagline?: string
  freeFeatures?: string[]
  freeCta?: string
  proPlanName?: string
  proPlanPrice?: string
  proPlanBadge?: string
  proPlanTagline?: string
  proFeatureLabels?: Record<ProFeature, string>
  proPreviewEnableCta?: string
  proPreviewDisableCta?: string
  proActiveBadge?: string
  proPreviewActiveBadge?: string
  footerNote?: string
}

export type ResolvedPricingLabels = Required<PricingModalLabels>

const DEFAULT_PRICING_COPY: Record<PricingLocale, ResolvedPricingLabels> = {
  en: {
    title: `${BRAND_NAME} Plans`,
    subtitle: 'All core browser tools and 2K PNG exports stay 100% free with zero watermarks.',
    closeLabel: 'Close pricing dialog',
    freePlanName: `${BRAND_NAME} Free`,
    freePlanPrice: '$0',
    freePlanTagline: 'Local-first tools for daily screenshots, image utilities, and Studio editing.',
    freeFeatures: [
      'All 6 browser tools (Mockup, Merge, Split, Compress, Resize, ID Watermark)',
      '100% local processing: images never leave your browser',
      'Clean 2K PNG/WebP/JPEG exports with zero watermarks',
      'Full Konva Studio multi-layer editor & single-slide exports',
    ],
    freeCta: 'Continue with Free',
    proPlanName: `${BRAND_NAME} Studio Pro`,
    proPlanPrice: 'Coming soon',
    proPlanBadge: 'Studio Pro',
    proPlanTagline: 'Built for app teams shipping multi-device launch assets at scale.',
    proFeatureLabels: {
      'export-4k-batch': '4K ultra-HD & multi-locale batch ZIP export',
      'pro-mockup-pack': 'Pro device mockup pack (Clay, 3D angles, multi-device scenes)',
      'brand-kit-presets': 'Reusable Brand Kit presets & team color/font tokens',
      'cloud-ai-quota': 'Managed cloud AI copy & screenshot translation quota',
    },
    proPreviewEnableCta: 'Enable Pro Preview',
    proPreviewDisableCta: 'Disable Pro Preview',
    proActiveBadge: 'Pro Active',
    proPreviewActiveBadge: 'Pro Preview Active',
    footerNote: 'No credit card required. Toggle Pro Preview locally to evaluate upcoming Pro workflows.',
  },
  zh: {
    title: `${BRAND_NAME} 方案对比`,
    subtitle: '所有基础浏览器图片工具与 2K PNG 导出永久免费、无水印。',
    closeLabel: '关闭定价弹窗',
    freePlanName: `${BRAND_NAME} 免费版`,
    freePlanPrice: '¥0',
    freePlanTagline: '面向日常截图美化、图片处理与 Studio 图层编辑的本地优先工具箱。',
    freeFeatures: [
      '全部 6 款浏览器工具（样机套壳、长图拼接、九宫格切图、压缩、改尺寸、证件水印）',
      '100% 本地浏览器处理，原图不上传服务器',
      '纯净 2K PNG/WebP/JPEG 导出，零水印',
      '完整 Konva Studio 多图层编辑器与单页导出',
    ],
    freeCta: '继续使用免费版',
    proPlanName: `${BRAND_NAME} Studio Pro`,
    proPlanPrice: '即将推出',
    proPlanBadge: '专业版',
    proPlanTagline: '为应用发布团队与独立开发者打造的高效多设备出图工作流。',
    proFeatureLabels: {
      'export-4k-batch': '4K 超清画质与多语言批量 ZIP 导出',
      'pro-mockup-pack': '专业样机套件（Clay 极简、3D 倾斜、多设备组合场景）',
      'brand-kit-presets': '可复用品牌套件预设与团队色彩/字体规范',
      'cloud-ai-quota': '托管云端 AI 文案润色与多语言翻译额度',
    },
    proPreviewEnableCta: '开启 Pro 体验模式',
    proPreviewDisableCta: '关闭 Pro 体验模式',
    proActiveBadge: 'Pro 已激活',
    proPreviewActiveBadge: 'Pro 体验中',
    footerNote: '无需绑定支付方式，可随时在本地切换 Pro 体验模式预览专业版能力。',
  },
  ja: {
    title: `${BRAND_NAME} プラン`,
    subtitle: '基本ブラウザツールと 2K PNG 書き出しはずっと無料・透かしなし。',
    closeLabel: '料金ダイアログを閉じる',
    freePlanName: `${BRAND_NAME} Free`,
    freePlanPrice: '¥0',
    freePlanTagline: '日々のスクリーンショット整形・画像ユーティリティ・Studio編集に。',
    freeFeatures: [
      '全6種のブラウザツール（モックアップ・結合・分割・圧縮・リサイズ・透かし）',
      '100% ブラウザ内処理で画像をサーバーに送信しません',
      '透かしなしの 2K PNG/WebP/JPEG 書き出し',
      'Konva Studio のマルチレイヤー編集と単体書き出し',
    ],
    freeCta: '無料プランで続ける',
    proPlanName: `${BRAND_NAME} Studio Pro`,
    proPlanPrice: '近日公開',
    proPlanBadge: 'Studio Pro',
    proPlanTagline: '複数デバイス・多言語リリース向けのアセット量産ワークフロー。',
    proFeatureLabels: {
      'export-4k-batch': '4K 高解像度＆多言語一括 ZIP 書き出し',
      'pro-mockup-pack': 'Pro モックアップパック（クレイ・3D アングル・複数端末）',
      'brand-kit-presets': 'ブランドキットプリセット＆チーム用カラー/フォント管理',
      'cloud-ai-quota': 'クラウド AI コピー生成＆多言語翻訳クォータ',
    },
    proPreviewEnableCta: 'Pro プレビューを有効化',
    proPreviewDisableCta: 'Pro プレビューを無効化',
    proActiveBadge: 'Pro 有効',
    proPreviewActiveBadge: 'Pro プレビュー中',
    footerNote: 'クレジットカード不要。ローカルで Pro プレビューを切り替えて試用できます。',
  },
  ko: {
    title: `${BRAND_NAME} 요금제`,
    subtitle: '모든 기본 브라우저 도구와 2K PNG 내보내기는 워터마크 없이 무료입니다.',
    closeLabel: '요금제 창 닫기',
    freePlanName: `${BRAND_NAME} Free`,
    freePlanPrice: '₩0',
    freePlanTagline: '일상 스크린샷 목업, 이미지 유틸리티 및 Studio 편집을 위한 로컬 우선 도구.',
    freeFeatures: [
      '6가지 브라우저 도구 전체 (목업, 합치기, 분할, 압축, 리사이즈, 신분증 워터마크)',
      '100% 브라우저 로컬 처리, 이미지가 서버로 전송되지 않습니다',
      '워터마크 없는 2K PNG/WebP/JPEG 내보내기',
      'Konva Studio 멀티 레이어 편집 및 단일 슬라이드 내보내기',
    ],
    freeCta: '무료로 계속하기',
    proPlanName: `${BRAND_NAME} Studio Pro`,
    proPlanPrice: '출시 예정',
    proPlanBadge: 'Studio Pro',
    proPlanTagline: '멀티 디바이스·다국어 출시 에셋을 빠르게 제작하는 팀을 위한 플랜.',
    proFeatureLabels: {
      'export-4k-batch': '4K 초고화질 및 다국어 일괄 ZIP 내보내기',
      'pro-mockup-pack': 'Pro 목업 팩 (클레이, 3D 앵글, 멀티 디바이스 씬)',
      'brand-kit-presets': '재사용 가능한 브랜드 키트 프리셋 및 팀 컬러/폰트 토큰',
      'cloud-ai-quota': '클라우드 AI 카피 및 스크린샷 번역 쿼터',
    },
    proPreviewEnableCta: 'Pro 미리보기 켜기',
    proPreviewDisableCta: 'Pro 미리보기 끄기',
    proActiveBadge: 'Pro 활성',
    proPreviewActiveBadge: 'Pro 미리보기 중',
    footerNote: '결제 카드가 필요하지 않습니다. 로컬에서 Pro 미리보기를 자유롭게 전환해 보세요.',
  },
}

export function resolvePricingLabels(
  locale: PricingLocale = 'en',
  overrides?: PricingModalLabels,
): ResolvedPricingLabels {
  const base = DEFAULT_PRICING_COPY[locale] ?? DEFAULT_PRICING_COPY.en
  if (!overrides) return base
  return {
    ...base,
    ...overrides,
    proFeatureLabels: {
      ...base.proFeatureLabels,
      ...(overrides.proFeatureLabels ?? {}),
    },
  }
}
