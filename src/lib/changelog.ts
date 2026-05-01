export interface ChangelogEntry {
  version: string
  date: string
  features: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
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
