# 런 트래커 프로젝트 컨텍스트

## 프로젝트 개요
- Next.js 15 기반 러닝 스트릭 트래커 웹앱
- 친구 소규모 그룹용 프라이빗 앱
- CLAUDE.md: `Run/web/CLAUDE.md` 참조

## 배포 정보
- GitHub: https://github.com/hluuy/run (Run/web 폴더)
- Vercel: https://runstreak-nine.vercel.app
- Supabase 프로젝트: esadwhgplxzgdazurvov

## 완료된 스텝 (전체 완료)
- Step 1: Next.js 15 + Tailwind CSS 4 + shadcn/ui + Supabase 셋업
- Step 2: Supabase DB 스키마 + RLS + RPC 함수 (SQL Editor에서 직접 실행)
- Step 3: Auth (Google OAuth + Magic Link) + 온보딩 닉네임
- Step 4: 수동 러닝 입력 폼 (React Hook Form + Zod)
- Step 5: 스트릭 캘린더 UI (월간 그리드, 강도 색상, 통계 카드)
- Step 6: GPX 업로드 + Leaflet 지도
- Step 7: Shortcuts API (/api/runs/sync) + API 토큰 발급
- Step 8: 그룹 기능 (생성, 초대 링크, 리더보드)
- Step 9: 설정 화면 (닉네임, 토큰, 로그아웃, 계정 삭제)
- Step 10: PWA (next-pwa, manifest, 오프라인 배너)
- Step 11: 보안 강화 (GPX sanitize, 보안 헤더)
- Step 12: Vercel 배포 완료

## 주요 기술 스택
- Framework: Next.js 16.2.4 (App Router)
- Auth: Supabase Auth (Google OAuth + Magic Link)
- DB: Supabase PostgreSQL + RLS
- UI: shadcn/ui (Base UI 기반) + Tailwind CSS 4
- 지도: Leaflet.js + OpenStreetMap
- PWA: next-pwa

## 중요 특이사항
- Next.js 16에서 middleware.ts → proxy.ts로 변경, export 함수명도 `proxy`
- shadcn/ui가 Base UI 기반 → asChild 미지원, render prop 사용
- build 시 --webpack 플래그 필요 (next-pwa가 Turbopack 미지원)
- .env.local은 gitignore에 포함 → 집에서 작업 시 직접 입력 필요

## 환경변수 (Supabase 대시보드 → Settings → API에서 확인)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
