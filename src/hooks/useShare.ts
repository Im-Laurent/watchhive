import { useCallback, useEffect, useRef, useState } from 'react';
import { copyText } from '../lib/clipboard';

type ShareData = { title?: string; text?: string; url?: string };

/** 안내 문구가 화면에 머무는 시간 */
const MESSAGE_TIMEOUT_MS = 3000;

/**
 * 링크를 클립보드에 복사하고, 네이티브 공유창을 쓸 수 있으면 그것도 함께 띄운다.
 *
 * 둘 다 하는 이유: navigator.share 는 모바일에만 있고 사용자가 취소할 수도 있어서, 복사를
 * 먼저 해 두면 어느 쪽이든 링크는 손에 남는다. 그래서 공유가 취소돼도 이미 복사에 성공했다면
 * 실패 문구로 덮지 않는다.
 */
export function useShare(
  defaultTitle = 'Watch HIVE',
  defaultText = '빈티지 시계 애호가들을 위한 공간'
) {
  const [shareMessage, setShareMessage] = useState('');
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const handleShare = useCallback(
    async (customData: ShareData = {}) => {
      const shareData = {
        title: customData.title || defaultTitle,
        text: customData.text || defaultText,
        url: customData.url || window.location.href,
      };

      const copied = copyText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      setShareMessage(copied ? '링크가 클립보드에 복사되었습니다!' : '클립보드 복사에 실패했습니다.');

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          setShareMessage('성공적으로 공유되었습니다!');
        } catch {
          if (!copied) setShareMessage('공유에 실패했습니다.');
        }
      }

      clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setShareMessage(''), MESSAGE_TIMEOUT_MS);
    },
    [defaultTitle, defaultText]
  );

  return { handleShare, shareMessage };
}
