import { useState, useCallback } from 'react';

export function useClipboard() {
  const [copyMessage, setCopyMessage] = useState('');

  const copyToClipboard = useCallback(
    (text: string, successMsg = '클립보드에 복사되었습니다!') => {
      try {
        const tempInput = document.createElement('textarea');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        setCopyMessage(successMsg);
      } catch {
        setCopyMessage('복사에 실패했습니다.');
      }
      setTimeout(() => setCopyMessage(''), 3000);
    },
    []
  );

  return { copyToClipboard, copyMessage };
}
