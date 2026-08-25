import type { Aubio } from 'aubiojs';
// @ts-expect-error - 벤더링된 순수 JS 파일이라 타입 선언이 없다(자세한 이유는 aubio-vendor.js 상단 주석 참고).
// npm 패키지 aubiojs의 타입(Aubio)을 아래에서 그대로 재사용한다.
import aubioFactory from './aubio-vendor.js';

const aubio: () => Promise<Aubio> = aubioFactory;

const HOP_SIZE = 512; // 워클릿의 BLOCK_SIZE와 일치해야 한다
const BUFFER_SIZE = 1024; // aubio onset의 FFT 윈도우 크기 (관례적으로 hopSize의 2배)
const MIN_INTER_ONSET_MS = 40; // 가장 빠른 표준 BPH(43200 ≈ tick 간격 83ms)보다 확실히 짧게

// 폰 내장 마이크로 잡은 시계 tick은 원본 샘플 기준 진폭이 매우 작아(약 0.001~0.003) aubio의
// 기본 onset 감도로는 거의 검출되지 않는다(합성 신호로 확인: 무증폭 시 48개 중 0~1개만 검출).
// 그렇다고 고정 배율로 증폭하면, 오토매틱 무브먼트처럼 로터 소리 등으로 원래 더 시끄러운 시계는
// 신호가 ±1을 넘어 클리핑(찌그러짐)돼 오히려 검출이 나빠진다 — 실측으로 확인된 문제.
// 그래서 최근 피크 진폭을 추적해 목표 진폭에 맞춰 매번 증폭량을 다시 계산하는 AGC를 쓴다.
const TARGET_PEAK = 0.5;
const MIN_GAIN = 1;
const MAX_GAIN = 250;
// 피크 추정치가 블록(~11.6ms)마다 이 비율로 서서히 감쇠한다 — tick 사이의 무음 구간(가장 빠른
// 표준 BPH 기준으로도 80ms 이상)보다 훨씬 느리게 감쇠해야, 매 tick마다 이득이 출렁여 다음 tick을
// 과증폭(클리핑)하는 "AGC 펌핑" 현상 없이 방금 들린 tick 크기를 기준으로 안정적으로 유지된다.
const PEAK_DECAY_PER_BLOCK = 0.995;

let aubioModulePromise: ReturnType<typeof aubio> | null = null;
function loadAubio() {
  if (!aubioModulePromise) {
    aubioModulePromise = aubio();
  }
  return aubioModulePromise;
}

export type OnsetDetector = {
  /** 원시 PCM 블록(HOP_SIZE 길이)을 넣으면, tick으로 검출됐을 때 그 시각(초, 내부 클록 기준)을 반환한다. */
  processBlock: (samples: Float32Array) => number | null;
};

/**
 * tick(임펄스) 검출을 aubio(https://github.com/aubio/aubio)의 onset detector에 맡긴다.
 * 우리가 직접 만든 임계값/히스테리시스 방식은 실제 시계 소리에서 반복적으로 이중 검출 문제를
 * 일으켰는데, aubio는 스펙트럼 도메인 특징 + 최소 재검출 간격(minioi)까지 갖춘 검증된 라이브러리라
 * 훨씬 안정적이다. 반환하는 시각은 이 인스턴스만의 내부 클록 기준이라 절대 시간과는 안 맞지만,
 * BPH/Rate/Beat Error는 전부 tick 간의 "간격"만 보므로 문제되지 않는다.
 */
export async function createOnsetDetector(sampleRate: number): Promise<OnsetDetector> {
  const { Onset } = await loadAubio();
  // 참고: aubiojs 0.2.1의 타입 선언은 Onset 생성자를 (bufferSize, hopSize, sampleRate) 3개
  // 인자로 명시하지만, 실제 컴파일된 바인딩은 Pitch와 마찬가지로 method가 맨 앞에 와야 하는
  // 4개 인자를 요구한다(업스트림 타입 선언 버그) — 그래서 타입을 우회해 호출한다.
  const OnsetCtor = Onset as unknown as new (method: string, bufferSize: number, hopSize: number, sampleRate: number) => InstanceType<typeof Onset>;
  const onset = new OnsetCtor('default', BUFFER_SIZE, HOP_SIZE, sampleRate);
  // 참고: 타입 선언은 `setMinioiMs`로 나오지만 실제 컴파일된 바인딩에는 끝에 공백이 붙은
  // `'setMinioiMs '`로 등록돼 있다(업스트림 빌드 버그) — 그래서 대괄호로 접근한다.
  (onset as unknown as Record<string, (ms: number) => number>)['setMinioiMs '](MIN_INTER_ONSET_MS);

  const gained = new Float32Array(HOP_SIZE);
  let peakEstimate = 0.002; // 초기값 — 너무 0에 가까우면 첫 블록에서 이득이 튐

  return {
    processBlock(samples: Float32Array): number | null {
      let blockPeak = 0;
      for (let i = 0; i < samples.length; i++) {
        const abs = Math.abs(samples[i]);
        if (abs > blockPeak) blockPeak = abs;
      }
      peakEstimate = Math.max(blockPeak, peakEstimate * PEAK_DECAY_PER_BLOCK);
      const gain = Math.max(MIN_GAIN, Math.min(MAX_GAIN, TARGET_PEAK / peakEstimate));

      for (let i = 0; i < samples.length; i++) {
        gained[i] = Math.max(-1, Math.min(1, samples[i] * gain));
      }
      const detected = onset.do(gained);
      if (!detected) return null;
      return onset.getLastS();
    },
  };
}
