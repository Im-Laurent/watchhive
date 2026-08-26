import { useMemo } from 'react';
import { useVideos } from '../hooks/useVideos';

/** 측정 결과 화면에 관련 영상 1개를 추천한다. videos 목록이 바뀌지 않는 한 같은 영상을 유지한다. */
export default function RecommendedVideo() {
  const { videos } = useVideos();
  const video = useMemo(() => {
    if (videos.length === 0) return null;
    return videos[Math.floor(Math.random() * videos.length)];
  }, [videos]);

  if (!video) return null;

  return (
    <div className="mt-6 text-left">
      <p className="text-xs text-gray-400 mb-2">함께 보면 좋은 영상</p>
      {/* Videos 페이지 카드와 같은 형태: 전체 폭 16:9 썸네일 아래에 제목을 둔다. */}
      <a
        href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group block bg-gray-50 hover:bg-gray-100 rounded-xl overflow-hidden transition"
      >
        <div className="relative w-full aspect-video bg-gray-200">
          <img
            src={`https://i.ytimg.com/vi/${video.youtubeId}/maxresdefault.jpg`}
            alt={video.title}
            loading="lazy"
            onError={(e) => {
              // maxres(1280x720)가 없는 영상은 hq → mq 순으로 폴백 (Videos.tsx와 동일)
              const img = e.currentTarget;
              if (img.src.includes('maxresdefault')) {
                img.src = `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
              } else if (img.src.includes('hqdefault')) {
                img.src = `https://i.ytimg.com/vi/${video.youtubeId}/mqdefault.jpg`;
              }
            }}
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          </div>
        </div>
        <div className="p-3">
          {video.category && <p className="text-blue-600 text-[11px] font-semibold uppercase mb-0.5">{video.category}</p>}
          <p className="text-sm font-semibold text-gray-800 line-clamp-2">{video.title}</p>
        </div>
      </a>
    </div>
  );
}
