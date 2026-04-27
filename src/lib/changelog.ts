export interface ChangelogEntry {
  version: string
  date: string
  features: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
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
