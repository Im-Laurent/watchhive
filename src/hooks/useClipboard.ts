import { useCallback, useEffect, useRef, useState } from 'react';
import { copyText } from '../lib/clipboard';

/** 안내 문구가 화면에 머무는 시간 */
const MESSAGE_TIMEOUT_MS = 3000;

export function useClipboard() {
  const [copyMessage, setCopyMessage] = useState('');
  const timeoutRef = useRef<number | undefined>(undefined);

  // 문구를 지우는 타이머가 언마운트 뒤에 돌면 사라진 컴포넌트에 setState 하게 된다.
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const copyToClipboard = useCallback(
    (text: string, successMsg = '클립보드에 복사되었습니다!') => {
      setCopyMessage(copyText(text) ? successMsg : '복사에 실패했습니다.');
      clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setCopyMessage(''), MESSAGE_TIMEOUT_MS);
    },
    []
  );

  return { copyToClipboard, copyMessage };
}
