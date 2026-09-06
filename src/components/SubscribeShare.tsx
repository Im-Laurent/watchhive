import { useShare } from '../hooks/useShare';

const CHANNEL_SUBSCRIBE_URL = 'https://www.youtube.com/@seemoung?sub_confirmation=1';

const BUTTON =
  'bg-gray-800 hover:bg-gray-700 text-gray-100 font-bold py-3 px-6 rounded-full shadow-md transition duration-300 ease-in-out text-base sm:text-lg w-full sm:w-auto';

type Props = {
  /** useShare 에 넘길 공유 제목 — 페이지마다 다르다. 없으면 사이트 기본값. */
  shareTitle?: string;
  shareText?: string;
  /** 바깥 section 에 덧붙일 클래스 (Museum 은 container 가 필요하다). */
  className?: string;
};

/**
 * 페이지 맨 아래 구독·공유 맺음 섹션.
 *
 * Videos · Timegrapher · Year Finder · Fit Finder · Museum 다섯 곳에 같은 마크업이 복사돼
 * 있었고, 그 사이 Fit Finder 만 버튼 클래스가 뒤처져 모바일에서 홀로 폭이 달랐다. 한 벌로 모아
 * 다수 쪽(전체 폭) 모양으로 맞춘다. 홈은 아이콘이 들어간 다른 디자인이라 여기 포함하지 않는다.
 */
export default function SubscribeShare({ shareTitle, shareText, className = '' }: Props) {
  const { handleShare, shareMessage } = useShare(shareTitle, shareText);

  return (
    <section className={`p-8 text-center ${className}`}>
      <p className="text-gray-700 text-lg mb-6">구독과 공유는 콘텐츠 제작에 큰 힘이 됩니다.</p>
      <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 mb-6">
        <a href={CHANNEL_SUBSCRIBE_URL} target="_blank" rel="noreferrer" className={BUTTON}>
          YouTube 채널 구독하기
        </a>
        <button onClick={() => handleShare()} className={BUTTON}>
          다른 시계 덕후에게 공유하기
        </button>
      </div>
      {shareMessage && <div className="mt-4 text-blue-600 text-sm">{shareMessage}</div>}
    </section>
  );
}
