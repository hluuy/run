# Project: Running Tracker (Web)
**Platform:** Web — Next.js 15, React 19, TypeScript

> **왜 웹인가:** iOS 버전(Run/ios/CLAUDE.md)은 Apple Developer Program($99/년)이 실기기 배포에 필요하다. 웹 버전은 Vercel Hobby 플랜으로 무료 배포 가능하며, 친구 그룹 규모에서 추가 비용이 발생하지 않는다.

---

## 1. Core Purpose

A private, streak-based running tracker for a small group of friends.
Users log runs manually or via iOS Shortcuts automation, optionally attach a GPX file for map visualization, and share group progress and individual streaks to boost motivation.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, React 19, TypeScript) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Animation | Framer Motion (micro-interactions, subtle) |
| Auth | Supabase Auth (Google OAuth + Email Magic Link) |
| Database | Supabase (PostgreSQL + Row Level Security) |
| File Storage | Supabase Storage (GPX files) |
| Map | Leaflet.js + OpenStreetMap (GPX 첨부 시에만 렌더링) |
| Forms | React Hook Form + Zod |
| Charts | Recharts (월간 통계, 리더보드) |
| PWA | next-pwa (홈 화면 추가, 오프라인 캐시) |
| Hosting | Vercel (Hobby — 무료) |

### Design Direction
- **shadcn/ui** 기반 컴포넌트 시스템
- **다크모드 우선** (system-aware, `next-themes`)
- 모바일 퍼스트 레이아웃 (PWA 설치 시 네이티브 앱 유사 UX)
- 애니메이션은 절제 (Framer Motion — 페이지 전환, 카드 진입 정도)
- 색상: 중립 계열 베이스 + 오렌지 계열 스트릭 강조색
- 글래스모피즘 사용 금지 (구식) — 깔끔한 플랫 + 미세한 elevation

---

## 3. 런 데이터 입력 방식 (3가지 병행)

### A. 수동 입력 (기본)
- 웹 폼: 날짜, 거리(km), 소요시간, 평균 심박수(선택), GPX 파일(선택)
- 거리와 소요시간으로 페이스 자동 계산
- 하루 여러 러닝 레코드 허용 (같은 날 2회 러닝 각각 기록 가능)
- 완전 동일한 기록 중복 제출은 `workout_source_id` 기반으로 차단 (§11 참조)

### B. iOS Shortcuts 자동화 (선택)
- 각 친구가 iPhone "단축어" 앱에서 **"운동 종료 시"** 자동화 설정
- 단축어가 Apple Health에서 최근 workout 데이터(스탯 전용)를 읽어 웹 앱 API로 POST
- **전송 데이터:** 거리, 소요시간, 심박수, 날짜, `workout_source_id`(HKWorkout UUID) — **스탯 전용**
- **GPS 경로 추출:** 기술적으로 가능하나 Shortcuts에서 `HKWorkoutRoute` 접근이 복잡하므로 **MVP 범위 제외**. GPX는 별도 수동 업로드로 처리
- **엔드포인트:** `POST /api/runs/sync`
- 인증: 사용자별 **API 토큰** (Settings 화면에서 발급/재발급)
- Shortcut 설정 파일(.shortcut)을 앱 내 Settings에서 다운로드 제공
- 완전 자동화는 iOS가 가끔 확인 알림을 띄울 수 있어 100% 무인화 불가

### C. GPX 파일 업로드 (선택 — 지원 범위는 §4 참조)
- 수동 입력 폼 또는 Shortcuts POST 시 GPX 파일 첨부 가능
- 파일은 Supabase Storage에 저장, DB에는 경로만 기록

---

## 4. GPX 파일 지원 범위

GPX(GPS Exchange Format)는 Apple Watch 러닝 기록에서 내보낼 수 있는 XML 기반 GPS 데이터 포맷이다.

### 지원되는 기능
| 기능 | 지원 여부 | 비고 |
|---|---|---|
| 경로 지도 시각화 | ✅ | Leaflet.js 폴리라인 렌더링 |
| 거리 자동 계산 | ✅ | 좌표 간 Haversine 공식 |
| 페이스 자동 계산 | ✅ | 타임스탬프 + 거리 |
| 고도 프로필 | ✅ | `<ele>` 태그 존재 시 |
| 심박수 | ✅ | Garmin GPX 확장(`<gpxtpx:hr>`) 포함 시 |
| 시작/종료 지점 마커 | ✅ | |

### 지원되지 않는 기능
| 기능 | 이유 |
|---|---|
| 자동 동기화 | GPX는 수동 업로드 또는 Shortcuts로 전달 |
| Apple Watch 자동 연동 | Apple은 HealthKit 웹 API 미제공 |
| 실시간 위치 추적 | 웹 앱 범위 아님 |

### GPX 없는 경우 처리
- 지도 섹션 미표시 (스탯 카드만 렌더링)
- "GPS 경로 없음" 메시지 표시 (조용하게, 비침습적)

### GPX 파싱
- 클라이언트 사이드: `gpxparser` 라이브러리
- 파싱 후 좌표 배열은 DB에 저장하지 않음 — Supabase Storage의 원본 GPX 파일을 지도 렌더링 시 fetch하여 파싱

---

## 5. Supabase Database Schema

### `users`
```sql
id            uuid PRIMARY KEY  -- Supabase Auth user id
nickname      text NOT NULL
created_at    timestamptz DEFAULT now()
```

> **rolling average는 저장하지 않음.** `avg_distance_km`, `avg_pace_sec_per_km`은 클라이언트 사이드에서 RPC 호출로 동적 계산. DB에 캐싱하면 갱신 타이밍 버그 위험이 있다.

### `runs`
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id          uuid REFERENCES users(id) ON DELETE CASCADE
workout_source_id text                     -- HKWorkout UUID (Shortcuts 중복 방지); 수동 입력 시 NULL
UNIQUE (user_id, workout_source_id)        -- 사용자 단위 복합 UNIQUE (전역 UNIQUE 시 타 사용자 UUID 충돌 DoS 방지)
date             timestamptz NOT NULL       -- UTC 기준 운동 시작 시각
local_date_key   text NOT NULL              -- "YYYY-MM-DD" (사용자 로컬 타임존)
distance_km      float8 NOT NULL
duration_sec     int NOT NULL
avg_pace_sec_per_km float8 NOT NULL        -- 낮을수록 빠름
avg_heart_rate_bpm  float8                 -- nullable
gpx_storage_path text                      -- Supabase Storage 경로, nullable
source           text DEFAULT 'manual'     -- 'manual' | 'shortcut' | 'gpx'
created_at       timestamptz DEFAULT now()
```

> **하루 복수 러닝 허용:** 같은 `local_date_key`에 여러 레코드가 존재할 수 있다. 스트릭은 `GROUP BY local_date_key`로 집계. 강도 색상은 해당 날짜 `SUM(distance_km)`을 기준으로 계산.

> **중복 방지:** `(user_id, workout_source_id)` 복합 UNIQUE 제약. 수동 입력 레코드는 NULL (UNIQUE는 NULL 값을 중복으로 취급하지 않음). 전역 UNIQUE 대신 사용자 단위 복합 UNIQUE를 사용해 타 사용자가 동일 UUID를 POST해도 충돌하지 않음.

> **그룹 삭제:** `groups` 삭제 시 `group_members`, `invites`는 `ON DELETE CASCADE`로 자동 삭제. 개인 `runs` 레코드는 보존됨 (그룹과 직접 FK 없음).

### `groups`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
name            text NOT NULL
goal_type       text NOT NULL  -- 'daily' | 'weekly' | 'monthly'
goal_distance_km float8 NOT NULL
created_by      uuid REFERENCES users(id)
created_at      timestamptz DEFAULT now()
```

### `group_members`
```sql
group_id   uuid REFERENCES groups(id) ON DELETE CASCADE
user_id    uuid REFERENCES users(id) ON DELETE CASCADE
joined_at  timestamptz DEFAULT now()
PRIMARY KEY (group_id, user_id)
```

### `invites`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
token       uuid UNIQUE DEFAULT gen_random_uuid()  -- URL에 노출되는 값
group_id    uuid REFERENCES groups(id) ON DELETE CASCADE
created_by  uuid REFERENCES users(id)
expires_at  timestamptz NOT NULL    -- 생성 후 7일
max_uses    int DEFAULT 20
use_count   int DEFAULT 0
revoked     bool DEFAULT false
created_at  timestamptz DEFAULT now()
```

### `api_tokens` (Shortcuts 인증용)
```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id    uuid REFERENCES users(id) ON DELETE CASCADE
token_hash text NOT NULL  -- SHA-256 해시만 저장, 원문은 발급 시 1회 노출
created_at timestamptz DEFAULT now()
last_used_at timestamptz
```

### RPC 함수 목록

#### `get_user_rolling_avg(p_user_id uuid)` — 개인 평균 (INVOKER)
```sql
-- 최근 30회 러닝의 개인 평균 거리·페이스를 동적으로 계산
-- RLS "own runs" 정책 범위 내에서 실행 (본인 데이터만) → SECURITY DEFINER 불필요
CREATE OR REPLACE FUNCTION get_user_rolling_avg(p_user_id uuid)
RETURNS TABLE(avg_distance_km float8, avg_pace_sec_per_km float8)
LANGUAGE sql STABLE AS $$
  SELECT
    AVG(distance_km)          AS avg_distance_km,
    AVG(avg_pace_sec_per_km)  AS avg_pace_sec_per_km
  FROM (
    SELECT distance_km, avg_pace_sec_per_km
    FROM runs
    WHERE user_id = p_user_id
    ORDER BY date DESC
    LIMIT 30
  ) last30;
$$;
```

#### `is_group_member(p_group_id uuid, p_user_id uuid)` — 멤버십 검증 (SECURITY DEFINER)
```sql
-- group_members RLS가 자기 테이블을 참조하면 재귀 오류 발생.
-- SECURITY DEFINER 함수로 우회 — 내부에서 직접 테이블 스캔.
CREATE OR REPLACE FUNCTION is_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;
```

#### `get_group_leaderboard(p_group_id uuid, p_start text, p_end text)` — 리더보드 (SECURITY DEFINER)
```sql
-- RLS "own runs" / "own profile" 정책을 우회해 그룹 멤버 전체 집계.
-- 호출자가 해당 그룹 멤버인지 내부에서 검증 후 실행.
-- p_start / p_end: "YYYY-MM-DD" 형식 (local_date_key 범위)
CREATE OR REPLACE FUNCTION get_group_leaderboard(
  p_group_id uuid,
  p_start    text,
  p_end      text
)
RETURNS TABLE(user_id uuid, nickname text, total_km float8)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  -- 호출자가 그룹 멤버인지 검증
  SELECT r.user_id, u.nickname, SUM(r.distance_km) AS total_km
  FROM runs r
  JOIN users u ON u.id = r.user_id
  WHERE r.user_id IN (
      SELECT gm.user_id FROM group_members gm WHERE gm.group_id = p_group_id
    )
    AND is_group_member(p_group_id, auth.uid())  -- 호출자 멤버십 게이트
    AND r.local_date_key BETWEEN p_start AND p_end
  GROUP BY r.user_id, u.nickname
  ORDER BY total_km DESC;
$$;
```

> - 리더보드는 `supabase.rpc('get_group_leaderboard', { p_group_id, p_start, p_end })` 로 호출.
> - `runs`, `users` RLS는 개인 데이터 보호용으로 그대로 유지 (`own` 정책). 리더보드만 이 함수를 통해 우회.
> - `get_user_rolling_avg`는 본인 데이터만 읽으므로 SECURITY DEFINER 불필요.

---

## 6. Row Level Security (RLS) 정책

> **설계 원칙:** `runs`·`users`는 "본인 데이터만" RLS 유지. 그룹 멤버 집계(리더보드)는 `get_group_leaderboard` SECURITY DEFINER RPC를 통해서만 접근. `group_members` 재귀 참조는 `is_group_member()` 함수로 우회.

```sql
-- ── users: 본인만 읽기/쓰기 ──────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON users FOR UPDATE USING (auth.uid() = id);

-- ── runs: 본인만 읽기/쓰기 ───────────────────────────────────────────
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own runs select" ON runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own runs insert" ON runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own runs update" ON runs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own runs delete" ON runs FOR DELETE USING (auth.uid() = user_id);

-- ── groups: 멤버 읽기 / 생성자 수정·삭제 ────────────────────────────
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "member can read" ON groups FOR SELECT
  USING (is_group_member(id, auth.uid()));
CREATE POLICY "auth user can create" ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "creator can update" ON groups FOR UPDATE
  USING (auth.uid() = created_by);
CREATE POLICY "creator can delete" ON groups FOR DELETE
  USING (auth.uid() = created_by);

-- ── group_members: is_group_member() 함수로 재귀 참조 방지 ───────────
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "member can read" ON group_members FOR SELECT
  USING (is_group_member(group_id, auth.uid()));   -- 자기 테이블 직접 참조 금지
CREATE POLICY "member can join" ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);               -- 본인만 자신을 삽입
CREATE POLICY "member can leave" ON group_members FOR DELETE
  USING (auth.uid() = user_id);                    -- 본인 탈퇴만 허용

-- ── invites: 읽기(미리보기) / 멤버 생성 / use_count 증가 ─────────────
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth can read" ON invites FOR SELECT
  USING (auth.uid() IS NOT NULL AND revoked = false AND expires_at > now());
CREATE POLICY "member can create" ON invites FOR INSERT
  WITH CHECK (is_group_member(group_id, auth.uid()));
-- use_count 증가는 서버 측 API Route에서 service_role 키로 처리
-- (RLS UPDATE 정책을 열면 임의 조작 가능 → 서버에서만 허용)

-- ── api_tokens: 본인만 읽기/쓰기 ─────────────────────────────────────
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tokens select" ON api_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own tokens insert" ON api_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own tokens delete" ON api_tokens FOR DELETE USING (auth.uid() = user_id);
```

---

## 7. Supabase Storage 정책

```
버킷: gpx-files (private)
경로: gpx-files/{user_id}/{run_id}.gpx
```

```sql
-- 업로드: 본인 user_id 경로에만 허용
CREATE POLICY "gpx upload own" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gpx-files'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- 다운로드: 본인 user_id 경로에만 허용
CREATE POLICY "gpx download own" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'gpx-files'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- 삭제: 본인 user_id 경로에만 허용
CREATE POLICY "gpx delete own" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'gpx-files'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );
```

---

## 8. Streak Logic

- **정의:** `local_date_key` 기준으로 해당 날짜에 `runs` 레코드가 1개 이상이면 스트릭 달성
- **하루 복수 러닝:** 같은 날 여러 레코드 허용. 스트릭 집계는 `GROUP BY local_date_key` (날짜 단위)
- **타임존:** 전 멤버 **KST(UTC+9) 고정**. `local_date_key`는 클라이언트에서 KST 기준으로 계산해 저장. 서버(UTC) 변환 없음
- **목표 기간 기준 (그룹 리더보드):**
  - `daily`: 당일 KST 날짜 (`local_date_key = today`)
  - `weekly`: **일요일 시작** 기준 주. `p_start` = 직전 일요일, `p_end` = 해당 토요일 (KST 날짜 문자열로 계산해 RPC에 전달)
  - `monthly`: 해당 월의 첫날~말일 (`YYYY-MM-01` ~ `YYYY-MM-DD`)
- **강도 색상 그라데이션:**
  - 하루 러닝이 여러 건이면 `SUM(distance_km)` (일별 총합)을 기준으로 비교
  - `SUM(distance_km)`과 해당 날의 대표 페이스(`AVG(avg_pace_sec_per_km)`)를 `get_user_rolling_avg()` RPC 결과와 비교
  - 평균 미만 → 베이스 색상 (연한 오렌지)
  - 총 거리 초과 OR 페이스 빠름(낮은 sec/km) → 점점 진한 색상
  - 총 거리 초과 AND 페이스 빠름 → 최대 강도 색상
  - `intensity_score` (0.0–1.0): 표시 시 클라이언트에서 계산, DB 저장 안 함

---

## 9. UI/UX 화면 구성

### Page 1 — 내 스트릭 (메인, `/`)
- 월간 캘린더 그리드 — 각 날짜 셀을 스트릭 강도 색상으로 표시
- 날짜 클릭 → 슬라이드업 패널: 해당 러닝 스탯 (거리, 페이스, 심박수)
- GPX 있는 경우: Leaflet 지도로 경로 폴리라인 렌더링
- GPX 없는 경우: 스탯 카드만 표시
- 우상단 **"+ 러닝 기록"** 버튼 → 입력 모달

### Page 2 — 크루 (`/crew`)
- 참여 중인 그룹 목록
- 그룹 상세:
  - 목표 대비 진행률 프로그레스 바
  - 리더보드 (목표 기간 내 총 `distance_km` 순)
  - **"친구 초대"** 버튼 → 초대 링크 생성 및 클립보드 복사 또는 공유

### Page 3 — 설정 (`/settings`)
- 닉네임 수정
- Shortcuts API 토큰 발급/재발급 (토큰은 발급 시 1회만 노출)
- Shortcuts 설정 파일 다운로드 (.shortcut)
- 계정 삭제 (즉시 영구 삭제, 확인 다이얼로그 필수)
- 로그아웃

---

## 10. 그룹 초대 플로우

1. 멤버가 "친구 초대" 클릭
2. 서버: `invites` 테이블에 UUID 토큰 생성 (7일 만료)
3. 초대 링크 생성: `https://[domain]/invite/[token]`
4. 링크를 클립보드 복사 or 공유 (Web Share API → iMessage, 카카오톡 등)
5. 수신자가 링크 클릭 → `/invite/[token]` 페이지 → 그룹명 미리보기
6. 로그인 후 "참여하기" 클릭 → 서버에서 토큰 검증 (만료/사용횟수/revoke) → `group_members` 삽입
7. Rate limiting: 동일 IP에서 10분 내 5회 이상 가입 시도 시 차단

---

## 11. iOS Shortcuts 연동 API

### `POST /api/runs/sync`
```
Headers:
  Authorization: Bearer {api_token}
  Content-Type: application/json

Body:
{
  "workout_source_id": "HKWorkout-UUID-string",  // HKWorkout.uuid — 중복 방지 키
  "date": "2026-04-21T07:30:00+09:00",           // ISO 8601
  "distance_km": 5.2,
  "duration_sec": 1560,
  "avg_heart_rate_bpm": 148,                      // optional
  "local_date_key": "2026-04-21"                  // Shortcut에서 계산
}

Response 201: { "run_id": "uuid" }
Response 409: { "error": "duplicate" }   // 동일 workout_source_id 이미 존재 시
Response 400: { "error": "invalid_payload" }
Response 429: { "error": "rate_limited" }
```

- **중복 방지:** `(user_id, workout_source_id)` 복합 UNIQUE 제약으로 DB 레벨 차단. 같은 날 다른 HKWorkout UUID는 정상 삽입됨 (하루 2회 러닝 허용). 타 사용자가 동일 UUID를 POST해도 충돌 없음.
- API 토큰은 `api_tokens` 테이블에 SHA-256 해시로 저장. 원문은 발급 시 1회만 노출.
- Rate limiting: 동일 토큰에서 1분 내 10회 초과 시 429 반환

---

## 12. 보안 고려사항

| 항목 | 대응 |
|---|---|
| XSS | React 기본 이스케이프, dangerouslySetInnerHTML 사용 금지 |
| CSRF | Next.js App Router Server Actions 사용 (자동 CSRF 방어) |
| SQL Injection | Supabase 파라미터 바인딩 (ORM 레벨 방어) |
| 초대 링크 brute-force | UUID v4 토큰 (2¹²² 조합), 만료 7일, rate limiting |
| API 토큰 탈취 | DB에 해시만 저장, HTTPS 필수 |
| GPX 파일 악성 업로드 | 파일 크기 제한 10MB, MIME 타입 검증 (`application/gpx+xml`), 서버에서 XML 파싱 전 sanitize |
| 민감 데이터 로깅 | 거리, 페이스, 심박수, GPS 좌표를 서버 로그에 기록 금지 |

---

## 13. 오프라인 / PWA

- `next-pwa`로 서비스 워커 등록
- 캐시 전략: 캘린더/리더보드 페이지는 stale-while-revalidate
- 오프라인 시 캐시된 데이터 표시, 새 러닝 입력 폼은 비활성화 (또는 로컬 큐잉 후 온라인 복귀 시 제출)
- 상단 배너: "오프라인 — 네트워크 연결 시 동기화됩니다"

---

## 14. 개발 로드맵

| Step | Task |
|---|---|
| 1 | Next.js 15 프로젝트 셋업 — Tailwind CSS 4, shadcn/ui, Supabase 연결 |
| 2 | Supabase DB 스키마 생성 + RLS 정책 적용 + `get_user_rolling_avg` RPC 함수 등록 |
| 3 | Supabase Auth 연동 — Google OAuth, Email Magic Link, 온보딩 닉네임 입력 |
| 4 | 수동 러닝 입력 폼 (React Hook Form + Zod 유효성 검사) |
| 5 | 스트릭 캘린더 UI — 월간 그리드, 강도 색상 그라데이션 |
| 6 | GPX 업로드 + 클라이언트 파싱 + Leaflet 지도 렌더링 |
| 7 | Shortcuts API 엔드포인트 (`/api/runs/sync`) + API 토큰 발급/관리 |
| 8 | 그룹 기능 — 생성, 초대 링크, 멤버 리더보드 |
| 9 | 설정 화면 — 닉네임 수정, 토큰 관리, 계정 삭제 |
| 10 | PWA 설정 (next-pwa, 오프라인 캐시, 홈 화면 설치) |
| 11 | 보안 강화 — rate limiting (Upstash Redis), GPX sanitize, 입력 검증 |
| 12 | Vercel 배포 + 환경변수 설정 + 도메인 연결 (선택) |

---

## 15. 예상 비용

| 항목 | 비용 |
|---|---|
| Vercel Hobby | 무료 |
| Supabase Free Tier | 무료 (DB 500MB, Storage 1GB, 월 50만 API 요청) |
| Upstash Redis (rate limiting) | 무료 (월 10,000 요청) |
| 도메인 | 선택사항 (~$10/년) |
| **합계** | **$0/월** (도메인 제외) |

---

## 16. Open Questions

- [ ] **Shortcuts 미사용 친구:** 수동 입력만 사용하는 멤버와 Shortcuts 사용자 간 UX 차이 없도록 설계 유지
- [ ] **트레드밀 러닝 UX:** GPX 없는 러닝은 스탯 카드만 표시. "GPS 경로 없음" 메시지를 명시적으로 노출할지, 조용히 생략할지?

---

## 결정 완료 사항 (Open Questions에서 제거됨)

| 항목 | 결정 내용 |
|---|---|
| 하루 복수 러닝 | ✅ 허용. `local_date_key` 기준 `GROUP BY`로 스트릭 집계, `SUM(distance_km)`으로 강도 계산 |
| 닉네임 변경 시 리더보드 | ✅ `get_group_leaderboard` RPC 내 JOIN 방식. 비정규화 없음, 소급 반영 자동 |
| 그룹 삭제 | ✅ `ON DELETE CASCADE`로 `group_members`, `invites` 자동 삭제. 개인 `runs` 보존 |
| 강도 색상 일별 집계 | ✅ 하루 여러 러닝이면 `SUM(distance_km)` 총합을 평균과 비교 |
| Tailwind CSS 버전 | ✅ v4 유지 (2025년 1월 stable 릴리스, shadcn/ui 공식 지원) |
| RLS vs 리더보드 충돌 | ✅ SECURITY DEFINER RPC(`get_group_leaderboard`) 방식 채택. `runs`·`users` RLS 유지 |
| group_members RLS 재귀 | ✅ `is_group_member()` SECURITY DEFINER 함수로 우회 |
| workout_source_id UNIQUE | ✅ 전역 → `(user_id, workout_source_id)` 복합 UNIQUE로 변경 |
| 리더보드 타임존 | ✅ KST(UTC+9) 고정 |
| weekly 목표 주 시작 | ✅ 일요일 시작 |

---

## 17. Trust Model

이 서비스는 **신뢰할 수 있는 지인 전용 프라이빗 웹앱**이다.

- 수동 입력이므로 러닝 데이터의 진실성은 서버에서 검증하지 않는다.
- Shortcuts 연동도 클라이언트(iPhone)에서 전달한 값을 신뢰한다.
- 리더보드 순위는 적대적 환경에서 안전하지 않다.
- 공개 서비스 전환 시 데이터 검증 레이어를 별도 설계해야 한다.

---

## 18. iOS 버전 참고

iOS 네이티브 버전 스펙은 `Run/ios/CLAUDE.md` 참조.
Apple Developer Program 비용($99/년) 해결 시 iOS 버전으로 전환 고려 가능.
iOS 버전은 HealthKit 자동 동기화, GPS 경로 자동 수집, CKShare 네이티브 초대 등 웹 버전 대비 UX가 크게 우수하다.
