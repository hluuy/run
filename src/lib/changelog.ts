export interface ChangelogEntry {
  version: string
  date: string
  features: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.14.0',
    date: '2026-06-02',
    features: [
      'Strava 웹훅 — 새 러닝 기록 자동 동기화 (Strava에 기록 저장 시 즉시 반영)',
      'Strava 활동 수정 시 앱 기록도 자동 업데이트',
      'Strava 활동 삭제 시 연동된 러닝 기록도 자동 삭제',
      '웹훅으로 기록 추가 시 푸시 알림 발송',
    ],
  },
  {
    version: '1.13.0',
    date: '2026-06-02',
    features: [
      '러닝화 마일리지 관리 — 신발별 누적 km 및 목표 진행률 표시',
      '러닝 기록 시 신발 선택, Strava 동기화 시 대표 신발 자동 할당',
      'Strava 동기화 되돌리기 — 마지막 동기화 기록 일괄 취소',
    ],
  },
  {
    version: '1.11.0',
    date: '2026-05-21',
    features: [
      'Strava OAuth 연동 — 설정에서 버튼 한 번으로 연결',
      '동기화 버튼으로 Strava 러닝 기록 즉시 가져오기 (경로, 페이스, 심박수, 구간 포함)',
    ],
  },
  {
    version: '1.10.0',
    date: '2026-05-18',
    features: [
      '크루 주간 목표 — 주 시작 요일 설정 (일~토)',
      '크루 월간 목표 — 월 시작일 설정 (1~28일)',
    ],
  },
  {
    version: '1.9.0',
    date: '2026-05-13',
    features: [
      '개인 통계 — 누적 거리/횟수, 최고 페이스, 최장 거리, 현재/역대 최장 스트릭, 월별 거리 차트',
    ],
  },
  {
    version: '1.8.0',
    date: '2026-05-13',
    features: [
      'Strava 연동 — 경로 지도 자동 표시 (polyline)',
      'km별 페이스·심박수 구간 기록 표시 (splits)',
      '트레드밀 러닝 자동 감지 및 뱃지 표시',
      '누적 고도 표시',
    ],
  },
  {
    version: '1.7.0',
    date: '2026-05-02',
    features: [
      '크루원 스트릭 보기 — 멤버 이름 클릭 시 해당 멤버의 스트릭 캘린더 조회',
    ],
  },
  {
    version: '1.6.0',
    date: '2026-05-02',
    features: [
      '크루 설정 — 이름·목표 기간 변경 (생성자 전용)',
      '크루 멤버 강퇴 기능 (생성자 전용)',
    ],
  },
  {
    version: '1.5.0',
    date: '2026-04-27',
    features: [
      '설정 화면에 PWA 설치 안내 추가 (브라우저 접속 시만 표시)',
      '알림 문구 개선 — 크루명 포함, 목표 달성 시 기간 표시',
      '목표 달성 알림 버그 수정',
    ],
  },
  {
    version: '1.4.2',
    date: '2026-04-27',
    features: ['iOS PWA 알림 토글 수정'],
  },
  {
    version: '1.4.0',
    date: '2026-04-26',
    features: ['푸시 알림 (런 기록, 목표 달성, 어제 기록 없음)', '알림 on/off 설정'],
  },
  {
    version: '1.3.0',
    date: '2026-04-24',
    features: ['계정 삭제 기능', 'PWA 홈 화면 추가 지원'],
  },
  {
    version: '1.2.0',
    date: '2026-04-21',
    features: ['iOS Shortcuts 연동', 'API 토큰 발급/관리'],
  },
  {
    version: '1.1.0',
    date: '2026-04-15',
    features: ['크루 & 리더보드', '친구 초대 링크'],
  },
  {
    version: '1.0.0',
    date: '2026-04-10',
    features: ['스트릭 캘린더', '러닝 기록 입력', 'GPX 경로 지도'],
  },
]
