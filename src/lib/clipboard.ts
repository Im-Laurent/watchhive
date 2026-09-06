/**
 * 클립보드 복사 한 벌. useClipboard 와 useShare 가 같은 코드를 따로 들고 있었다.
 *
 * navigator.clipboard 대신 textarea + execCommand 를 쓴다 — 비동기 클립보드 API 는 보안
 * 컨텍스트와 권한 조건이 브라우저마다 갈려서, 카카오톡·인스타 인앱 브라우저에서 조용히
 * 실패하는 경우가 있었다. execCommand 는 표준에서 폐기됐지만 아직 모든 브라우저가 지원한다.
 */
export function copyText(text: string): boolean {
  const tempInput = document.createElement('textarea');
  tempInput.value = text;
  document.body.appendChild(tempInput);
  try {
    tempInput.select();
    // 명시적으로 false 를 받았을 때만 실패로 본다. 예전 코드는 반환값을 아예 보지 않고 늘
    // 성공으로 처리했는데, 규격에 없는 값을 주는 인앱 브라우저에서 멀쩡한 복사를 실패라고
    // 말하는 쪽이 더 나쁘다 — 확실한 실패만 실패로 넘긴다.
    return document.execCommand('copy') !== false;
  } catch {
    return false;
  } finally {
    // finally 로 빼기 전에는 execCommand 가 던지면 이 textarea 가 문서에 그대로 남았다.
    // 복사가 막힌 환경(권한 거부·인앱 브라우저)에서는 누를 때마다 하나씩 쌓였다.
    tempInput.remove();
  }
}
