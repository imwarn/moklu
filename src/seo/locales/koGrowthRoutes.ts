/**
 * [INPUT]: depends on GrowthRouteSlug and RouteCopy types from ../types.ts
 * [OUTPUT]: exports KO_GROWTH_ROUTES containing Korean SEO copy for the 9 high-intent growth slugs (ipad-mockup, watch-mockup, stitch-screenshots, heic-to-jpg, remove-exif, compress-image-to-200kb, redact-screenshot, annotate-image, draw-on-image)
 * [POS]: growth route-copy chunk for ko within src/seo/locales, merged into KO_LOCALE by ./ko.ts to keep every file <= 800 lines
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { GrowthRouteSlug, RouteCopy } from '../types.ts'

export const KO_GROWTH_ROUTES: Record<GrowthRouteSlug, RouteCopy> = {
  'ipad-mockup': {
    navLabel: 'iPad 목업',
    title: '무료 iPad Pro 13 태블릿 목업 생성기 (100% 로컬) | Moklu',
    metaDescription:
      'iPadOS 앱, 대시보드, 디지털 플래너 스크린샷을 깔끔한 iPad Pro 13 및 안드로이드 태블릿 프레임에 담아보세요. 100% 브라우저 로컬 렌더링, 업로드 제로.',
    badge: 'iPad Pro 13 · 태블릿 프레임',
    h1: 'iPad Pro 13 & 태블릿 목업 생성기',
    subtitle:
      'iPadOS 분할 화면, BI 대시보드, 태블릿 노트 캡처를 정교한 iPad Pro 13 또는 안드로이드 태블릿 베젤과 부드러운 배경 그림자로 브라우저에서 즉시 완성하세요.',
    steps: [
      {
        title: '태블릿 스크린샷 드롭 또는 붙여넣기',
        description: 'Cmd/Ctrl+V로 클립보드 이미지를 붙여넣거나 iPadOS 시뮬레이터 및 안드로이드 태블릿 캡처를 끌어다 놓으세요.',
      },
      {
        title: 'iPad Pro 13 · 안드로이드 태블릿 프레임 선택',
        description: '가로 4:3·16:9 또는 세로 비율을 고르고 여백, 그림자, Aurora·Midnight·Warm Paper 배경 테마를 조절합니다.',
      },
      {
        title: '무워터마크 PNG 저장 또는 Studio 확장',
        description: '고해상도 2K PNG를 즉시 다운로드하거나 Moklu Studio로 넘겨 iPhone, 브라우저 프레임과 함께 복합 연출하세요.',
      },
    ],
    highlights: [
      {
        title: '정확한 13인치 태블릿 베젤 비율',
        description: '최신 iPad Pro 13과 안드로이드 태블릿의 균형 잡힌 슬림 베젤로 상단 바와 툴바가 잘리지 않게 유지합니다.',
      },
      {
        title: '앱스토어 iPad 등록 이미지 최적화',
        description: 'App Store Connect 태블릿 스크린샷, 제품 소개 페이지, IR 피치덱에 바로 쓸 수 있는 깔끔한 가로 목업을 생성합니다.',
      },
      {
        title: '서버 업로드 없는 로컬 보안 렌더링',
        description: '출시 전 태블릿 빌드나 내부 대시보드 화면이 외부 서버로 전송되지 않고 기기 브라우저 메모리에서만 처리됩니다.',
      },
    ],
    faqs: [
      {
        question: 'iPad 목업 도구에서 어떤 태블릿과 기기 프레임을 전환할 수 있나요?',
        answer: 'iPad Pro 13과 안드로이드 태블릿은 물론 Chrome, Safari, 미니멀 창, iPhone 16 Pro, Pixel 9, Apple Watch, Wear OS, 프레임리스까지 총 13개 프레임을 즉시 전환할 수 있습니다.',
      },
      {
        question: '가로 모드와 세로 모드 iPad 스크린샷을 모두 지원하나요?',
        answer: '네. 태블릿 분할 화면에 어울리는 가로 4:3·16:9 캔버스와 SNS 피드용 세로·정사각형 캔버스를 자유롭게 전환할 수 있습니다.',
      },
      {
        question: '한 장의 홍보 이미지에 iPad와 iPhone을 나란히 배치할 수 있나요?',
        answer: '네. Studio에서 열기를 클릭하면 멀티 레이어 캔버스에서 iPad, iPhone 16 Pro, 브라우저 창과 헤드라인을 한 화면에 배치할 수 있습니다.',
      },
      {
        question: '생성된 iPad 목업 PNG에 워터마크가 붙나요?',
        answer: '아니요. 표준 고해상도 PNG 내보내기는 무료이며 어떠한 Moklu 워터마크도 추가되지 않습니다.',
      },
    ],
  },
  'watch-mockup': {
    navLabel: '스마트워치 목업',
    title: '무료 Apple Watch & 스마트워치 목업 생성기 | Moklu',
    metaDescription:
      'watchOS와 Wear OS 운동, 건강, 워치페이스 화면을 정교한 Apple Watch 및 원형 Wear OS 프레임으로 빠르게 제작하세요. 100% 브라우저 로컬, 무워터마크.',
    badge: 'Apple Watch · Wear OS 프레임',
    h1: 'Apple Watch & 스마트워치 목업 생성기',
    subtitle:
      'watchOS 컴플리케이션, 피트니스 기록, Wear OS 타일 화면을 깔끔한 Apple Watch 케이스 또는 원형 Wear OS 베젤에 담아 부드러운 스튜디오 배경으로 로컬 출력합니다.',
    steps: [
      {
        title: 'watchOS 또는 Wear OS 캡처 불러오기',
        description: '스마트워치 시뮬레이터나 실기기 스크린샷을 정사각형 캔버스에 드롭하거나 기본 샘플로 즉시 미리보기하세요.',
      },
      {
        title: 'Apple Watch와 원형 Wear OS 베젤 전환',
        description: '둥근 사각형 Apple Watch 케이스와 원형 Wear OS 프레임 중 선택하고 배경 그라데이션과 그림자를 맞춥니다.',
      },
      {
        title: '고화질 PNG 저장 또는 Studio 동시 연출',
        description: '깔끔한 정사각형 PNG를 바로 저장하거나 Moklu Studio로 넘겨 연동 iPhone 앱 화면과 함께 구성하세요.',
      },
    ],
    highlights: [
      {
        title: '사각형 Apple Watch · 원형 Wear OS 모두 지원',
        description: '곡선 베젤과 원형 다이얼 경계를 매끄럽게 처리해 거친 픽셀 테두리 없이 선명하게 마무리합니다.',
      },
      {
        title: '컴패니언 앱 동시 쇼케이스 워크플로우',
        description: 'Moklu Studio로 한 번에 이동해 Apple Watch와 iPhone 16 Pro를 한 장의 출시 배너에 나란히 배치할 수 있습니다.',
      },
      {
        title: '서버 대기 없는 60fps 로컬 캔버스',
        description: '비공개 웨어러블 UI 시안도 외부 업로드 없이 브라우저 메모리에서 즉시 전환하고 저장합니다.',
      },
    ],
    faqs: [
      {
        question: 'Apple Watch 외에 원형 Wear OS 스마트워치 프레임도 있나요?',
        answer: '네. Apple Watch 프레임과 원형 Wear OS 프레임이 모두 내장되어 있으며 스크린샷을 다시 올리지 않고 바로 비교할 수 있습니다.',
      },
      {
        question: '스마트워치 목업에는 어떤 캔버스 비율이 가장 잘 어울리나요?',
        answer: '기본 1:1 정사각형은 제품 기능 카드와 포트폴리오에 균형감이 뛰어나며, SNS 홍보에는 4:5 또는 9:16 비율을 추천합니다.',
      },
      {
        question: 'Apple Watch와 iPhone을 한 이미지에 같이 보여줄 수 있나요?',
        answer: '네. Studio에서 열기를 누르면 멀티 레이어 캔버스에 Apple Watch와 iPhone 16 Pro 프레임을 함께 배치하고 문구를 추가할 수 있습니다.',
      },
      {
        question: '스마트워치 목업 내보내기 횟수 제한이 있나요?',
        answer: '없습니다. 브라우저 로컬에서 처리되므로 무료로 무제한 무워터마크 PNG를 저장할 수 있습니다.',
      },
    ],
  },
  'stitch-screenshots': {
    navLabel: '긴 스크린샷 자동 이어붙이기',
    title: '스크롤 긴 스크린샷 이어붙이기 (자동 겹침 제거·미세 정렬) | Moklu',
    metaDescription:
      '카카오톡·슬랙 대화 캡처, 긴 웹페이지, 영화 자막 스크린샷을 100% 로컬 픽셀 매칭으로 겹침 자동 제거 및 고정 상·하단 바 자르기, 고스트 오버레이 이음새 미세 조정까지 지원합니다.',
    badge: '자동 겹침 제거 · 고스트 이음새 조정',
    h1: '스크롤 긴 스크린샷 스마트 이어붙이기',
    subtitle:
      '대화 내역, 긴 아티클, 자막 캡처의 겹친 스크롤 구간을 100% 로컬 픽셀 매칭으로 자동 제거하고 고정 상·하단 바 자르기와 반투명 고스트 오버레이 이음새 미세 조정을 제공합니다.',
    steps: [
      {
        title: '연속 스크롤 스크린샷을 순서대로 추가',
        description: '메신저 대화, 웹페이지, 자막 캡처를 끌어놓거나 붙여넣고 드래그로 순서를 정리하세요.',
      },
      {
        title: '겹침 자동 제거 및 고스트 오버레이 미세 조정',
        description: '로컬 픽셀 매칭이 중복 행과 고정 상·하단 바를 자동 제거하며, 필요한 이음새는 반투명 고스트 슬라이더로 1px 단위로 맞춥니다.',
      },
      {
        title: '고화질 PNG 저장, 복사 또는 Studio 모자이크 연계',
        description: '깔끔한 긴 이미지를 다운로드하거나 클립보드에 복사하고, Studio로 넘겨 민감 정보 가리기와 주석을 이어가세요.',
      },
    ],
    highlights: [
      {
        title: '100% 로컬 스크롤 겹침 자동 제거',
        description: '연속 캡처 사이의 중복된 말풍선과 본문 줄을 브라우저 메모리에서 자동 탐지해 끊김 없이 자연스럽게 이어줍니다.',
      },
      {
        title: '고정 상단·하단 내비게이션 바 자동 자르기',
        description: '캡처마다 반복되는 앱 상단 헤더, 상태 표시줄, 하단 입력창을 깔끔하게 정리해 이질감을 없앱니다.',
      },
      {
        title: '반투명 고스트 오버레이 정밀 이음새 제어',
        description: '대비가 낮은 화면이나 영화 자막을 합칠 때도 특정 이음새의 겹침 픽셀을 실시간 미리보기로 직접 보정할 수 있습니다.',
      },
    ],
    faqs: [
      {
        question: '긴 스크린샷 자동 이어붙이기와 세로 이미지 이어붙이기의 차이는 무엇인가요?',
        answer: '긴 스크린샷 자동 이어붙이기는 스크롤 캡처를 위해 스마트 겹침 제거와 고정 상·하단 바 자르기가 기본 활성화되어 있으며, 세로 이미지 이어붙이기는 사진 원본을 그대로 연결하는 기본 모드입니다.',
      },
      {
        question: '자동 겹침 감지가 미묘하게 어긋난 구간은 수동으로 조절할 수 있나요?',
        answer: '네. 개별 이음새의 반투명 고스트 오버레이 슬라이더로 정확한 픽셀 오프셋을 수동 지정할 수 있으며, 겹침이 불명확한 프레임은 원본을 안전하게 유지합니다.',
      },
      {
        question: '사적인 메신저 대화나 업무 슬랙 캡처를 합쳐도 서버로 전송되지 않나요?',
        answer: '전혀 전송되지 않습니다. 픽셀 매칭과 캔버스 합성이 100% 로컬 브라우저에서 실행되며, 합친 뒤 바로 로컬 모자이크 처리도 가능합니다.',
      },
      {
        question: '이어붙인 긴 스크린샷 높이가 8192px를 넘으면 어떻게 되나요?',
        answer: '브라우저 안정성을 위해 8192px / 64MP 한도에서 비율을 유지해 자동 축소하며 화면에 안내 배지를 명확히 표시합니다.',
      },
    ],
  },
  'heic-to-jpg': {
    navLabel: 'HEIC JPG 변환',
    title: '아이폰 HEIC · AVIF to JPG 무료 변환 (100% 로컬) | Moklu',
    metaDescription:
      '아이폰 .heic / .heif 및 .avif 사진을 서버 업로드 없이 브라우저에서 JPG, PNG, WebP로 일괄 변환하세요. 네이티브 디코드 우선 + 로컬 WASM 폴백 지원.',
    badge: '로컬 HEIC / AVIF 디코딩 · 업로드 제로',
    h1: '아이폰 HEIC · AVIF 사진 로컬 일괄 JPG 변환',
    subtitle:
      '개인 사진첩을 외부 서버에 올리지 않고도 아이폰 .heic, .heif 및 .avif 이미지를 호환성 높은 JPEG, PNG, WebP로 일괄 변환해 개별 저장하거나 ZIP으로 묶어 받으세요.',
    steps: [
      {
        title: '아이폰 HEIC, HEIF 또는 AVIF 사진 드롭',
        description: '한 장부터 수십 장의 아이폰 원본 사진을 드롭하면 형식을 자동 인식해 기기 메모리에서 로컬 변환을 준비합니다.',
      },
      {
        title: 'JPG · PNG · WebP 형식과 품질 선택',
        description: '호환성 높은 JPEG가 기본 선택되어 있으며, 품질·최대 너비·목표 KB 압축과 자동 EXIF 제거를 함께 적용할 수 있습니다.',
      },
      {
        title: '개별 저장 또는 원클릭 로컬 ZIP 다운로드',
        description: '변환 전후 용량을 실시간으로 확인하고 바로 저장하거나 전체 결과를 단일 ZIP 파일로 내려받으세요.',
      },
    ],
    highlights: [
      {
        title: '네이티브 디코딩 우선 + 로컬 WASM 폴백',
        description: 'Safari에서는 추가 다운로드 없이 네이티브 디코딩을 사용하고, Chrome·Edge·Firefox에서는 로컬 WebAssembly 디코더로 완벽 변환합니다.',
      },
      {
        title: '개인 사진과 서류 유출 걱정 제로',
        description: '원본 사진을 클라우드로 전송하는 변환 사이트와 달리 모든 HEIC 바이트가 사용자 기기 내부에서만 처리됩니다.',
      },
      {
        title: '일괄 변환과 용량 최적화를 한 번에',
        description: '다수의 HEIC 파일을 JPG·PNG·WebP로 바꾸면서 동시에 200KB 이하 경량화와 ZIP 묶음 저장까지 끝낼 수 있습니다.',
      },
    ],
    faqs: [
      {
        question: 'Chrome이나 Edge에서도 서버 업로드 없이 HEIC를 JPG로 변환할 수 있나요?',
        answer: '네. 먼저 브라우저 네이티브 디코딩을 시도하고 지원하지 않는 환경에서는 클라이언트 측 WebAssembly HEIC 디코더를 자동 로드해 100% 로컬에서 변환합니다.',
      },
      {
        question: '아이폰 HEIC/HEIF 외에 AVIF 사진도 JPG나 PNG로 바꿀 수 있나요?',
        answer: '네. .heic, .heif, .avif, WebP, PNG 이미지를 함께 끌어다 놓고 원하는 출력 형식으로 일괄 변환할 수 있습니다.',
      },
      {
        question: 'HEIC를 JPG로 변환하면 촬영 GPS 위치 정보도 함께 옮겨지나요?',
        answer: '아니요. HTML5 Canvas로 재인코딩하는 과정에서 GPS 좌표와 카메라 EXIF 메타데이터가 자동으로 제거되어 안전하게 공유할 수 있습니다.',
      },
      {
        question: '하루 변환 장수 제한이나 회원가입이 필요한가요?',
        answer: '필요 없습니다. 모든 연산이 사용자 기기의 브라우저에서 수행되므로 무료로 무제한 변환할 수 있습니다.',
      },
    ],
  },
  'remove-exif': {
    navLabel: 'EXIF · GPS 제거',
    title: '사진 EXIF 및 GPS 위치 정보 로컬 확인·완전 삭제 | Moklu',
    metaDescription:
      'JPEG, PNG, WebP, HEIC 사진에 숨겨진 GPS 위도·경도, 카메라 기종, 촬영 시각을 브라우저에서 직접 검사하고 서버 업로드 없이 EXIF 메타데이터를 완전 삭제하세요.',
    badge: 'EXIF · GPS 검사 & 오프라인 삭제',
    h1: '사진 EXIF & GPS 위치 정보 확인 및 완전 삭제',
    subtitle:
      '중고 거래, 커뮤니티, SNS에 사진을 올리기 전에 숨겨진 GPS 좌표·카메라 모델·소프트웨어·촬영 시각을 로컬에서 검사하고 메타데이터가 전혀 없는 깨끗한 이미지로 내보내세요.',
    steps: [
      {
        title: '사진을 드롭해 숨은 EXIF · GPS 스캔',
        description: 'JPEG, PNG, WebP, HEIC 파일을 불러오면 내장 바이너리 파서가 메모리 안에서 민감한 위치·기기 태그를 즉시 분석합니다.',
      },
      {
        title: '감지된 GPS 좌표와 카메라 정보 확인',
        description: '파일을 업로드하지 않고도 위도·경도, 제조사/기종, 노출 정보, 원본 촬영 시각 포함 여부를 한눈에 확인합니다.',
      },
      {
        title: '메타데이터가 제거된 안전한 파일 저장',
        description: 'EXIF와 GPS가 완전히 삭제된 사진을 개별 저장하거나 일괄 ZIP으로 워터마크 없이 다운로드하세요.',
      },
    ],
    highlights: [
      {
        title: '무의존성 바이너리 EXIF 정밀 분석',
        description: '브라우저 DataView로 JPEG APP1, PNG eXIf, WebP EXIF, HEIC EXIF 헤더를 직접 읽어 투명하게 표시합니다.',
      },
      {
        title: '집 주소와 동선 노출을 사전에 차단',
        description: '중고거래 사진이나 블로그 원본 이미지에 남기 쉬운 GPS 좌표와 촬영 시간 기록을 확실하게 지워줍니다.',
      },
      {
        title: '오프라인에서도 검증 가능한 로컬 실행',
        description: '페이지를 연 뒤 Wi-Fi를 꺼도 동일하게 작동해 프라이버시 삭제를 위해 원본을 서버에 맡기는 모순을 없앴습니다.',
      },
    ],
    faqs: [
      {
        question: '어떤 민감한 EXIF 메타데이터를 확인하고 지울 수 있나요?',
        answer: 'GPS 위도·경도, 카메라 제조사와 모델, 편집 소프트웨어, 원본 촬영 일시, ISO, 조리개, 셔터 속도, 회전 태그를 감지하고 내보내기 시 모두 삭제합니다.',
      },
      {
        question: 'EXIF 검사 및 삭제는 어떤 파일 형식을 지원하나요?',
        answer: 'JPEG, PNG, WebP, HEIC/HEIF 내부의 EXIF 블록을 분석할 수 있으며 메타데이터가 제거된 JPEG, WebP, PNG로 저장됩니다.',
      },
      {
        question: '클라우드 사이트 대신 브라우저 로컬 EXIF 제거기를 써야 하는 이유는 무엇인가요?',
        answer: '집 주소 GPS가 포함된 원본 사진을 외부 서버에 올리는 순간 개인정보가 서버를 거치게 됩니다. 로컬 도구는 원본이 기기 밖으로 나가지 않도록 보장합니다.',
      },
      {
        question: 'EXIF를 삭제하면 세로로 찍은 스마트폰 사진이 옆으로 눕지 않나요?',
        answer: '눕지 않습니다. 브라우저가 방향 태그에 맞춰 픽셀을 바르게 세운 뒤 재인코딩하므로 세로 사진이 정상 방향으로 저장됩니다.',
      },
    ],
  },
  'compress-image-to-200kb': {
    navLabel: '200KB 이하 압축',
    title: '이미지 200KB 이하 정확 압축 (100KB / 500KB 지원) | Moklu',
    metaDescription:
      '입사 지원, 비자·시험 접수, 관공서 업로드 용량 제한에 맞춰 이미지를 200KB·100KB·500KB 이하로 로컬 이진 탐색 압축하세요. 서버 업로드 제로, 일괄 ZIP 지원.',
    badge: '목표 KB 정밀 압축 · 로컬 이진 탐색',
    h1: '이미지를 200KB 이하로 정확하게 용량 줄이기',
    subtitle:
      '채용 포털, 자격증 접수, 비자·공공기관 사이트의 까다로운 100KB / 200KB / 500KB 용량 제한을 브라우저 로컬 이진 탐색으로 화질 손실을 최소화하며 정확히 맞춥니다.',
    steps: [
      {
        title: '용량 초과 증명사진 또는 제출 이미지 추가',
        description: '포털 업로드 한도를 넘는 JPEG, PNG, WebP, HEIC 사진을 한 장 또는 여러 장 끌어다 놓으세요.',
      },
      {
        title: '200KB, 100KB, 500KB 또는 직접 KB 입력',
        description: '로컬 이진 탐색으로 목표 KB 이하에서 가장 선명한 품질을 자동 찾으며, 필요 시 비율 유지 축소로 확실히 맞춥니다.',
      },
      {
        title: '목표 달성 용량 확인 후 즉시 저장',
        description: '압축 전후 KB 수치와 목표 달성 배지를 확인하고 개별 저장 또는 로컬 ZIP으로 내려받으세요.',
      },
    ],
    highlights: [
      {
        title: '결정적 이진 탐색 기반 최적 화질 유지',
        description: '품질 슬라이더를 여러 번 조정할 필요 없이 200KB 한도 안에서 얻을 수 있는 최고 선명도를 자동으로 계산합니다.',
      },
      {
        title: '원본 픽셀 크기 유지 옵션 제공',
        description: '시험 원서처럼 가로·세로 픽셀 규격이 고정된 경우 치수 유지 옵션을 켜고, 초대형 사진은 자동 축소로 목표 용량을 달성합니다.',
      },
      {
        title: '증명사진·서류 파일 100% 로컬 처리',
        description: '여권 사진, 이력서 증명사진, 제출 서류가 외부 서버로 전송되지 않고 기기 브라우저 RAM에서만 압축됩니다.',
      },
    ],
    faqs: [
      {
        question: '화질을 최대한 지키면서 어떻게 정확히 200KB 이하로 맞추나요?',
        answer: '로컬 브라우저에서 인코더 품질 값을 이진 탐색해 목표 KB 이하 중 가장 높은 품질을 자동 선택하며, 최소 품질에서도 초과하는 초고해상도 사진은 비율을 유지해 축소합니다.',
      },
      {
        question: '200KB 말고 100KB, 500KB나 원하는 KB 수치로도 압축할 수 있나요?',
        answer: '네. 이 페이지는 200KB가 기본 설정되어 있지만 100KB, 500KB 프리셋 또는 임의의 KB 목표치를 한 번의 클릭으로 지정할 수 있습니다.',
      },
      {
        question: '접수 사이트 200KB 제한에는 JPEG와 WebP 중 어떤 형식이 좋나요?',
        answer: '웹사이트 게재용은 같은 용량에서 화질이 뛰어난 WebP가 유리하며, .jpg 파일만 허용하는 채용·관공서 포털이라면 JPEG를 선택하세요.',
      },
      {
        question: '이력서 사진이나 제출 서류가 압축 과정에서 서버로 업로드되나요?',
        answer: '아니요. 모든 이진 탐색과 인코딩이 로컬 브라우저 탭 안에서 100% 오프라인으로 실행됩니다.',
      },
    ],
  },
  'redact-screenshot': {
    navLabel: '스크린샷 모자이크·가리기',
    title: '스크린샷 블러·모자이크·가리기 & 스포트라이트 (로컬) | Moklu',
    metaDescription:
      '공유 전 3초 만에 API 키, 이메일, 전화번호, 고객명을 브라우저 로컬에서 가리세요. 블러, 모자이크, 단색 마스킹, 스포트라이트 강조와 목업 프레임 내보내기까지 업로드 제로.',
    badge: '블러 · 모자이크 · 스포트라이트 · 로컬',
    h1: '스크린샷 로컬 모자이크, 블러 & 스포트라이트',
    subtitle:
      '대시보드, 터미널, 채팅 화면을 공유하기 전 3초 만에 API 토큰·이메일·매출 수치·개인정보를 블러, 모자이크, 단색 마스킹 또는 스포트라이트로 로컬 보호하세요.',
    steps: [
      {
        title: '민감 정보가 담긴 스크린샷 붙여넣기',
        description: '캡처 직후 Cmd/Ctrl+V로 붙여넣거나 파일을 드롭하세요. 가리기 전 원본 이미지는 절대 외부로 전송되지 않습니다.',
      },
      {
        title: '드래그로 블러·모자이크·단색 가리기 또는 강조',
        description: '가릴 영역에 단색 마스킹·블러·모자이크를 그리거나 스포트라이트로 핵심 버튼과 지표만 밝게 강조하세요.',
      },
      {
        title: '목업 프레임 적용 저장 또는 Studio 비파괴 편집',
        description: 'Chrome·iPhone 프레임을 씌워 바로 PNG로 저장하거나 원본이 유지되는 비파괴 레이어로 Studio에 넘겨 화살표와 설명을 더하세요.',
      },
    ],
    highlights: [
      {
        title: '민감 원본을 외부에 올리지 않는 진짜 보안 마스킹',
        description: '가리지 않은 API 키나 고객 목록을 클라우드 블러 사이트에 올리는 위험 없이 브라우저 메모리에서 즉시 처리합니다.',
      },
      {
        title: '4가지 정밀 가리기 및 강조 모드',
        description: '복원 불가능한 단색 마스킹, 부드러운 가우시안 블러, 픽셀 모자이크, 배경을 어둡게 눌러주는 스포트라이트를 상황에 맞게 선택합니다.',
      },
      {
        title: '보안 가리기와 목업 마무리를 한 흐름으로',
        description: '민감 정보를 가린 즉시 브라우저·모바일 프레임으로 감싸 내보내거나 Studio에서 비파괴 레이어로 미세 수정할 수 있습니다.',
      },
    ],
    faqs: [
      {
        question: 'API 키나 비밀번호를 가릴 때 블러, 모자이크, 단색 마스킹 중 무엇이 가장 안전한가요?',
        answer: '인증 토큰, 비밀번호, 주민번호 등 민감 정보는 원본 픽셀을 완전히 덮어쓰는 단색 마스킹(Solid Mask)이 가장 안전하며, 블러와 모자이크는 가벼운 시각적 가리기에 적합합니다.',
      },
      {
        question: '모자이크 박스를 그리기 전에 원본 스크린샷이 서버로 올라가나요?',
        answer: '아니요. 이미지 로딩부터 마스킹 렌더링, PNG 내보내기까지 100% 브라우저 로컬 HTML5 Canvas에서 처리됩니다.',
      },
      {
        question: '스포트라이트(Spotlight) 모드는 어떤 기능을 하나요?',
        answer: '선택한 영역 바깥쪽을 은은하게 어둡게 처리해 핵심 버튼, 지표, 코드 줄로 시선을 즉시 집중시켜 튜토리얼이나 릴리스 노트에 유용합니다.',
      },
      {
        question: 'Moklu Studio로 넘긴 뒤에도 가리기 영역 위치를 다시 수정할 수 있나요?',
        answer: '네. Studio로 전달할 때 원본 스크린샷을 비파괴 상태로 유지하고 마스킹 레이어를 분리해 전달하므로 위치 수정과 화살표·텍스트 추가가 자유롭습니다.',
      },
    ],
  },
  'annotate-image': {
    navLabel: '이미지 주석 달기',
    title: '이미지 · 스크린샷 주석 및 화살표 표시 무료 (100% 로컬) | Moklu',
    metaDescription:
      '스크린샷과 사진에 사각형, 화살표, 텍스트 설명, 자유 브러시 주석을 브라우저에서 바로 추가하세요. 8개 핸들 크기 조절, 실행 취소·다시 실행, 원본 해상도 저장, 업로드 제로.',
    badge: '사각형 · 화살표 · 텍스트 · 브러시',
    h1: '브라우저에서 로컬로 이미지·스크린샷 주석 달기',
    subtitle:
      '버그 리포트, 제품 가이드, UI 피드백 이미지에 벡터 사각형·화살표·더블클릭 편집 텍스트·자유 브러시를 빠르게 얹으세요. 8개 핸들로 레이어를 자유롭게 조절하고 서버 업로드 없이 원본 화질로 저장합니다.',
    steps: [
      {
        title: '주석을 달 스크린샷 붙여넣기 또는 드롭',
        description: '화면 캡처 직후 Cmd/Ctrl+V로 붙여넣거나 PNG, JPEG, WebP, AVIF, HEIC 이미지를 로컬 캔버스에 끌어다 놓으세요.',
      },
      {
        title: '사각형, 화살표, 텍스트, 브러시로 핵심 표시',
        description: '선택(V)·브러시(B)·사각형(R)·화살표(A)·텍스트(T)를 오가며 색상과 선 굵기를 고르고 8개 파란 핸들로 위치를 미세 조정합니다.',
      },
      {
        title: '원본 해상도 저장 또는 채팅창 바로 복사',
        description: '워터마크 없는 PNG / WebP / JPEG로 내려받거나 원클릭 복사로 Slack, Notion, 메신저에 즉시 붙여넣으세요.',
      },
    ],
    highlights: [
      {
        title: '8개 핸들로 조절하는 벡터 레이어 편집',
        description: '그린 사각형, 화살표, 텍스트, 브러시 선이 이미지에 고정되지 않아 언제든 선택해 이동, 크기 조절, 색상 변경, 개별 삭제할 수 있습니다.',
      },
      {
        title: '빠른 단축키와 50단계 실행 취소·다시 실행',
        description: 'V/B/R/A/T 도구 전환, 텍스트 더블클릭 인라인 편집, Delete 삭제, Cmd/Ctrl+Z로 QA 캡처와 문서 이미지를 몇 초 만에 완성합니다.',
      },
      {
        title: '사내 기밀 캡처도 서버 전송 제로',
        description: '내부 대시보드와 미공개 UI 화면이 기기 브라우저 메모리 밖으로 나가지 않으며 로컬 IndexedDB 초안 자동 저장을 지원합니다.',
      },
    ],
    faqs: [
      {
        question: 'Moklu 이미지 주석 도구에는 어떤 표시 기능이 들어 있나요?',
        answer: '8개 핸들 선택 도구, 부드러운 베지어 자유 브러시, 둥근 사각형 강조 박스, 방향 화살표, 대비 외곽선이 적용된 더블클릭 편집 텍스트를 모두 제공합니다.',
      },
      {
        question: '화살표나 사각형을 그린 뒤에도 위치와 크기를 바꿀 수 있나요?',
        answer: '네. 선택 모드(V)에서 원하는 주석 레이어를 클릭하면 드래그 이동, 8개 모서리·변 핸들 크기 조절, 색상·선 굵기 변경, Delete 개별 삭제가 모두 가능합니다.',
      },
      {
        question: '주석을 추가해 저장하면 원본 스크린샷 해상도가 낮아지나요?',
        answer: '아니요. 주석은 정규화 벡터 좌표로 유지되며 내보내기 시 원본 이미지의 전체 해상도 HTML5 Canvas 위에 선명하게 합성됩니다.',
      },
      {
        question: '목업, 리사이즈, 이미지 합치기 작업 중에도 바로 주석을 달 수 있나요?',
        answer: '네. 각 도구의 미리보기 상단에 있는 주석 버튼을 누르면 동일한 벡터 주석 모달이 열리고 저장 시 현재 이미지에 바로 반영됩니다.',
      },
      {
        question: '주석을 추가한 스크린샷이 클라우드 서버에 저장되나요?',
        answer: '절대 저장되지 않습니다. 파일 디코딩, 벡터 편집, IndexedDB 초안 저장, 최종 이미지 합성이 100% 브라우저 내부에서만 실행됩니다.',
      },
    ],
  },
  'draw-on-image': {
    navLabel: '이미지 위에 그리기',
    title: '이미지 · 사진 위에 무료 브러시 그리기 (로컬 펜 마크업) | Moklu',
    metaDescription:
      '사진과 스크린샷 위에 부드러운 벡터 브러시로 동그라미, 밑줄, 자유 스케치를 바로 그려 넣으세요. 8색 프리셋, 선 굵기 조절, 개별 획 이동·삭제, 서버 업로드 제로.',
    badge: '부드러운 벡터 브러시 · 업로드 제로',
    h1: '사진과 이미지 위에 바로 브러시 그리기 & 스케치',
    subtitle:
      '열자마자 자유 브러시 모드로 시작해 사진이나 캡처 위에 핵심 동그라미, 밑줄, 간단한 피드백 메모를 부드럽게 그려 넣으세요. 모든 획이 벡터 레이어로 유지되며 앱 설치 없이 로컬에서 실행됩니다.',
    steps: [
      {
        title: '사진을 열거나 스크린샷을 붙여넣기',
        description: '기기에서 PNG, JPEG, WebP, HEIC 사진을 선택하거나 Cmd/Ctrl+V로 클립보드 캡처를 바로 붙여넣으세요.',
      },
      {
        title: '부드러운 벡터 브러시로 자유롭게 표시',
        description: '기본 브러시 모드에서 8가지 고대비 색상과 굵기를 골라 바로 그리고, 필요하면 화살표·사각형·텍스트를 함께 추가합니다.',
      },
      {
        title: '클립보드 복사 또는 원본 화질 저장',
        description: '표시를 마친 이미지를 메신저에 바로 복사해 붙여넣거나 워터마크 없는 원본 해상도 PNG / WebP / JPEG로 저장하세요.',
      },
    ],
    highlights: [
      {
        title: '2차 베지어 곡선 기반 매끄러운 브러시 보정',
        description: '마우스나 트랙패드로 빠르게 그려도 점 간소화와 베지어 보간이 거친 각을 부드럽게 다듬어 깔끔한 동그라미와 밑줄을 만들어 줍니다.',
      },
      {
        title: '자유 손그림 획도 선택해 이동 및 크기 조절',
        description: '일반 비트맵 그림판과 달리 각 브러시 획이 독립 벡터 레이어로 남아 있어 위치를 옮기거나 비율에 맞춰 확대·축소하고 개별 삭제할 수 있습니다.',
      },
      {
        title: '마우스·터치·스타일러스 모두 매끄러운 로컬 드로잉',
        description: '통합 Pointer Events와 그리기 중 스크롤 잠금 처리로 데스크톱은 물론 모바일·태블릿 브라우저에서도 쾌적하게 그릴 수 있습니다.',
      },
    ],
    faqs: [
      {
        question: '이미지 위에 그리기와 이미지 주석 달기의 차이는 무엇인가요?',
        answer: '이미지 위에 그리기는 자유 브러시 모드로 바로 시작해 빠른 동그라미·밑줄 스케치에 최적화되어 있고, 이미지 주석 달기는 문서·QA용 사각형 모드로 시작합니다. 두 페이지 모두 5가지 주석 도구를 전부 지원합니다.',
      },
      {
        question: '잘못 그린 브러시 선 하나만 골라서 지울 수 있나요?',
        answer: '네. Cmd/Ctrl+Z로 최대 50단계 실행 취소를 할 수 있고, 선택(V)으로 원하는 획 하나만 클릭한 뒤 Delete 키로 해당 선만 깔끔하게 지울 수 있습니다.',
      },
      {
        question: '고해상도 스크린샷에 손으로 그리면 저장할 때 흐릿해지나요?',
        answer: '아니요. 브러시 경로가 해상도 독립 벡터로 저장되어 내보내기나 복사 시 원본 이미지의 전체 해상도에 맞춰 안티앨리어싱으로 선명하게 렌더링됩니다.',
      },
      {
        question: '스마트폰이나 태블릿에서 손가락이나 스타일러스로 그릴 수 있나요?',
        answer: '네. 터치와 스타일러스 입력을 모두 지원하며 캔버스 위에서 그릴 때 화면 스크롤이 잠겨 흔들림 없이 표시할 수 있습니다.',
      },
    ],
  },
}
