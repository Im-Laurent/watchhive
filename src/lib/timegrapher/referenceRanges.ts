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

export type Disclaimer = { title: string; body: string };

export const DISCLAIMERS: Disclaimer[] = [
  {
    title: '기계식(오토매틱·수동) 시계만 측정할 수 있어요',
    body: '밸런스 휠이 좌우로 왕복하며 내는 규칙적인 똑딱 소리를 듣고 계산하는 방식입니다. 쿼츠(배터리) 시계는 초침이 1초에 한 번만 움직이고 소리의 성격도 달라서, 측정하더라도 의미 있는 값이 나오지 않아요.',
  },
  {
    title: '소리로만 재는 값이라 정확도에 한계가 있어요',
    body: '정식 타임그래퍼는 시계에 직접 닿는 접촉식 마이크로 측정하지만, 이 도구는 폰 마이크로 들은 소리만 씁니다. 주변 소음이나 폰을 댄 각도에 따라 값이 흔들릴 수 있으니 참고용으로만 봐주세요.',
  },
  {
    title: 'Amplitude(진폭)는 아직 제공하지 않아요',
    body: '진폭은 tick 하나 안에 들어 있는 세 개의 미세한 충격음 간격으로 역산하는데, 폰 내장 마이크로는 이 셋이 안정적으로 분리되지 않아 실측에서 값이 크게 흩어졌어요. 신뢰할 만한 수치가 나오기 전까지는 표시하지 않고 계속 연구하고 있습니다.',
  },
  {
    title: '한 번의 측정보다 여러 번의 흐름이 정확해요',
    body: '같은 시계라도 놓은 자세, 태엽이 감긴 정도, 측정한 시각에 따라 값이 달라집니다. 한 번의 결과를 단정적으로 받아들이기보다 여러 번 재보고 흐름을 보는 편이 좋아요.',
  },
  {
    title: '정비가 필요한지는 전문가 확인이 필요해요',
    body: '이 결과만으로 오버홀이나 부품 교체가 필요한지 판단할 수는 없습니다. 값이 계속 이상하다면 시계 수리 전문가에게 점검을 받아보세요.',
  },
];

export const LOW_CONFIDENCE_HINT =
  'tick 소리가 또렷하게 잡히지 않아 BPH 추정이 흔들렸어요. 조용한 곳에서 폰을 시계에 더 가까이 대고 다시 측정해 보세요.';
