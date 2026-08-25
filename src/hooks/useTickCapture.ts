import { useCallback, useEffect, useRef, useState } from 'react';
import { createOnsetDetector, type OnsetDetector } from '../lib/timegrapher/onsetDetector';

export type CaptureStatus = 'idle' | 'requesting' | 'active' | 'error';

type WorkletMessage = { type: 'block'; samples: Float32Array };

const PEAKS_BUFFER_SIZE = 4000;

/** getUserMedia가 던지는 DOMException 이름을 사용자가 뭘 해야 하는지 알 수 있는 문구로 바꾼다. */
function describeCaptureError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      // 자물쇠 아이콘 같은 데스크톱 전용 안내는 피한다 — 실제 사용자 대부분이 모바일이다.
      return '마이크 권한이 거부됐어요. 브라우저 설정에서 이 사이트의 마이크 권한을 허용한 뒤 다시 시도해 주세요.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return '사용할 수 있는 마이크를 찾지 못했어요. 마이크가 연결돼 있는지 확인해 주세요.';
    case 'NotReadableError':
      return '다른 앱이 마이크를 쓰고 있어요. 통화나 녹음 앱을 종료한 뒤 다시 시도해 주세요.';
    default:
      return err instanceof Error && err.message
        ? `마이크를 열지 못했어요: ${err.message}`
        : '마이크를 열지 못했어요.';
  }
}

/**
 * 마이크 → AudioContext → AudioWorkletNode(tick-processor.js) 파이프라인을 연결한다.
 * 워클릿은 원시 오디오를 고정 크기 블록으로 모아 전달하기만 하고, tick(임펄스) 검출은
 * aubio(onsetDetector.ts)가 메인 스레드에서 담당한다. tick 피크 타임스탬프(BPH/Rate 등
 * 분석·시각화용)는 리렌더를 피하려고 ref 배열에 누적한다.
 */
export function useTickCapture() {
  const [status, setStatus] = useState<CaptureStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const peaksRef = useRef<number[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const onsetDetectorRef = useRef<OnsetDetector | null>(null);

  // 오디오 리소스만 정리하고 status는 건드리지 않는다. 정리 후 가야 할 상태가 호출 지점마다 다르기
  // 때문 — 정상 정지는 'idle', 권한 실패는 'error', 언마운트 시엔 상태 자체가 의미 없다.
  const releaseResources = useCallback(() => {
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    silentGainRef.current?.disconnect();
    silentGainRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      void audioContextRef.current.close();
    }
    audioContextRef.current = null;
    onsetDetectorRef.current = null;
  }, []);

  const stop = useCallback(() => {
    releaseResources();
    setStatus('idle');
  }, [releaseResources]);

  // 측정 중에 다른 페이지로 이동하면 컴포넌트만 사라지고 마이크 스트림과 AudioContext는 살아남아
  // 브라우저의 녹음 표시가 계속 켜져 있게 된다. 언마운트 시 반드시 리소스를 놓아준다.
  useEffect(() => releaseResources, [releaseResources]);

  const start = useCallback(async () => {
    setError(null);
    setStatus('requesting');
    // stop()에서 지우지 않고 여기서 지운다: 측정이 끝난 뒤에도 마지막으로 그려진 곡선이 화면에 남아있어야
    // 하는데(바이브로그래프의 requestAnimationFrame 루프는 React 렌더 사이클과 무관하게 계속 돌다가
    // 다음 렌더에서 effect cleanup으로 멈추므로), stop()에서 peaksRef를 비우면 그 사이 프레임이 빈
    // 배열로 한 번 더 그려져 "측정 완료" 화면의 곡선이 사라지는 버그가 있었다.
    peaksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const [, onsetDetector] = await Promise.all([
        audioContext.audioWorklet.addModule(`${import.meta.env.BASE_URL}worklets/tick-processor.js`),
        createOnsetDetector(audioContext.sampleRate),
      ]);
      onsetDetectorRef.current = onsetDetector;

      const source = audioContext.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContext, 'tick-processor');
      workletNode.port.onmessage = (event: MessageEvent<WorkletMessage>) => {
        const { samples } = event.data;

        const peakTime = onsetDetectorRef.current?.processBlock(samples);
        if (peakTime != null) {
          const peaksBuffer = peaksRef.current;
          peaksBuffer.push(peakTime);
          if (peaksBuffer.length > PEAKS_BUFFER_SIZE) peaksBuffer.shift();
        }
      };
      source.connect(workletNode);

      // AudioWorkletNode가 destination까지 이어지지 않으면 브라우저가 그래프를 렌더링(pull)하지 않아
      // process()가 호출되지 않는다 — gain 0짜리 노드를 거쳐 무음으로 destination에 연결해 강제로 처리시킨다.
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      workletNode.connect(silentGain);
      silentGain.connect(audioContext.destination);
      silentGainRef.current = silentGain;

      workletNodeRef.current = workletNode;

      setStatus('active');
    } catch (err) {
      // stop()을 쓰면 그 안의 setStatus('idle')이 아래 setStatus('error')와 같은 배치에서
      // 덮어써 버려, 권한 거부 시 아무 안내도 안 뜨고 시작 화면으로 돌아가 버렸다.
      releaseResources();
      setError(describeCaptureError(err));
      setStatus('error');
    }
  }, [releaseResources]);

  return { status, error, peaksRef, start, stop };
}
