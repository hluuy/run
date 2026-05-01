# 작업 현황 (2026-05-02 업데이트)

## 서비스 정보
- **프로덕션:** https://runstreak-nine.vercel.app
- **GitHub:** https://github.com/hluuy/run
- **스택:** Next.js 15, Supabase, Vercel, Tailwind CSS 4, shadcn/ui
- **현재 버전:** 1.7.0

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
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
CRON_SECRET=
```

---

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
- 앱 정보 & 버전 히스토리 (v1.3.0~)
- **알림 토글** — iOS PWA 정상 동작 확인 (v1.4.2)

### PWA
- next-pwa 설정, manifest.json, apple-touch-icon, apple-mobile-web-app-capable
- 세션 쿠키 maxAge 1년 (task kill 후 자동로그인)
- `manifest.json` SW precache 제외 (`buildExcludes`) — Syntax error 방지
- 푸시 알림 전체 구현 완료 (v1.4.2)
  - VAPID 키 3종 Vercel 환경변수 필수: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`(동일 값), `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
  - SW 등록: `SWRegister` 컴포넌트가 앱 진입 시 등록만 수행 (권한 요청은 설정 토글 시)
  - 알림 토글 ON: SW 활성화 대기(statechange 이벤트) → `Notification.requestPermission()` → push 구독 → 서버 저장
  - 알림 3종: 멤버 러닝 기록, 목표 달성, 어제 기록 없음(Vercel cron 12:00 KST)

---

## 2026-05-02 작업 완료

### v1.7.0 (기능)
- [x] **크루원 스트릭 보기** — 크루 페이지에서 멤버 이름 클릭 시 해당 멤버의 스트릭 캘린더 조회
  - Supabase RPC 2종 추가: `get_member_month_runs`, `get_member_rolling_avg` (SECURITY DEFINER, 같은 그룹 멤버만 조회 가능)
  - `/member/[userId]` 페이지 신규, `MemberStreakView` 컴포넌트 신규
  - `DayDetailSheet` / `RunCard` / `StreakCalendar`: `readOnly` prop 추가 (수정·삭제·GPX 숨김)
  - GPX 지도는 Storage RLS 상 타인 파일 접근 불가로 미표시

### v1.6.0 (기능)
- [x] **크루 설정 다이얼로그** — 생성자 전용 ⚙️ 버튼, 이름·목표 기간 변경 가능
  - `PATCH /api/groups/[id]`: `name` 필드 추가
- [x] **크루 멤버 강퇴** — 생성자가 설정 다이얼로그에서 멤버 강퇴 (확인 단계 포함)
  - `DELETE /api/group-members`: `target_user_id` 옵션 추가

---

## 2026-04-27 작업 완료

### v1.5.1 (버그픽스)
- [x] **Shortcuts 알림 크루명 누락 수정** — `sync/route.ts` run 알림 body에 `groupNames` 추가 (`notify/route.ts`와 통일)
- [x] **목표 달성 알림 body 빈 문자열 제거** — `body: ''` → body 키 생략. `PushPayload.body` 타입을 `string | undefined`로 변경
- [x] **구독 stale row 누적 방지** — `POST /api/push/subscribe` 시 기존 구독 전체 삭제 후 재삽입 (upsert 대체)

### v1.5.0 (기능)
- [x] **설정 화면 PWA 설치 안내 카드** — 브라우저 접속 시만 표시, standalone 모드에서 자동 숨김
  - `PwaInstallSection` 컴포넌트 신규, 프로필 섹션 위에 배치
- [x] **알림 문구 개선** — 닉네임 뒤 조사 "님이"로 통일, 크루명 body 포함, 목표 달성 시 기간(오늘/이번 주/이번 달) 표시
- [x] **목표 달성 알림 버그 수정** — `goal_distance_km`을 `groups` 대신 `group_members`에서 참조하도록 수정
- [x] **구독 해제 DELETE endpoint 수정** — 클라이언트에서 endpoint 값을 DELETE body에 포함, DB row 정상 삭제 확인
- [x] **VAPID 키 변경 시 재구독 처리** — `subscribePush()`가 항상 기존 구독 unsubscribe 후 재구독, 400 (VapidPkHashMismatch) 구독 자동 정리

### 이전 작업
- [x] **앱 정보 & 버전 관리** — 설정 화면에 버전 + 변경 이력 (v1.3.0+)
  - `src/lib/changelog.ts` 신규, `package.json` 버전 `NEXT_PUBLIC_APP_VERSION`으로 노출
  - **버전 정책:** 기능 추가 → minor 올리고 changelog 노출 / 버그픽스 → patch만 올림
- [x] **PWA 자동로그인** — 쿠키 maxAge 1년 설정 완료. Refresh Token Duration은 Pro-only라 기본값 유지
- [x] **PWA 아이콘/주소창** — apple-mobile-web-app-capable, apple-touch-icon 추가
- [x] **푸시 알림 인프라 구축** (v1.4.0)
  - web-push VAPID, Vercel cron, push_subscriptions 테이블, worker/index.js
  - 알림 3종: 멤버 러닝 기록, 목표 달성, 어제 기록 없음(12:00 KST)
- [x] **iOS PWA 알림 토글 수정** (v1.4.2)
  - `push-client.ts` 분리: `swReady()`, `subscribePush()`, `savePushSubscription()` 공통 유틸
  - SW 활성화 대기 방식: polling → `statechange` 이벤트 리스너로 교체 (timeout 60s)
  - `SWRegister` 컴포넌트: 앱 진입 시 SW 등록만 수행. 자동 권한 요청(`requestPermission`) 제거
  - TypeScript 빌드 오류 수정: `urlBase64ToUint8Array` 반환 타입 `Uint8Array<ArrayBuffer>`로 명시
- [x] **VAPID 환경변수 정비**
  - Vercel에 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`(동일 값), `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` 4종 설정 필요
  - 키 변경 후 사용자/크루원 모두 토글 껐다 켜서 재구독 필요

---

## 이전 작업 완료 이력

### 2026-04-24 작업 완료
- [x] **Shortcuts 설명 수정** — NRC 안내 문구에 "당일 러닝 데이터만 등록" 명시
- [x] **심박수 에러 메시지 한국어** — "40~250 사이의 값을 입력해주세요."
- [x] **삼성 인터넷 브라우저 처리** — UA 감지 → Google 로그인 비활성화 + 경고 배너
- [x] **이메일 로그인 분기 처리** — 기존/신규 사용자 분리
- [x] **초대 링크 로그인 후 복귀** — `?next=` 파라미터 전파
- [x] **API 토큰 1인 1개 제한** — 재발급 시 기존 토큰 삭제
- [x] **심박수 입력 UI 개선** — 커스텀 −/+ 스테퍼
- [x] **directlogin rate limiting** — IP+email 기준 1분 5회 제한
- [x] **redirectTo 서버 검증** — 오픈 리다이렉트 방지

### 2026-04-23 작업 완료
- [x] **하단 네비바 대칭**, **기록 창 흔들림 제거**, **휠 피커 크기 축소**
- [x] **탭 전환 속도 개선 (SWR)**
- [x] **스트릭 캘린더 셀 색상 개선**
- [x] **커스텀 날짜 피커**
- [x] **크루 — 저번 목표 달성 여부 표시**

---

## 미결 이슈

- [ ] **listUsers 전체 스캔 개선** — Supabase admin JS 타입에 `generateLink.shouldCreateUser` 미지원으로 유지 중. rate limiting(1분 5회)으로 열거 공격 실용성 완화. 향후 SDK 업데이트 시 재검토

- [ ] **Google OAuth 동의 화면 서비스명 변경** — 현재 `supabase.co` 도메인 이름으로 표시됨
  - Google Cloud Console → OAuth 동의 화면 → 앱 이름/도메인 수정

- [ ] **도메인 변경** — 현재 `runstreak-nine.vercel.app`
  - Vercel에서 커스텀 도메인 연결 가능 (유료 도메인 구매 필요, 약 $10~15/년)
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
- **Supabase Refresh Token Duration:** 기본 7일, 늘리려면 Pro 플랜 필요
