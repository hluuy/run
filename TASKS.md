# 작업 현황 (2026-04-24 업데이트)

## 서비스 정보
- **프로덕션:** https://runstreak-nine.vercel.app
- **GitHub:** https://github.com/hluuy/run
- **스택:** Next.js 15, Supabase, Vercel, Tailwind CSS 4, shadcn/ui

## 로컬 실행

```bash
npm install
npm run dev
```

`.env.local` 필요 (Vercel 환경변수 참고):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 구현 완료

### 인증
- Google OAuth 로그인 (삼성 인터넷 브라우저 차단 감지 + Chrome 열기 안내 포함)
- 이메일 로그인 (`POST /api/auth/directlogin`)
  - **기존 사용자:** `admin.listUsers()`로 확인 → `admin.generateLink` → `verifyOtp(token_hash)` 즉시 로그인 (이메일 미발송)
  - **신규 사용자:** `signInWithOtp` → 실제 이메일 인증 링크 발송 → "이메일을 확인해주세요" 화면
  - 이전 OTP 6자리 흐름은 `src/app/auth/login/page.tsx`에 주석으로 보존
- 초대 링크 경유 로그인: `?next=` 파라미터로 로그인 완료 후 초대 페이지 자동 복귀 (이메일·Google·온보딩 모두)
- 로그아웃 후 뒤로가기 방어: `src/components/layout/auth-guard.tsx`

### 러닝 기록
- 수동 입력 폼 (GPX 업로드 → 자동 파싱)
- 기록 수정 / 삭제
- iOS Shortcuts 연동 `POST /api/runs/sync`
  - 한국어 포맷 자동 파싱: `"2026. 4. 21. 오후 7:57"` / `"39:08"` / `"5.017km"`

### 스트릭 캘린더
- 월간 그리드, 강도 색상, 날짜 클릭 → Dialog

### 크루 (그룹)
- 그룹 생성/삭제, 멤버별 개인 목표 거리, 리더보드, 초대 링크

### 설정
- 닉네임 수정
- API 토큰: `localStorage('rnt_saved_token')`에 원문 저장 → 언제든 복사 가능
- Shortcuts 6단계 설정 도움말

---

## 다음 작업

### 1순위
- [x] **토큰 다이얼로그 수정** — Shortcuts 도움말 다이얼로그 개편 완료
  - Nike Run Club 필수 안내 + 건강 앱 연결 경로
  - 단축어 다운로드 링크 삽입
  - Authorization 헤더 토큰 입력 방법 안내
  - 자동화 트리거 특정 시간(23:30 추천)으로 변경

### 이후 작업
- [x] **구글 OAuth 활성화** — Supabase Google 프로바이더 활성화 완료
- [x] **CSS 현대화** — 딥 네이비 + 오렌지/코랄 디자인 시스템 완료
  - globals.css: 딥 네이비 배경 + 오렌지 primary + 코랄 accent 토큰
  - bottom-nav 글래스모피즘 (bg-background/70 backdrop-blur-xl)
  - 전체 bg-orange-500 → bg-primary 일괄 교체 (13개 파일)
- [x] **input font-size 16px 적용** — globals.css에 일괄 적용 완료
- [x] **PWA 앱 아이콘 제작** — 딥 네이비 + ECG 심박수 라인 디자인
  - icon-192.png, icon-512.png 생성 완료
  - manifest.json 아이콘 경로 및 theme_color 연결 완료
- [x] 계정 삭제 기능 — Dialog 확인, localStorage 토큰 정리, 영구 삭제 완료
- [x] PWA 오프라인 설정 — next-pwa 이미 정상 설정 확인 (sw.js 생성됨)
- [x] Rate limiting — Upstash Redis 교체 완료, 남은 시간 메시지 반환

### 2026-04-23 작업 완료
- [x] **하단 네비바 대칭** — `justify-around` → `flex-1` 균등 폭 배분
- [x] **기록 창 좌우 흔들림 제거** — 두 가지 원인 동시 수정
  - Dialog 애니메이션: `zoom-in-95` → `slide-in-from-bottom-4` (수직 이동만)
  - `html/body`에 `overflow-x: hidden` 추가 (뷰포트 가로 밀림 원천 차단)
  - WheelPicker 스크롤 div에 `touch-action: pan-y` 추가 (대각선 터치 수직 처리)
- [x] **휠 피커 크기 축소** — `ITEM_H 40→32` (200px → 160px), 텍스트 한 단계 축소
- [x] **그룹 생성 목표 주기 UI** — 설명 텍스트 제거, 일간/주간/월간 레이블만 중앙 정렬로 표시
- [x] **탭 전환 속도 개선 (SWR)** — `swr@2.4.1` 도입
  - `use-user`, `use-month-runs`, `crew/page`: `useEffect` → `useSWR` 교체
  - `'auth-user'` 키 공유로 `getUser()` 중복 호출 제거
  - 탭 재방문 시 캐시 즉시 표시 → 백그라운드에서 최신 데이터 갱신
- [x] **frontend-design 플러그인 설치** — Claude Code 공식 플러그인 (user scope)

### 2026-04-23 추가 작업 완료
- [x] **스트릭 캘린더 셀 색상 개선** — 완전 불투명 → 반투명 틴트 + 테두리 방식
  - `intensityToColor()` → `intensityToStyle()` 교체 (`src/lib/streak.ts`)
  - 저강도: 12% 불투명도 오렌지 / 중강도: 18% + 50% 테두리 / 최고강도: 25% 코랄 + 80% 테두리
  - 텍스트 `text-white` → `text-foreground` (네이비 배경 위 가독성)
- [x] **소요시간 휠 피커 개선**
  - h/m/s 단위를 아이템 내부에서 제거 → 피커 사이 고정 라벨로 분리
  - 분/초: 한 자리 → 두 자리 패딩 (`00`, `01`…)
  - `VISIBLE 5→3`: 휠 높이 160px → 96px (거리 피커도 동일 적용)
- [x] **커스텀 날짜 피커** (`src/components/ui/date-picker-sheet.tsx` 신규)
  - native `<input type="date">` 대체 — 앱 디자인 통일
  - 선택 날짜: 오렌지 primary 배경 / 오늘: primary 링 / 미래: 비활성
  - 날짜 선택 즉시 닫힘, 배경 탭으로도 닫힘
- [x] **크루 — 저번 목표 달성 여부 표시** (`src/components/crew/group-detail.tsx`)
  - `getPreviousPeriod()` 추가: 일간→어제, 주간→지난주, 월간→지난달
  - 현재·이전 주기 리더보드 병렬 fetch (`Promise.all`)
  - 목표 설정 멤버에게만 "✓ 저번 목표 달성" (초록) / "✗ 저번 목표 미달성" (회색) 표시

### 2026-04-23 보안/버그 패치
- [x] **초대 링크 멤버십 검증** — `POST /api/invites` 에서 그룹 멤버가 아닌 사용자의 초대 링크 생성 차단 (403)
- [x] **저번 목표 배지 오탐 수정** — `joined_at ≤ prevStart` 조건 추가, 이전 주기 이후 가입 멤버에겐 배지 미표시
- [x] **DatePickerSheet 빈 값 가드** — `value` 빈 문자열일 때 오늘 날짜로 폴백
- [x] **KST 유틸 추출** — `src/lib/kst.ts` (`nowKST()`, `todayKST()`) 중앙화
- [x] **sw.js gitignore** — next-pwa 빌드 산출물(`public/sw.js`, `public/workbox-*.js`) 제외

### 2026-04-24 보안 패치 (2차)
- [x] **directlogin rate limiting** — IP+email 기준 1분 5회 제한 추가 (`loginRateLimit`)
- [x] **redirectTo 서버 검증** — 자신의 origin으로 시작하는 URL만 허용 (오픈 리다이렉트 방지)
- [x] **Chrome intent URL search 누락 수정** — `window.location.search` 포함 (`login/page.tsx`)
- [x] **useSearchParams Suspense 래핑** — `login`, `onboarding` 페이지 prerender 빌드 오류 수정
- [ ] **listUsers 전체 스캔 개선** — Supabase admin JS 타입에 `generateLink.shouldCreateUser` 미지원으로 유지 중. rate limiting(1분 5회)으로 열거 공격 실용성 완화. 향후 Supabase SDK 업데이트 시 재검토

### 2026-04-24 작업 완료
- [x] **Shortcuts 설명 수정** — NRC 안내 문구에 "당일 러닝 데이터만 등록" 명시 (`api-token-section.tsx`)
- [x] **심박수 에러 메시지 한국어** — Zod 기본 영문 메시지 → "40~250 사이의 값을 입력해주세요." (`validations.ts`)
- [x] **삼성 인터넷 브라우저 처리** — `SamsungBrowser` UA 감지 → Google 로그인 비활성화 + 경고 배너 + `intent://` Chrome 열기 링크 (`login/page.tsx`)
- [x] **이메일 로그인 분기 처리** — 기존 사용자 즉시 로그인 / 신규 사용자 이메일 인증 (`directlogin/route.ts`, `login/page.tsx`)
  - `admin.listUsers()`로 이메일 존재 여부 확인
  - 기존 사용자: `generateLink` → `verifyOtp` 즉시 로그인 (이메일 미발송)
  - 신규 사용자: `signInWithOtp` → 실제 이메일 인증 링크 발송 → 이메일 확인 UI 표시
  - 신규 사용자 이메일 인증 후에도 `?next=` 파라미터 유지 (초대 링크 복귀 포함)
- [x] **초대 링크 로그인 후 복귀** — 비로그인 상태로 `/invite/[token]` 접속 후 로그인 완료 시 초대 페이지로 자동 복귀
  - `?next=` 파라미터를 이메일 로그인, Google OAuth, 온보딩 3곳 모두에 전파
  - 신규 가입자는 온보딩 완료 후 초대 페이지로 이동
  - open-redirect 방지: `/`로 시작하고 `//`로 시작하지 않는 경로만 허용

### 2026-04-24 작업 완료 (2차)

- [x] **API 토큰 1인 1개 제한** — 재발급 시 기존 토큰 삭제 후 대체, 경고 다이얼로그 추가
  - `POST /api/tokens`: 기존 토큰 삭제 후 새 토큰 INSERT (1인 1토큰)
  - 토큰 있을 때 "재발급" 버튼 + 경고 다이얼로그 (단축어 Authorization 헤더 변경 안내)
  - 토큰 없을 때 "발급" 버튼 → 바로 생성

- [x] **심박수 입력 UI 개선** — `<input type="number">` → 커스텀 `−`/`+` 스테퍼
  - 거리·소요시간 피커와 동일한 `rounded-2xl border bg-secondary/30` 스타일
  - null 상태: `— bpm` 표시, `+` 첫 클릭 시 150 bpm 시작
  - 값 있을 때: `−`/`+` 1씩 조절 (범위 40–250), 초기화 버튼

- [x] **number 타입 스피너 제거** — 브라우저 기본 화살표 제거
  - `invite/[token]/page.tsx`, `crew/group-detail.tsx` 목표 거리 입력: `type="text" inputMode="decimal"` 교체

- [x] **전반적 버그 수정 및 UX 개선** (어드바이저 리뷰 기반)
  - **오프라인 감지** (`run-form.tsx`): `navigator.onLine` 체크 → 오프라인 시 저장 차단 + 안내 토스트
  - **무한 로딩 방지** (`group-detail.tsx`): `load()` try/finally 추가 → 네트워크 오류 시 스피너 영구 표시 버그 수정
  - **목표 저장 실패 안내** (`invite/[token]/page.tsx`): 목표 저장 API 실패 시 warning 토스트 표시
  - **닉네임 덮어쓰기 방지** (`settings-view.tsx`): `useEffect + ref` 방식으로 변경 → 입력 중 프로필 갱신 시 덮어쓰기 방지
  - **편집 모드 GPX 안내** (`run-form.tsx`): 수정 모드에서 GPX 있을 때 "GPX 수정 불가" 안내 문구 표시
  - **sync 라우트 에러 로깅** (`runs/sync/route.ts`): JSON 파싱·DB 오류 `console.error` 추가
  - **캘린더 접근성** (`streak-calendar.tsx`): 날짜 셀에 `aria-label` 추가 (거리 정보 포함)
  - **DatePickerSheet 접근성·터치 대상** (`date-picker-sheet.tsx`): 셀 `min-h-[40px]`, `aria-label` + `aria-pressed` 추가, gap 조정
  - **MonthStats 로딩 중 연산 제거** (`month-stats.tsx`): 로딩 중 배열 연산 스킵

### 예정 작업

- [ ] **앱 정보 & 버전 관리** — 설정 화면에 앱 버전 + 변경 이력 섹션 추가
  - `package.json` version 필드를 버전 소스로 사용 (예: `1.0.0`, `1.1.0`…)
  - 주요 기능 변경/추가 시에만 버전 올리고 변경 내용 노출 (버그픽스·디자인 조정은 생략)
  - 설정 화면 하단 "앱 정보" 섹션: 현재 버전 + 최근 업데이트 내용 (2~3줄 요약)
  - 변경 이력은 코드 내 상수로 관리 (`src/lib/changelog.ts`)

- [ ] **PWA 자동로그인 (세션 영속)** — task kill 후 재진입 시 로그인 유지
  - 쿠키 maxAge 1년 설정은 완료 (2026-04-25)
  - Supabase Dashboard → Project Settings → Auth → **Refresh Token Duration** 값 늘리기 (기본 7일 → 30일 권장, 초 단위 입력)
  - 설정 후 PWA 재설치 필요 (기존 세션 쿠키 갱신)

- [ ] **PWA 푸시 알림** — 트리거/수신 대상 결정 후 구현
  - VAPID 키 쌍 생성 → Vercel 환경변수 등록
  - `push_subscriptions` 테이블 추가 (user_id, subscription JSON)
  - `/api/push/subscribe` 라우트 — 구독 정보 저장
  - Service Worker `push` 이벤트 핸들러 추가
  - Supabase Edge Function or Database Webhook — 트리거 발생 시 Web Push 발송
  - **결정 필요:** ① 어떤 상황에서 알림? (러닝 기록 / 목표 달성 / 리마인더 등) ② 알림 수신 대상? (그룹 전체 / 본인만)

### 미결 이슈
- [x] **directlogin 보안 강화** — rate limiting + `generateLink(shouldCreateUser:false)` 단일 호출 + redirectTo 서버 검증으로 완료

- [ ] **Google 로그인 계정 자동 연동** — 기존 이메일 계정과 동일한 구글 계정으로 로그인 시 자동 병합됨
  - 예상 원인: Supabase가 동일 이메일을 같은 계정으로 인식해 자동 연결 (의도된 동작일 수 있음)
  - 확인 필요: Supabase Dashboard → Authentication → Users에서 계정 상태 확인
  - 원하는 동작이 무엇인지 결정 후 처리 (분리 vs 통합 유지)

- [ ] **Google OAuth 동의 화면 서비스명 변경** — 현재 `supabase.co` 도메인 이름으로 표시됨
  - Google Cloud Console → OAuth 동의 화면 → 앱 이름/도메인 수정
  - Supabase 프로젝트 설정에서 Site URL도 실제 서비스 URL로 변경 필요

- [ ] **도메인 변경** — 현재 `runstreak-nine.vercel.app`
  - Vercel에서 커스텀 도메인 연결 가능 (유료 도메인 구매 필요, 약 $10~15/년)
  - 추천 도메인 예시: `runstreak.kr`, `runwith.me` 등
  - 변경 시 Supabase → Authentication → URL Configuration의 Site URL / Redirect URLs도 함께 수정 필요

---

## 주요 아키텍처 결정 (변경 금지)

| 항목 | 결정 |
|------|------|
| DB 쓰기 | admin client(service role) 사용 — RLS `auth.uid()` null 우회 |
| 미들웨어 | `proxy.ts` 사용. `middleware.ts` 절대 생성 금지 (충돌) |
| 그룹 리더보드 | `get_group_leaderboard` SECURITY DEFINER RPC |
| 심박수 필드 | `setValueAs` 사용 (`valueAsNumber` 충돌) |
| 로그인 | 기존 사용자: 이메일 즉시 로그인 / 신규 사용자: 이메일 인증 후 로그인 |
| 데이터 캐싱 | SWR `'auth-user'` 키 공유 — getUser() 중복 호출 금지, useSWR로 통일 |

---

## 알려진 한계

- **iOS 26 Shortcuts:** HealthKit 접근 차단 — 운동 데이터 자동 수집 불가
  - Nike Run Club / Strava 모바일 앱 모두 Shortcuts 액션 없음
  - 근본 해결: 네이티브 iOS 앱 필요 (Apple Developer Program $99/년)
- **API 토큰:** 다른 기기에서는 토큰 원문 표시 안 됨 (localStorage는 기기별)
