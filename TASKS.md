# 작업 현황 (2026-04-23)

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
- Google OAuth 로그인
- 이메일 입력만으로 즉시 로그인 (OTP 없음)
  - `POST /api/auth/directlogin` → `admin.generateLink` → `verifyOtp(token_hash)` 방식
  - 이전 OTP 6자리 흐름은 `src/app/auth/login/page.tsx`에 주석으로 보존
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
- [ ] **CSS 현대화** — 딥 네이비 + 오렌지/코랄 액센트 디자인 시스템으로 전체 개편
  - 글래스모피즘 (backdrop-blur, 반투명 카드)
  - 그라데이션 버튼/액센트 (오렌지 → 코랄)
  - globals.css 색상 토큰 교체, 주요 컴포넌트 스타일 업데이트
- [x] **input font-size 16px 적용** — globals.css에 일괄 적용 완료
- [ ] **PWA 앱 아이콘 제작** — 홈 화면 추가 시 표시될 아이콘
  - 필요 사이즈: 192×192, 512×512 (maskable 포함)
  - manifest.json 아이콘 경로 연결
- [x] 계정 삭제 기능 — Dialog 확인, localStorage 토큰 정리, 영구 삭제 완료
- [ ] PWA 오프라인 설정 (next-pwa 설치됨, 설정 미완)
- [x] Rate limiting — Upstash Redis 교체 완료, 남은 시간 메시지 반환

---

## 주요 아키텍처 결정 (변경 금지)

| 항목 | 결정 |
|------|------|
| DB 쓰기 | admin client(service role) 사용 — RLS `auth.uid()` null 우회 |
| 미들웨어 | `proxy.ts` 사용. `middleware.ts` 절대 생성 금지 (충돌) |
| 그룹 리더보드 | `get_group_leaderboard` SECURITY DEFINER RPC |
| 심박수 필드 | `setValueAs` 사용 (`valueAsNumber` 충돌) |
| 로그인 | 이메일 → 즉시 로그인 (OTP 비활성화 상태) |

---

## 알려진 한계

- **iOS 26 Shortcuts:** HealthKit 접근 차단 — 운동 데이터 자동 수집 불가
  - Nike Run Club / Strava 모바일 앱 모두 Shortcuts 액션 없음
  - 근본 해결: 네이티브 iOS 앱 필요 (Apple Developer Program $99/년)
- **API 토큰:** 다른 기기에서는 토큰 원문 표시 안 됨 (localStorage는 기기별)
