// 오디오 스레드에서는 원시 PCM 샘플을 고정 크기 블록으로 모아 메인 스레드로 전달하기만 한다.
// tick(임펄스) 검출 자체는 메인 스레드에서 aubio(성숙한 오픈소스 오디오 분석 라이브러리, WASM)의
// onset detector가 담당한다 — 이전에 이 파일에서 직접 구현했던 임계값/히스테리시스 기반 검출은
// 실제 시계 소리(하나의 tick 안에 여러 서브 임펄스가 있는 경우 등)에서 이중 검출 문제를 완전히
// 해결하지 못해, 검증된 라이브러리로 교체했다.

const BLOCK_SIZE = 512; // aubio Onset의 hopSize와 맞춘다

class TickRelayProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Float32Array(BLOCK_SIZE);
    this._bufferIndex = 0;
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) return true;

    for (let i = 0; i < channel.length; i++) {
      this._buffer[this._bufferIndex++] = channel[i];
      if (this._bufferIndex >= BLOCK_SIZE) {
        // aubio.do()로 넘길 때 zero-offset 복사본이 필요해 여기서 미리 복사해 보낸다.
        this.port.postMessage({ type: 'block', samples: this._buffer.slice(0) });
        this._bufferIndex = 0;
      }
    }
    return true;
  }
}

registerProcessor('tick-processor', TickRelayProcessor);
