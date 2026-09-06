import { BEST_THUMBNAIL_QUALITY, nextThumbnailUrl, thumbnailUrl } from '../lib/youtube';

type Props = {
  youtubeId: string;
  alt: string;
  className?: string;
};

/**
 * 유튜브 썸네일 한 장. Videos 목록과 결과 화면의 추천 영상이 같은 폴백 사슬을 따로 갖고 있었다.
 * 주소 규칙은 lib/youtube.ts 에 있다.
 */
export default function YouTubeThumbnail({ youtubeId, alt, className }: Props) {
  return (
    <img
      src={thumbnailUrl(youtubeId, BEST_THUMBNAIL_QUALITY)}
      alt={alt}
      loading="lazy"
      onError={(e) => {
        const img = e.currentTarget;
        const next = nextThumbnailUrl(youtubeId, img.src);
        if (next) img.src = next;
      }}
      className={className}
    />
  );
}
