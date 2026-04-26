# 작업 현황 (2026-04-27 업데이트)

## 서비스 정보
- **프로덕션:** https://runstreak-nine.vercel.app
- **GitHub:** https://github.com/hluuy/run
- **스택:** Next.js 15, Supabase, Vercel, Tailwind CSS 4, shadcn/ui
- **현재 버전:** 1.4.1

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

## 🚨 내일 최우선 작업

### 알림 토글 — iOS PWA에서 동작 안 함

**증상:** 알림 토글 ON 시 "서비스 워커 준비 실패. 앱을 다시 열어주세요." 오류

**원인 분석:**
- `navigator.serviceWorker.ready`가 iOS PWA에서 resolve되지 않는 알려진 문제
- 최신 커밋(f1d19d8)에서 `polling 방식`으로 교체 (`getRegistration()` + 500ms 루프, 10초 타임아웃)
- 배포 후 재확인 필요

**다음 시도할 것 (아직 미시도):**
1. 배포 후 토글 재시도 → 오류 메시지 확인
   - "서비스 워커 준비 실패" → SW 자체가 등록 안 됨. Vercel에서 `sw.js` 접근 가능한지 확인
   - "구독 실패: ..." → iOS가 push subscription 자체를 거부. 엔드포인트 도메인 화이트리스트 문제 가능성
   - "서버 오류 4xx" → subscribe API 문제
2. iOS에서 `/sw.js` URL 직접 열어보기 — 파일이 정상 서빙되는지 확인
3. 만약 SW가 등록은 됐지만 `active` 상태가 아니라면 → `skipWaiting` 동작 확인
4. Vercel 배포 로그에서 `push/subscribe` API 호출 성공 여부 확인

**관련 파일:**
- `src/components/settings/notification-section.tsx` — 토글 UI + swReady 로직
- `src/app/api/push/subscribe/route.ts` — 구독 저장 API (ALLOWED_PUSH_HOSTS 화이트리스트 있음)
- `src/app/api/push/notify/route.ts` — 러닝 기록 시 푸시 발송
- `src/lib/push.ts` — web-push sendNotification 래퍼
- `worker/index.js` — SW push/notificationclick 핸들러
- `vercel.json` — cron 설정 (`0 3 * * *` = 매일 12:00 KST)

**알림 흐름:**
1. 사용자가 토글 ON → `pushManager.subscribe()` → `POST /api/push/subscribe` → `push_subscriptions` 테이블 저장
2. 러닝 기록 저장 → `fetch('/api/push/notify')` → 같은 그룹 멤버에게 web-push 발송
3. 매일 12:00 KST → Vercel cron → `GET /api/push/cron` → 어제 기록 없는 사용자에게 리마인더

**Supabase 테이블 확인 필요:**
- `push_subscriptions` 테이블 존재 여부 (없으면 SQL 실행 필요)
- `users.notifications_enabled` 컬럼 존재 여부

```sql
-- push_subscriptions 테이블 (없으면 생성)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- users 테이블에 notifications_enabled 컬럼 (없으면 추가)
ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT true;
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
- 앱 정보 & 버전 히스토리 (v1.3.0~)
- **알림 토글 UI 완성** — 실제 동작은 미결 (위 참조)

### PWA
- next-pwa 설정, manifest.json, apple-touch-icon, apple-mobile-web-app-capable
- 세션 쿠키 maxAge 1년 (task kill 후 자동로그인)
- `manifest.json` SW precache 제외 (`buildExcludes`) — Syntax error 방지
- 푸시 알림 인프라 (VAPID, push_subscriptions, worker/index.js, Vercel cron) — 토글 오류만 미해결

---

## 2026-04-27 작업 완료

- [x] **앱 정보 & 버전 관리** — 설정 화면에 버전 + 변경 이력 (v1.3.0+)
  - `src/lib/changelog.ts` 신규, `package.json` 버전 `NEXT_PUBLIC_APP_VERSION`으로 노출
  - **버전 정책:** 기능 추가 → minor 올리고 changelog 노출 / 버그픽스 → patch만 올림
- [x] **PWA 자동로그인** — 쿠키 maxAge 1년 설정 완료. Refresh Token Duration은 Pro-only라 기본값 유지
- [x] **PWA 아이콘/주소창** — apple-mobile-web-app-capable, apple-touch-icon 추가
- [x] **푸시 알림 인프라 구축** (v1.4.0)
  - web-push VAPID, Vercel cron, push_subscriptions 테이블, worker/index.js
  - 알림 3종: 멤버 러닝 기록, 목표 달성, 어제 기록 없음(12:00 KST)
  - `notify/route.ts` 쿼리 버그 수정: `goal_distance_km`을 group_members 대신 groups에서 참조
- [x] **알림 토글 재구현** — SW polling 방식으로 교체, 오류 메시지 구체화

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

- [ ] **알림 토글 iOS PWA 동작 확인** — 내일 최우선 (위 상세 참조)

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
