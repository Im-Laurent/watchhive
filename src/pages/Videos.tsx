import PageHead from '../components/PageHead';
import { useVideos } from '../hooks/useVideos';
import { useShare } from '../hooks/useShare';
import PageHero from '../components/PageHero';
import { PAGE_META } from '../data/pageMeta';

export default function Videos() {
  const { videos } = useVideos();
  const { handleShare, shareMessage } = useShare();

  return (
    <>
      <PageHead {...PAGE_META.videos} />
      <PageHero
        title="Videos"
        subtitle="빈티지 시계 리뷰와 시계 헌팅 영상"
        imgBase="videos_hero"
        alt="베이지색 바탕에 나란히 놓인 가죽 시계 스트랩 여러 개"
      />
      <main className="container mx-auto mt-8 px-6 md:px-12 py-8">
        <section>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Latest Videos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video) => (
              <div key={video.youtubeId} className="bg-white rounded-lg shadow-md overflow-hidden">
                <a href={`https://www.youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noopener noreferrer" className="group">
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <img
                      src={`https://i.ytimg.com/vi/${video.youtubeId}/maxresdefault.jpg`}
                      alt={video.title}
                      loading="lazy"
                      onError={(e) => {
                        // maxres(1280x720)가 없는 영상은 hq → mq 순으로 폴백
                        const img = e.currentTarget;
                        if (img.src.includes('maxresdefault')) {
                          img.src = `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
                        } else if (img.src.includes('hqdefault')) {
                          img.src = `https://i.ytimg.com/vi/${video.youtubeId}/mqdefault.jpg`;
                        }
                      }}
                      className="absolute top-0 left-0 w-full h-full object-cover rounded-t-lg"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    </div>
                  </div>
                </a>
                <div className="p-4">
                  {video.category && <p className="text-blue-600 text-xs font-semibold uppercase mb-1">{video.category}</p>}
                  <h4 className="text-xl font-semibold text-gray-800 mb-2">{video.title}</h4>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{video.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="p-8 text-center mt-4">
          <p className="text-gray-700 text-lg mb-6">구독과 공유는 콘텐츠 제작에 큰 힘이 됩니다.</p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 mb-6">
            <a href="https://www.youtube.com/@seemoung?sub_confirmation=1" target="_blank" rel="noreferrer" className="bg-gray-800 hover:bg-gray-700 text-gray-100 font-bold py-3 px-6 rounded-full shadow-md transition duration-300 ease-in-out text-base sm:text-lg w-full sm:w-auto">YouTube 채널 구독하기</a>
            <button onClick={() => handleShare()} className="bg-gray-800 hover:bg-gray-700 text-gray-100 font-bold py-3 px-6 rounded-full shadow-md transition duration-300 ease-in-out text-base sm:text-lg w-full sm:w-auto">다른 시계 덕후에게 공유하기</button>
          </div>
          {shareMessage && <div className="mt-4 text-blue-600 text-sm">{shareMessage}</div>}
        </section>
      </main>
    </>
  );
}
