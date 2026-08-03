import { useState, useCallback } from 'react';

type ShareData = { title?: string; text?: string; url?: string };

export function useShare(
  defaultTitle = 'Watch HIVE',
  defaultText = '빈티지 시계 애호가들을 위한 공간'
) {
  const [shareMessage, setShareMessage] = useState('');

  const handleShare = useCallback(
    async (customData: ShareData = {}) => {
      const shareData = {
        title: customData.title || defaultTitle,
        text: customData.text || defaultText,
        url: customData.url || window.location.href,
      };
      let copied = false;
      try {
        const tempInput = document.createElement('textarea');
        tempInput.value = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        setShareMessage('링크가 클립보드에 복사되었습니다!');
        copied = true;
      } catch {
        setShareMessage('클립보드 복사에 실패했습니다.');
      }
      if (navigator.share) {
        try {
          await navigator.share(shareData);
          setShareMessage('성공적으로 공유되었습니다!');
        } catch {
          if (!copied) setShareMessage('공유에 실패했습니다.');
        }
      }
      setTimeout(() => setShareMessage(''), 3000);
    },
    [defaultTitle, defaultText]
  );

  return { handleShare, shareMessage };
}
