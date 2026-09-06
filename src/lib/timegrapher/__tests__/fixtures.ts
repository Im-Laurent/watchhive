/**
 * 합성 tick 열. 실제 녹음 대신 "정답을 아는" 신호를 만들어 계산이 그 값을 되찾는지 본다.
 */

export type TickOptions = {
  bph: number;
  seconds: number;
  /** 하루 오차(초). 양수면 빨리 간다 = 실제 비트 간격이 이론보다 짧다. */
  secondsPerDay?: number;
  /** 짝/홀 비트 간격의 차이(ms). 밸런스가 한쪽으로 치우친 상태. */
  beatErrorMs?: number;
  /** 첫 tick 의 시각 — 내부 클록 기준이라 0 이 아닐 수 있다. */
  startAt?: number;
  /** 각 tick 을 무작위로 흔드는 폭(ms, ±). 주변 소음이 섞인 상황. */
  jitterMs?: number;
  /** 흔들림의 씨앗. 같은 씨앗이면 항상 같은 신호가 나온다. */
  seed?: number;
};

/** 재현 가능한 의사난수(LCG). 테스트가 실행마다 흔들리면 안 된다. */
function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

const SECONDS_PER_DAY = 86400;

export function makeTicks({
  bph,
  seconds,
  secondsPerDay = 0,
  beatErrorMs = 0,
  startAt = 0,
  jitterMs = 0,
  seed = 1,
}: TickOptions): number[] {
  const random = lcg(seed);
  const theoretical = 3600 / bph;
  const actual = theoretical * (1 - secondsPerDay / SECONDS_PER_DAY);
  const half = (beatErrorMs / 1000) / 2;

  const ticks: number[] = [];
  let t = startAt;
  for (let i = 0; t - startAt <= seconds; i++) {
    ticks.push(t);
    // 짝/홀 간격을 beatErrorMs 만큼 벌린다. 평균 간격은 actual 그대로다.
    t += i % 2 === 0 ? actual + half : actual - half;
  }
  if (jitterMs === 0) return ticks;
  // 흔들림은 tick 시각에만 얹는다 — 검출 시각이 흔들릴 뿐 무브먼트가 달라진 건 아니다.
  return ticks.map((t) => t + ((random() * 2 - 1) * jitterMs) / 1000).sort((a, b) => a - b);
}

/** 지정한 자리의 tick 을 지운다 — 검출기가 놓친 상황. */
export function dropAt(ticks: number[], indices: number[]): number[] {
  const drop = new Set(indices);
  return ticks.filter((_, i) => !drop.has(i));
}

/** 지정한 시각에 없는 tick 을 끼워 넣는다 — 소음을 tick 으로 오검출한 상황. */
export function insertAt(ticks: number[], times: number[]): number[] {
  return [...ticks, ...times].sort((a, b) => a - b);
}
