import PageHead from '../components/PageHead';
import { useVideos } from '../hooks/useVideos';

export default function Videos() {
  const { videos } = useVideos();

  return (
    <>
      <PageHead
        title="Videos"
        description="빈시멍 유튜브 채널의 최신 영상. 빈티지 시계 리뷰와 시계 헌팅 영상 모음."
        path="/videos"
      />
      <main className="container mx-auto mt-8 px-6 md:px-12 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center mt-4 md:mt-8">Videos</h1>
        <section>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Latest Videos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video) => (
              <div key={video.youtubeId} className="bg-white rounded-lg shadow-md overflow-hidden">
                <a href={`https://www.youtube.com/watch?v=${video.youtubeId}`} target="_blank" rel="noopener noreferrer" className="group">
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <img
                      src={video.thumbnail || `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                      alt={video.title}
                      loading="lazy"
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
      </main>
    </>
  );
}
