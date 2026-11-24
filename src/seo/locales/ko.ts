/**
 * [INPUT]: depends on LocaleBundle type from ../types.ts; depends on KO_TOOL_ROUTES from ./koTools.ts and INFO_PAGE_ROUTES from ./infoRoutes.ts
 * [OUTPUT]: exports KO_LOCALE complete Korean UI labels and 23 intent/info route copy entries
 * [POS]: Korean (`/ko/...`) language pack within src/seo/locales, loaded by src/seo/i18n.ts
 * [PROTOCOL]: Update this header on change, then check GEMINI.md
 */

import type { LocaleBundle } from '../types.ts'
import { KO_TOOL_ROUTES } from './koTools.ts'
import { INFO_PAGE_ROUTES } from './infoRoutes.ts'

export const KO_LOCALE: LocaleBundle = {
  code: 'ko',
  nativeName: '한국어',
  shortLabel: '한국어',
  ogLocale: 'ko_KR',
  ui: {
    brandName: 'Moklu',
    brandTagline: '로컬 우선 목업 & 이미지 작업실',
    skipToContent: '본문으로 건너뛰기',
    openStudio: 'Studio 열기',
    openStudioShort: 'Studio',
    openInStudioCta: 'Studio에서 멀티 레이어로 정밀 편집',
    proBadge: 'PRO',
    proUpgrade: 'Moklu Pro',
    proActive: 'Pro 활성화',
    themeLight: '라이트',
    themeDark: '다크',
    toggleThemeAria: '라이트 및 다크 테마 전환',
    languageLabel: '언어',
    menuToggleAria: '내비게이션 메뉴 열기 또는 닫기',
    primaryNavAria: '주요 도구 내비게이션',
    mobileNavAria: '모바일 도구 내비게이션',
    navCategories: {
      mockup: '목업',
      merge: '합치기',
      split: '분할',
      compress: '압축·변환',
      resize: '리사이즈',
      'id-card': '신분증 워터마크',
    },
    dropzoneTitle: '이미지를 드롭하거나 Ctrl/Cmd+V로 붙여넣기',
    dropzoneSubtitle: '100% 브라우저 로컬 처리, 어떤 파일도 서버에 업로드되지 않습니다',
    privacyBadge: '100% 브라우저 로컬 처리 · 서버 업로드 없음',
    privacyBannerTitle: '설계부터 안전한 프라이버시: 픽셀이 내 기기를 벗어나지 않습니다',
    privacyBannerDescription:
      '목업 렌더링, 사진 합치기, 캐러셀 분할, WebP 압축, 신분증 A4 워터마크까지 모든 작업이 브라우저 HTML5 Canvas에서 로컬 실행됩니다. 오프라인에서도 그대로 작동합니다.',
    privacyProofPoints: [
      '서버 업로드 제로 · 대기열 없음',
      '고화질 PNG / WebP / JPEG / ZIP 즉시 저장',
      '원클릭으로 Moklu Studio 멀티 레이어 편집 연계',
    ],
    howToHeading: '3단계로 바로 완성',
    howToSubheading: '회원가입이나 업로드 대기 없이 브라우저에서 즉시 결과물을 만듭니다.',
    highlightsHeading: '실전 워크플로우에 맞춘 설계',
    highlightsSubheading: '각 작업 목적에 딱 맞는 비율, 여백, 출력 형식이 미리 세팅되어 있습니다.',
    relatedToolsHeading: '관련 도구로 이어서 작업하기',
    relatedToolsSubheading: '다른 로컬 이미지 도구로 연결하거나 Moklu Studio에서 디테일을 완성하세요.',
    directoryHeading: 'Moklu 전체 로컬 이미지 도구',
    directorySubheading: '아래 모든 도구는 100% 클라이언트에서 실행되며 기본 저장 시 강제 워터마크가 없습니다.',
    faqHeading: '자주 묻는 질문',
    faqSubheading: '로컬 보안, 출력 화질, 지원 포맷, Studio 연계에 대한 안내입니다.',
    studioBannerTitle: '헤드라인 문구, 화살표 강조, 다국어 슬라이드가 필요하신가요?',
    studioBannerDescription:
      '현재 작업물을 바로 Moklu Studio로 넘겨보세요. Konva 멀티 레이어 캔버스에서 타이포그래피, 그림자, 메시 그라디언트, 다국어 앱스토어 세트를 자유롭게 편집할 수 있습니다.',
    studioBannerAction: 'Studio 열기',
    studioBannerProAction: 'Moklu Pro',
    footerDescription:
      '오픈소스 로컬 우선 스크린샷 목업 스튜디오 및 브라우저 이미지 툴킷. 추적 없음, 서버 업로드 없음.',
    footerGroups: {
      mockups: '목업 & 런칭 비주얼',
      mergeSplit: '합치기 & 분할',
      optimizeResize: '압축 & 크기 조절',
      documentsStudio: '신분증 & Studio',
    },
    footerLanguages: '언어 선택',
    footerOpenSource: 'GitHub 저장소',
    footerLocalFirstNote: '모든 픽셀 처리는 브라우저 HTML5 Canvas에서 로컬로 실행됩니다',
    footerCopyright: 'Moklu · 오픈소스 비주얼 툴킷',
  },
  routes: {
    '': {
      navLabel: '홈 허브',
      title: 'Moklu | 무료 로컬 스크린샷 목업 & 브라우저 이미지 도구 모음',
      metaDescription:
        'Chrome·iPhone 16 Pro 스크린샷 목업, 사진 합치기, 인스타 캐러셀 분할, WebP 압축, 신분증 A4 워터마크까지 100% 브라우저 로컬 처리. 서버 업로드 없음.',
      badge: '100% 브라우저 로컬 · 서버 업로드 제로',
      h1: '스크린샷 목업과 로컬 이미지 도구를 한 탭에서',
      subtitle:
        '스크린샷을 붙여넣기만 하면 Chrome·iPhone 16 Pro 프레임 적용부터 사진 이어붙이기, SNS 캐러셀 분할, WebP 압축, 신분증 A4 워터마크까지 로컬에서 처리하고 원클릭으로 Studio에서 정밀 편집할 수 있습니다.',
      steps: [
        {
          title: '도구를 선택하거나 이미지를 붙여넣기',
          description: 'Ctrl/Cmd+V로 클립보드 캡처를 붙여넣거나 로컬 PNG·JPEG·WebP 파일을 드래그하세요.',
        },
        {
          title: '프리셋 스타일을 실시간 조정',
          description: '기기 프레임, 합치기 방향, 분할 비율, 압축 품질, 도용 방지 워터마크를 로컬에서 바로 미리 봅니다.',
        },
        {
          title: '즉시 저장하거나 Studio로 이어서 편집',
          description: '워터마크 없는 고화질 파일을 바로 내려받거나 Studio 열기로 제목과 다중 슬라이드를 추가하세요.',
        },
      ],
      highlights: [
        {
          title: '제품 런칭급 스크린샷 목업',
          description: '평범한 화면 캡처를 몇 초 만에 깔끔한 Chrome, Safari, iPhone, Pixel 목업 이미지로 바꿔줍니다.',
        },
        {
          title: '자주 쓰는 이미지 유틸리티 총망라',
          description: '나란히 합치기, 세로 긴 스샷, 9분할, PNG→WebP 변환, 크롭 없는 흰 테두리, 신분증 A4 워터마크를 지원합니다.',
        },
        {
          title: '빠른 도구에서 전문 Studio로 자연스럽게 연결',
          description: '퀵 워크스페이스에서 빠르게 구성을 잡은 뒤 Moklu Studio로 넘겨 텍스트와 멀티 레이어를 완성하세요.',
        },
      ],
      faqs: [
        {
          question: 'Moklu에 올린 스크린샷이나 사진이 서버로 전송되나요?',
          answer: '아니요. 모든 기능은 브라우저 내 HTML5 Canvas와 Blob API로만 실행되므로 파일이 내 기기를 벗어나지 않습니다.',
        },
        {
          question: '기본 내보내기가 무료이며 워터마크가 붙지 않나요?',
          answer: '네. 핵심 목업, 합치기, 분할, 압축, 리사이즈, 신분증 워터마크 기능은 모두 무료이며 강제 브랜드 워터마크가 없습니다.',
        },
        {
          question: '퀵 워크스페이스와 Moklu Studio의 차이는 무엇인가요?',
          answer: '퀵 워크스페이스는 단일 이미지 작업을 몇 초 만에 끝내는 즉석 도구이며, Moklu Studio는 텍스트·배지·그림자·다국어 슬라이드를 다루는 본격 멀티 레이어 편집기입니다.',
        },
        {
          question: '어떤 이미지 포맷과 브라우저를 지원하나요?',
          answer: 'PNG, JPEG, WebP 입출력을 지원하며 데스크톱과 모바일 최신 Chrome, Safari, Firefox, Edge에서 모두 작동합니다.',
        },
      ],
    },
    studio: {
      navLabel: 'Moklu Studio',
      title: 'Moklu Studio | 멀티 레이어 스크린샷 목업 캔버스 에디터',
      metaDescription:
        '제품 런칭 이미지와 앱스토어 스크린샷을 브라우저에서 제작하는 멀티 레이어 캔버스. 디바이스 프레임, 헤드라인, 그라디언트, 다국어 슬라이드를 로컬 저장으로 편집.',
      badge: '멀티 레이어 캔버스 에디터',
      h1: '멀티 레이어 목업 & 프로덕트 비주얼 Studio',
      subtitle:
        '디바이스 프레임, 헤드라인 타이포그래피, 배지, 메시 그라디언트, 다국어 슬라이드 덱을 브라우저 로컬 자동 저장으로 자유롭게 구성하세요.',
      steps: [
        {
          title: '템플릿 선택 또는 퀵 도구에서 가져오기',
          description: '앱스토어·SNS·와이드 템플릿으로 시작하거나 퀵 워크스페이스 작업물을 바로 불러옵니다.',
        },
        {
          title: '프레임·텍스트·그림자 레이어 배치',
          description: 'Chrome, Safari, iPhone, Pixel 프레임 위에 헤드라인, 도형, 정교한 그림자를 자유롭게 쌓습니다.',
        },
        {
          title: '고해상도 슬라이드 세트 내보내기',
          description: '단일 이미지 또는 다국어 슬라이드 묶음을 브라우저에서 즉시 PNG, WebP, ZIP으로 출력합니다.',
        },
      ],
      highlights: [
        {
          title: '비파괴 레이어 트리',
          description: '배경, 디바이스 프레임, 이미지, 텍스트 레이어를 개별 잠금·숨김·순서 변경 및 실행 취소할 수 있습니다.',
        },
        {
          title: '다국어 슬라이드 동기화 편집',
          description: '레이아웃은 그대로 유지하면서 영어·한국어·일본어·중국어 앱스토어 카피를 한눈에 관리합니다.',
        },
        {
          title: '로컬 우선 프로젝트 저장',
          description: '프로젝트가 브라우저 IndexedDB에 저장되며 휴대용 백업 파일로 언제든 내보내고 복원할 수 있습니다.',
        },
      ],
      faqs: [
        {
          question: '퀵 도구에서 만든 이미지를 바로 Studio에서 꾸밀 수 있나요?',
          answer: '네. 모든 퀵 도구의 "Studio에서 열기" 버튼을 누르면 현재 이미지와 프레임이 편집 가능한 슬라이드로 자동 배치됩니다.',
        },
        {
          question: 'Studio 프로젝트 파일은 어디에 저장되나요?',
          answer: '별도 클라우드 가입 없이 내 브라우저의 IndexedDB와 localStorage에 안전하게 보관됩니다.',
        },
        {
          question: '원하는 픽셀 크기로 캔버스를 설정할 수 있나요?',
          answer: '네. 16:9, 4:5, 9:16 및 앱스토어 프리셋 외에 정확한 가로·세로 픽셀을 직접 입력할 수 있습니다.',
        },
        {
          question: '실행 취소나 프로젝트 백업 내보내기를 지원하나요?',
          answer: '다단계 실행 취소/다시 실행과 프로젝트 아카이브 백업·복원을 모두 지원합니다.',
        },
      ],
    },
    'browser-mockup': {
      navLabel: '브라우저 목업',
      title: '무료 브라우저 목업 생성기 (Chrome & Safari 창 프레임) | Moklu',
      metaDescription:
        '웹 앱·대시보드 스크린샷에 깔끔한 Chrome, Safari, 미니멀 창 프레임과 배경 그라디언트를 입히세요. 100% 브라우저 로컬 렌더링, 업로드 없음.',
      badge: 'Chrome & Safari 브라우저 프레임',
      h1: '웹 앱 & SaaS용 브라우저 목업 생성기',
      subtitle:
        '웹사이트나 관리자 대시보드 캡처에 깔끔한 Chrome, Safari 또는 미니멀 macOS 창 프레임을 씌우고 균형 잡힌 여백과 부드러운 그림자를 로컬에서 적용하세요.',
      steps: [
        {
          title: '웹 스크린샷 붙여넣기 또는 드롭',
          description: 'SaaS 화면, 랜딩 페이지, 체인지로그 캡처를 바로 드래그하거나 붙여넣습니다.',
        },
        {
          title: 'Chrome · Safari · 미니멀 창 선택',
          description: '16:9 또는 16:10 와이드 비율, 그라디언트 배경, 화면 맞춤 옵션을 실시간으로 고릅니다.',
        },
        {
          title: 'PNG 저장 또는 Studio에서 주석 추가',
          description: '선명한 고해상도 PNG를 즉시 내려받거나 Studio로 열어 헤드라인과 강조 화살표를 추가하세요.',
        },
      ],
      highlights: [
        {
          title: '프로덕트 헌트·기술 블로그 최적화',
          description: '일관된 16:9 여백이 지저분한 바탕화면 가장자리를 감추고 프로덕트 업데이트를 돋보이게 합니다.',
        },
        {
          title: '선명한 벡터급 브라우저 크롬',
          description: '창 버튼, 주소창 모서리, 테두리가 고해상도 출력에서도 번짐 없이 또렷하게 유지됩니다.',
        },
        {
          title: '사내 대시보드도 유출 걱정 제로',
          description: '로컬 Canvas에서 바로 합성하므로 미공개 SaaS UI가 외부 서버로 전송되지 않습니다.',
        },
      ],
      faqs: [
        {
          question: '어떤 브라우저 프레임 스타일을 선택할 수 있나요?',
          answer: 'Chrome 브라우저, Safari 브라우저, 주소창 없는 미니멀 윈도우 세 가지 스타일을 즉시 전환할 수 있습니다.',
        },
        {
          question: '블로그나 X 공유에 가장 어울리는 비율은 무엇인가요?',
          answer: '기본 16:9(1600×900) 및 16:10(1600×1000) 프리셋이 프로덕트 헌트, X 카드, 기술 문서에 가장 깔끔하게 맞습니다.',
        },
        {
          question: '주소창 텍스트를 바꾸거나 설명 문구를 얹을 수 있나요?',
          answer: 'Studio에서 열기를 클릭하면 브라우저 바 세부 편집과 별도 레이어의 제목·배지·화살표 추가가 가능합니다.',
        },
        {
          question: '미공개 웹 서비스 스크린샷이 어딘가에 저장되나요?',
          answer: '절대 저장되지 않습니다. 모든 합성은 브라우저 로컬 메모리에서만 처리됩니다.',
        },
      ],
    },
    'iphone-mockup': {
      navLabel: '아이폰 목업',
      title: '무료 아이폰 16 Pro 목업 생성기 온라인 | Moklu',
      metaDescription:
        '모바일 앱 스크린샷을 정교한 iPhone 16 Pro 베젤에 배치하고 스튜디오 배경과 그림자를 적용하세요. 100% 브라우저 로컬 처리 & Studio 원클릭 연동.',
      badge: 'iPhone 16 Pro 티타늄 프레임',
      h1: 'iPhone 16 Pro 목업 생성기',
      subtitle:
        'iOS 앱 화면을 실제 비율의 iPhone 16 Pro 프레임에 담아 부드러운 조명과 깔끔한 여백으로 완성하세요. 클라우드 업로드 없이 브라우저에서 즉시 생성됩니다.',
      steps: [
        {
          title: 'iOS 앱 스크린샷 불러오기',
          description: '기기 캡처나 시뮬레이터 이미지를 드롭하거나, 데모 스크린샷으로 0초 만에 미리 볼 수 있습니다.',
        },
        {
          title: '배경 테마·비율·화면 맞춤 설정',
          description: '4:5 세로형, 9:16 스토리, 1:1 정사각형 중 선택하고 Cover/Contain으로 화면 가장자리를 맞춥니다.',
        },
        {
          title: 'PNG 다운로드 또는 Studio에서 확장 편집',
          description: '완성된 아이폰 목업을 바로 저장하거나 Studio로 보내 핵심 기능 헤드라인을 배치하세요.',
        },
      ],
      highlights: [
        {
          title: '실제 기기에 맞춘 정교한 비율',
          description: '화면 라운드 코너와 다이나믹 아일랜드 여백이 iPhone 16 Pro 규격에 자연스럽게 어울립니다.',
        },
        {
          title: 'SNS·포트폴리오용 멀티 비율',
          description: '인스타그램 4:5, 릴스/스토리 9:16, 발표 자료용 16:9를 원클릭으로 전환합니다.',
        },
        {
          title: '비공개 베타 빌드도 안전하게 작업',
          description: 'TestFlight 단계의 미공개 앱 화면도 서버 전송 없이 로컬에서 안심하고 목업화할 수 있습니다.',
        },
      ],
      faqs: [
        {
          question: 'iPhone 16 Pro 목업에 가장 잘 맞는 캡처 해상도는?',
          answer: '1206×2622, 1290×2796 등 표준 아이폰 세로 캡처가 가장 잘 맞으며, 다른 모바일 해상도도 Cover 모드로 깔끔하게 정렬됩니다.',
        },
        {
          question: '아이폰 두 대를 나란히 놓거나 기울여 배치할 수 있나요?',
          answer: '네. Studio에서 열기를 누르면 아이폰 레이어 복제, 회전, 멀티 디바이스 구성을 자유롭게 할 수 있습니다.',
        },
        {
          question: '내보낸 아이폰 목업에 워터마크가 붙나요?',
          answer: '아니요. 표준 고해상도 PNG 내보내기는 워터마크 없이 완전히 깨끗합니다.',
        },
        {
          question: '랜딩 페이지나 IR 자료 등 상업적 용도로 써도 되나요?',
          answer: '네. 직접 보유한 스크린샷으로 만든 목업은 웹사이트, 투자 제안서, 앱스토어에 자유롭게 활용할 수 있습니다.',
        },
      ],
    },
    'device-mockup': {
      navLabel: '멀티 디바이스 목업',
      title: '멀티 디바이스 목업 생성기 (Pixel 9 · iPhone · 브라우저) | Moklu',
      metaDescription:
        'Google Pixel 9, iPhone 16 Pro, 데스크톱 브라우저 목업을 통일된 배경과 그림자로 빠르게 제작하세요. 100% 브라우저 로컬 처리.',
      badge: 'Pixel 9 · iPhone · 브라우저 프레임',
      h1: '크로스 플랫폼 멀티 디바이스 목업 생성기',
      subtitle:
        'Android, iOS, 반응형 웹 스크린샷을 일관된 조명과 배경 팔레트로 연출하세요. Pixel 9부터 데스크톱 브라우저까지 서버 대기 없이 로컬에서 전환됩니다.',
      steps: [
        {
          title: 'Android · iOS · 웹 스크린샷 드롭',
          description: '이미지를 한 번만 불러오면 다시 올리지 않고도 여러 기기 프레임을 바로 비교할 수 있습니다.',
        },
        {
          title: '캔버스 비율과 배경 톤 통일',
          description: 'Aurora, Midnight, Warm Paper 테마로 모든 플랫폼 소개 이미지의 브랜드 톤을 맞춥니다.',
        },
        {
          title: '즉시 저장 또는 Studio에서 복합 연출',
          description: '단일 기기 목업을 저장하거나 Studio에서 데스크톱과 모바일을 한 화면에 함께 구성하세요.',
        },
      ],
      highlights: [
        {
          title: 'Android Google Pixel 9 프레임 지원',
          description: '구글 플레이 출시 앱도 아이폰 목업 못지않은 깔끔한 하드웨어 프레임으로 선보일 수 있습니다.',
        },
        {
          title: '일관된 브랜드 비주얼 시스템',
          description: '웹·안드로이드·iOS 목업 전체에 동일한 그림자 깊이와 여백 규칙을 유지합니다.',
        },
        {
          title: '지연 없는 60fps 로컬 미리보기',
          description: '서버 렌더링 대기 없이 프레임 교체와 테마 변경을 브라우저에서 즉시 확인합니다.',
        },
      ],
      faqs: [
        {
          question: '어떤 디바이스 프레임을 전환해 볼 수 있나요?',
          answer: 'Google Pixel 9, iPhone 16 Pro, Chrome 브라우저, Safari 브라우저, 미니멀 창 프레임을 지원합니다.',
        },
        {
          question: '모바일 앱 화면과 PC 웹 화면을 한 장에 같이 넣을 수 있나요?',
          answer: '네. Studio에서 열기를 선택하면 여러 디바이스 레이어를 하나의 캔버스에 함께 배치할 수 있습니다.',
        },
        {
          question: '프레임 모델을 바꾸면 불러온 스크린샷이 초기화되나요?',
          answer: '아니요. 기존 스크린샷이 그대로 유지된 채 프레임과 배경만 즉시 전환됩니다.',
        },
        {
          question: '목업 생성을 위해 파일이 외부 서버로 업로드되나요?',
          answer: '아니요. 모든 합성은 로컬 브라우저 세션 내부에서만 수행됩니다.',
        },
      ],
    },
    'app-store-screenshots': {
      navLabel: '앱스토어 스크린샷',
      title: '앱스토어 & 구글 플레이 9:16 스크린샷 생성기 | Moklu',
      metaDescription:
        '전환율 높은 9:16 앱스토어·구글 플레이 스크린샷을 iPhone 16 Pro 프레임과 스튜디오 배경으로 빠르게 제작하고 Studio 다국어 세트로 확장하세요.',
      badge: '9:16 스토어 등록 세로 프리셋',
      h1: '앱스토어 & 플레이스토어 스크린샷 메이커',
      subtitle:
        '스토어 등록에 최적화된 9:16 세로 캔버스와 iPhone 16 Pro 프레임을 기본 탑재했습니다. 빠르게 초안을 만든 뒤 Moklu Studio에서 다중 슬라이드와 다국어 카피까지 완성하세요.',
      steps: [
        {
          title: '핵심 앱 화면 스크린샷 삽입',
          description: 'iOS 또는 Android 앱 캡처를 스토어용 9:16 세로 프레임에 바로 배치합니다.',
        },
        {
          title: '눈에 띄는 배경 테마와 기기 선택',
          description: '검색 결과에서 시선을 끄는 Aurora, Midnight, Warm Paper 그라디언트를 고르세요.',
        },
        {
          title: '바로 저장하거나 Studio에서 전체 세트 제작',
          description: '깔끔한 프레임 이미지를 즉시 내려받거나 Studio로 넘겨 5장 구성의 다국어 스토어 세트를 완성합니다.',
        },
      ],
      highlights: [
        {
          title: '기본 세팅된 9:16 스토어 비율',
          description: '매번 해상도를 찾아볼 필요 없이 1080×1920 세로 비율로 즉시 작업을 시작합니다.',
        },
        {
          title: 'Studio 다국어 로컬라이징 직결',
          description: '한국어·영어·일본어·중국어 스토어 문구를 하나의 디자인 레이아웃에서 손쉽게 관리합니다.',
        },
        {
          title: '출시 전 앱 화면 보안 유지',
          description: '외부 클라우드 서버를 거치지 않아 출시 전 신규 기능 화면이 유출될 위험이 없습니다.',
        },
      ],
      faqs: [
        {
          question: '아이폰 프레임 위에 큰 홍보 문구를 넣으려면 어떻게 하나요?',
          answer: '워크스페이스의 "Studio에서 열기"를 누르면 현재 구성이 멀티 레이어 에디터로 넘어가 헤드라인, 배지, 여러 슬라이드를 자유롭게 추가할 수 있습니다.',
        },
        {
          question: '애플 앱스토어와 구글 플레이 양쪽 모두 활용할 수 있나요?',
          answer: '네. 동일한 9:16 배경과 레이아웃을 유지한 채 iPhone 16 Pro와 Pixel 9 프레임만 바꿔서 바로 출력할 수 있습니다.',
        },
        {
          question: '여러 언어의 앱스토어 스크린샷을 한 번에 관리할 수 있나요?',
          answer: 'Moklu Studio의 로컬라이제이션 뷰에서 다중 슬라이드 번역본을 로컬로 통합 관리할 수 있습니다.',
        },
        {
          question: '내보낸 스토어 스크린샷이 흐려지거나 워터마크가 들어가나요?',
          answer: '아니요. 무손실 고해상도 PNG로 깔끔하게 출력되며 강제 워터마크가 없습니다.',
        },
      ],
    },
    'merge-images': {
      navLabel: '온라인 이미지 합치기',
      title: '온라인 이미지 합치기 | 여러 사진 가로·세로·그리드 병합 및 PDF 저장 | Moklu',
      metaDescription:
        '무료 로컬 온라인 이미지 합치기 도구: 가로·세로·2~6열 그리드(cover/contain), 드래그 정렬, 순서 뒤집기, 90° 회전, 개별 테두리, 커스텀 색상 선택기, 클립보드 복사 및 단일 페이지 PDF 저장. 업로드 제로.',
      badge: '가로 · 세로 · 2~6열 그리드 · PDF',
      h1: '온라인 이미지 합치기 도구',
      subtitle:
        '여러 사진이나 캡처를 끌어놓거나 Cmd/Ctrl+V로 붙여넣어 가로, 세로, 2~6열 그리드(cover/contain)로 합치세요. 드래그 정렬, 순서 뒤집기, 90° 회전, 테두리, 클립보드 복사, 단일 페이지 PDF 저장까지 100% 브라우저 로컬로 처리합니다.',
      steps: [
        {
          title: '이미지 추가 후 드래그 정렬 또는 회전',
          description: '파일을 끌어놓거나 Cmd/Ctrl+V로 붙여넣고 썸네일 드래그 정렬(←/→ 버튼 병행), 순서 뒤집기, 개별 90° 시계 방향 회전을 적용하세요.',
        },
        {
          title: '레이아웃, 정렬, 테두리 및 배경 설정',
          description: '가로, 세로, 2~6열 그리드(cover/contain)를 선택하고 간격(0~64px), 바깥 여백(0~80px), 모서리 라운드(0~48px), 개별 테두리(0~24px), 커스텀 배경색을 조절합니다.',
        },
        {
          title: '클립보드 복사 또는 이미지 / PDF 내보내기',
          description: '원클릭으로 PNG를 클립보드에 복사하거나 PNG, WebP, JPEG, 단일 페이지 PDF 1.4(품질 50%~100%)로 저장하고 Studio에서 후속 편집할 수 있습니다.',
        },
      ],
      highlights: [
        {
          title: '가로·세로·2~6열 그리드 & 정밀 정렬',
          description: '최소 맞춤, 최대 맞춤, 원본 크기(상/좌·가운데·하/우 정렬)와 그리드 cover/contain 전환으로 다양한 해상도를 깔끔하게 맞춥니다.',
        },
        {
          title: '드래그 정렬, 순서 뒤집기 & 개별 테두리',
          description: '썸네일 드래그 순서 변경, 원클릭 역순 정렬, 개별 90° 회전, 0~24px 개별 테두리와 커스텀 색상 선택기를 지원합니다.',
        },
        {
          title: '클립보드 복사 & 단일 페이지 PDF 저장',
          description: '메신저에 바로 붙여넣는 클립보드 복사와 로컬 단일 페이지 PDF 1.4 저장을 서버 업로드와 워터마크 없이 제공합니다.',
        },
      ],
      faqs: [
        {
          question: '어떤 병합 레이아웃과 그리드 옵션을 지원하나요?',
          answer: '가로 나란히, 세로 긴 이미지, 2~6열 그리드를 지원합니다. 그리드에서는 1:1, 4:3, 3:4, 자동 비율과 cover(채우기 크롭) 또는 contain(잘림 없이 전체 표시) 모드를 선택할 수 있습니다.',
        },
        {
          question: '해상도가 다른 사진들은 어떻게 정렬되나요?',
          answer: '가로·세로 모드에서 최소 크기 맞춤(기본), 최대 크기 맞춤, 원본 크기 유지 중 선택할 수 있으며, 원본 크기 모드에서는 시작(상단/좌측), 가운데(기본), 끝(하단/우측) 정렬을 지원합니다.',
        },
        {
          question: '드래그 정렬, 순서 뒤집기, 개별 사진 회전이 가능한가요?',
          answer: '네. 썸네일을 드래그해 순서를 바꾸고(←/→ 버튼도 유지), 순서 뒤집기 버튼으로 전체 순서를 반전하거나 개별 이미지를 90° 시계 방향으로 회전할 수 있습니다.',
        },
        {
          question: '간격, 개별 테두리, 둥근 모서리, 배경색은 어디까지 조절할 수 있나요?',
          answer: '간격(0~64px), 바깥 여백(0~80px), 모서리 라운드(0~48px), 개별 테두리(0~24px, 프리셋 및 색상 선택기)를 조절할 수 있으며, 배경은 6개 프리셋(그라디언트·투명 포함)과 커스텀 색상 선택기를 지원합니다.',
        },
        {
          question: '어떤 출력 형식과 품질 설정을 지원하며 PDF로도 저장할 수 있나요?',
          answer: 'PNG, WebP, JPEG, 단일 페이지 PDF 1.4를 지원합니다. JPEG, WebP, PDF에서는 50%~100%(기본 92%) 품질 슬라이더를 제공하며 투명 배경은 JPEG/PDF 저장 시 자동으로 흰색 배경이 적용됩니다. PDF 출력은 병합된 이미지를 한 장에 담는 단일 페이지 방식이며 다중 페이지 PDF 병합 도구는 아닙니다.',
        },
        {
          question: '합친 이미지를 바로 클립보드에 복사해 메신저에 붙여넣을 수 있나요?',
          answer: '네. 클립보드 복사 버튼을 누르면 병합된 결과가 자동으로 PNG로 변환되어 시스템 클립보드에 복사되므로 카카오톡, 슬랙, 노션 등에 즉시 붙여넣을 수 있습니다.',
        },
        {
          question: '장수 제한이나 최대 해상도 한도가 있나요?',
          answer: '고정된 사진 장수 제한은 없습니다. 브라우저 안정성을 위해 출력 캔버스는 8192px / 64MP 안전 한도를 적용하며, 초과 시 자동으로 비례 축소되고 미리보기 크기 옆에 축소 안내가 표시됩니다.',
        },
        {
          question: '세로 긴 스크린샷을 합칠 때 겹치는 스크롤 영역이나 고정 상·하단 바를 자동으로 제거할 수 있나요?',
          answer: '네, 선택 옵션으로 켤 수 있습니다. 기본값은 원본 가장자리를 그대로 연결하며, 세로 모드에서 100% 로컬 픽셀 매칭 기반의 스마트 긴 스크린샷 겹침 제거와 고정 상·하단 바 자르기를 선택적으로 활성화할 수 있습니다.',
        },
        {
          question: '모바일 사용, 멀티 레이어 Studio 연동, 로컬 초안 자동 저장을 지원하나요?',
          answer: '네. 데스크톱과 모바일 브라우저 모두에서 오프라인·무료·무워터마크로 작동하며 작업 내용은 브라우저 로컬 IndexedDB 초안으로 자동 저장됩니다. Studio 열기를 누르면 병합 이미지를 독립 레이어 그대로 무손실 연동해 2차 편집하거나 제목·배지·화살표를 추가할 수 있습니다.',
        },
      ],
    },
    'combine-photos-side-by-side': {
      navLabel: '좌우 나란히 합치기',
      title: '사진 두 장 좌우 나란히 합치기 무료 (전후 비교) | Moklu',
      metaDescription:
        '2장 이상의 사진이나 UI 캡처를 좌우 가로로 나란히 합쳐 전후 비교 이미지를 만드세요. 높이 자동 맞춤, 여백·라운드 지원, 100% 로컬 처리.',
      badge: '좌우 가로 비교 프리셋',
      h1: '사진 좌우 나란히 합치기 도구',
      subtitle:
        'Before/After 전후 비교와 UI 리디자인 리뷰에 맞춘 가로 합치기 도구입니다. 다른 기기에서 찍은 사진도 높이를 자동 정렬하고 깔끔한 구분 여백을 로컬에서 적용합니다.',
      steps: [
        {
          title: '좌우로 비교할 이미지 불러오기',
          description: '두 장 이상의 사진이나 캡처를 올리고 왼쪽에서 오른쪽 순서를 맞춥니다.',
        },
        {
          title: '간격, 바깥 여백, 배경색 설정',
          description: '흰색이나 다크 구분 여백과 부드러운 모서리 라운드를 조절해 가독성을 높입니다.',
        },
        {
          title: '즉시 저장 또는 Studio에서 전후 라벨 추가',
          description: 'PNG/WebP를 바로 저장하거나 Studio로 열어 Before/After 배지를 손쉽게 얹으세요.',
        },
      ],
      highlights: [
        {
          title: '한눈에 들어오는 전후 비교',
          description: '보정 전후 사진, 디자인 개편 비교, 인테리어·운동 변화 기록에 이상적입니다.',
        },
        {
          title: '사진 잘림 없는 높이 자동 맞춤',
          description: '원본 비율을 유지한 채 높이만 맞춰주므로 좌우 피사체가 잘리지 않습니다.',
        },
        {
          title: '2장뿐 아니라 3장·4장 가로 배열도 지원',
          description: '여러 컷의 비교나 단계별 변화도 한 줄로 균형 있게 연결할 수 있습니다.',
        },
      ],
      faqs: [
        {
          question: '사진 3장이나 4장도 가로로 나란히 합칠 수 있나요?',
          answer: '네. 가로 모드는 2장 이상 원하는 만큼의 이미지를 왼쪽부터 순서대로 나란히 배치합니다.',
        },
        {
          question: '좌우로 합칠 때 사진 가장자리가 강제로 잘리나요?',
          answer: '아니요. 비율을 유지하며 높이를 맞추기 때문에 원본 이미지가 잘리지 않고 전부 보존됩니다.',
        },
        {
          question: '두 사진 사이에 깔끔한 흰색 구분선을 넣으려면?',
          answer: '배경색을 흰색으로 두고 간격(Gap)과 바깥 여백(Padding) 슬라이더를 원하는 두께로 맞추면 됩니다.',
        },
        {
          question: '개인적인 전후 비교 사진을 작업해도 안전한가요?',
          answer: '네. 100% 브라우저 오프라인 로컬 처리로 서버에 어떤 파일도 전송되지 않습니다.',
        },
      ],
    },
    'stitch-images-vertically': {
      navLabel: '세로 긴 스샷 합치기',
      title: '스크린샷 세로 이어붙이기 (대화 내역·긴 이미지) | Moklu',
      metaDescription:
        '여러 장의 모바일 캡처, 카톡 대화 내역, 영수증, 긴 웹 화면을 세로 한 장으로 매끄럽게 이어붙이세요. 너비 자동 정렬, 100% 브라우저 로컬 처리.',
      badge: '세로 긴 스크린샷 이어붙이기',
      h1: '이미지 세로 이어붙이기 & 긴 스크린샷 만들기',
      subtitle:
        '메신저 대화 캡처, 긴 문서, 모바일 스크롤 화면을 위에서 아래로 깔끔하게 이어붙이세요. 너비 자동 맞춤과 0px 무간격 연결을 서버 업로드 없이 로컬에서 완료합니다.',
      steps: [
        {
          title: '읽는 순서대로 캡처 이미지 추가',
          description: '연속으로 찍은 모바일·데스크톱 캡처를 올리고 위아래 순서를 확인하세요.',
        },
        {
          title: '0px 무간격 또는 여백 카드 스타일 선택',
          description: '대화 내역이나 긴 웹 캡처는 간격 0px와 선택형 스마트 겹침 제거·고정 상·하단 바 자르기로 자연스럽게 연결하고, 가이드 문서는 여백과 라운드로 구분하세요.',
        },
        {
          title: '선명한 세로 긴 이미지 로컬 저장',
          description: '글자가 또렷한 PNG 또는 공유에 가벼운 WebP로 즉시 내려받습니다.',
        },
      ],
      highlights: [
        {
          title: '대화 내역·영수증 프라이버시 완벽 보호',
          description: '민감한 메신저 대화나 업무 증빙 캡처를 외부 웹 서버에 올리지 않고 내 PC에서 바로 합칩니다.',
        },
        {
          title: '서로 다른 해상도도 너비 자동 통일',
          description: '기기 해상도가 다른 캡처를 섞어도 동일한 세로 열 너비로 반듯하게 맞춰줍니다.',
        },
        {
          title: '안정적인 고해상도 캔버스 보호',
          description: '텍스트 가독성을 지키면서도 지나치게 긴 이미지로 인한 브라우저 멈춤을 방지합니다.',
        },
      ],
      faqs: [
        {
          question: '이미지 사이 경계선 없이 완전히 이어진 긴 스샷을 만들 수 있나요?',
          answer: '간격(Gap), 바깥 여백, 모서리 라운드를 모두 0px로 설정하면 빈틈없이 연결되며, 겹치는 스크롤 구간이나 고정 바가 있다면 100% 로컬 픽셀 매칭 기반의 스마트 겹침 제거 및 고정 상·하단 바 자르기를 켤 수 있습니다.',
        },
        {
          question: 'PC 캡처와 스마트폰 캡처를 세로로 같이 이어붙일 수 있나요?',
          answer: '네. 세로 모드의 너비 맞춤 기능이 서로 다른 너비를 비율 유지 상태로 깔끔하게 통일해 줍니다.',
        },
        {
          question: '글자가 많은 긴 캡처는 PNG와 WebP 중 무엇이 좋나요?',
          answer: '작은 글씨 선명도가 최우선이라면 PNG를, 메신저나 블로그에 가볍게 올리려면 고화질 WebP를 추천합니다.',
        },
        {
          question: '이어붙인 뒤 개인정보를 가리거나 강조 박스를 넣을 수 있나요?',
          answer: 'Studio에서 열기를 누르면 가림 도형, 강조 테두리, 번호 주석을 간편하게 추가할 수 있습니다.',
        },
      ],
    },
    'photo-collage-grid': {
      navLabel: '그리드 콜라주',
      title: '무료 사진 그리드 콜라주 만들기 (2×2 · 3×3 · 맞춤 열) | Moklu',
      metaDescription:
        '여러 장의 사진을 정갈한 2×2, 3×3 또는 원하는 열 수의 그리드 콜라주로 자동 배치하세요. 셀 비율, 여백, 라운드 조절, 100% 브라우저 로컬 처리.',
      badge: '맞춤 열 수 그리드 레이아웃',
      h1: '사진 그리드 콜라주 메이커',
      subtitle:
        '여행 사진, 제품 멀티 컷, 앱 UI 화면을 균일한 2×2, 3×3 또는 다열 그리드 콜라주로 정리하세요. 정밀한 여백과 라운드를 로컬에서 바로 완성할 수 있습니다.',
      steps: [
        {
          title: '콜라주에 넣을 사진 선택 및 순서 조정',
          description: '4장, 6장, 9장 이상의 사진을 드롭하고 균형 잡힌 순서로 타일을 배열합니다.',
        },
        {
          title: '열 수, 셀 비율, 간격, 채우기 방식 설정',
          description: '2~6열, 1:1·4:3·3:4 셀 비율, Cover/Contain 맞춤과 모서리 라운드를 지정하세요.',
        },
        {
          title: '콜라주 다운로드 또는 Studio에서 타이틀 추가',
          description: '완성 이미지를 로컬로 바로 저장하거나 Studio에서 제목과 브랜드 표기를 더할 수 있습니다.',
        },
      ],
      highlights: [
        {
          title: '오차 없는 대칭 그리드 기하학',
          description: '모든 타일의 여백과 모서리 반경이 수학적으로 정확히 일치해 완성도가 높습니다.',
        },
        {
          title: 'Cover 채우기 & Contain 원본 유지',
          description: '화보 느낌의 꽉 찬 타일은 Cover로, 화면이 잘리면 안 되는 UI 컷은 Contain으로 전환하세요.',
        },
        {
          title: '가입 유도·워터마크 없는 깔끔한 출력',
          description: '강제 로고나 유료 워터마크 없이 브라우저에서 즉시 깨끗한 콜라주를 저장합니다.',
        },
      ],
      faqs: [
        {
          question: '2×2 4분할이나 3×3 9분할 콜라주를 만들 수 있나요?',
          answer: '네. 열 수를 2에서 6까지 조절하면 넣은 사진 수에 맞춰 깔끔한 2×2, 3×3 및 맞춤 그리드가 자동 완성됩니다.',
        },
        {
          question: '그리드 칸 안에서 인물이나 텍스트가 잘리지 않게 하려면?',
          answer: '맞춤 모드를 Contain으로 바꾸거나 원본 사진과 비슷한 4:3 / 3:4 셀 비율을 선택하세요.',
        },
        {
          question: '콜라주 뒤쪽 배경 색상을 바꿀 수 있나요?',
          answer: '네. 화이트, 다크 차콜, 부드러운 파스텔 톤 등 원하는 배경색을 선택할 수 있습니다.',
        },
        {
          question: '만든 콜라주 사진이 서버에 남나요?',
          answer: '아니요. 모든 렌더링은 내 기기의 브라우저 안에서만 실행됩니다.',
        },
      ],
    },
    ...KO_TOOL_ROUTES,
    ...INFO_PAGE_ROUTES.ko,
  },
}
