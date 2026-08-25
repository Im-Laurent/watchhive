/**
 * 측정값을 "이 정도면 괜찮은 건가?"로 해석해주는 정적 기준 데이터.
 *
 * Amplitude(진폭)는 폰 내장 마이크로 3펄스를 안정적으로 분리하지 못해 스펙에서 빠졌으므로
 * Rate와 Beat Error만 다룬다. BPH는 품질 지표가 아니라 무브먼트의 사양이라 판정 대상이 아니다.
 */

export type Grade = 'excellent' | 'good' | 'caution';

export const GRADE_LABEL: Record<Grade, string> = {
  excellent: '우수',
  good: '양호',
  caution: '주의',
};

/**
 * 정비 기준(±10초/일 우수)과 빈티지에서 통용되는 관대한 기준(±20초/일까지는 실사용 무리 없음)을
 * 하나의 3단계 척도로 합친 것. 두 기준의 구체적인 근거는 REFERENCE_ROWS에서 나란히 보여준다.
 */
export function judgeRate(secondsPerDay: number): Grade {
  const magnitude = Math.abs(secondsPerDay);
  if (magnitude <= 10) return 'excellent';
  if (magnitude <= 20) return 'good';
  return 'caution';
}

export function judgeBeatError(ms: number): Grade {
  if (ms <= 0.5) return 'excellent';
  if (ms <= 1.0) return 'good';
  return 'caution';
}

export type ReferenceRow = {
  metric: string;
  /** 정비를 마친 시계에 적용하는 기준 */
  serviced: string;
  /** 빈티지에서 통용되는 관대한 기준 */
  vintage: string;
};

export const REFERENCE_ROWS: ReferenceRow[] = [
  {
    metric: 'Rate · 하루 오차',
    serviced: '±10초/일 이내면 우수. 크로노미터(COSC) 인증 기준은 -4 ~ +6초/일.',
    vintage: '±20초/일 이내로 꾸준하기만 하면 실사용에 무리 없음.',
  },
  {
    metric: 'Beat Error · 비트 오차',
    serviced: '0.5ms 이내면 우수, 1.0ms 이내면 실사용에 무리 없음.',
    vintage: '오래 써서 마모된 개체는 1~2ms로도 문제없이 쓰이는 경우가 흔함.',
  },
];

export const REFERENCE_DISCLAIMER =
  '두 기준 모두 공식 규격이 아니라 정비·수집 커뮤니티에서 통용되는 경험치예요.';

export const MEASUREMENT_CAVEAT =
  '폰 마이크는 정식 타임그래퍼의 접촉식 마이크보다 주변 소음에 약하고, 시계를 놓은 자세나 태엽이 감긴 정도에 따라서도 값이 달라져요. 이 결과는 한 번의 스냅샷으로만 참고해 주시고, 오버홀이 필요한지 같은 판단은 전문가 확인이 필요해요.';

export const LOW_CONFIDENCE_HINT =
  'tick 소리가 또렷하게 잡히지 않아 BPH 추정이 흔들렸어요. 조용한 곳에서 폰을 시계에 더 가까이 대고 다시 측정해 보세요.';
