---
name: 런 트래커 프로젝트
description: Next.js 러닝 스트릭 트래커 웹앱 — 완료된 스텝, 배포 정보, 특이사항
type: project
---

GitHub: https://github.com/hluuy/run (Run/web 폴더)
Vercel: https://runstreak-nine.vercel.app
Supabase 프로젝트 ID: esadwhgplxzgdazurvov

**Why:** 친구 소규모 그룹용 러닝 동기부여 앱. Apple Developer Program 비용 없이 무료 배포.

**How to apply:** 이 프로젝트 이어서 작업 시 Run/web/CLAUDE.md와 이 메모 참고.

## 완료 현황
12개 스텝 전부 완료. 현재 프로덕션 배포 중.

## 핵심 특이사항
- Next.js 16: `middleware.ts` → `proxy.ts`, export 함수명 `proxy`
- shadcn/ui가 Base UI 기반 → `asChild` 미지원, `render` prop 사용
- 빌드: `next build --webpack` (next-pwa Turbopack 미지원)
- .env.local은 gitignore → 새 환경에서 Supabase 대시보드에서 직접 입력
