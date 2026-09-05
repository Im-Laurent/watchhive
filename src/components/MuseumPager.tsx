import type { MuseumShot } from '../data/types';

type Props = {
  shots: MuseumShot[];
  index: number;
  /** 절대 위치. 범위 넘김은 호출한 쪽에서 감싼다. */
  onGo: (i: number) => void;
};

/**
 * 넘김 UI 한 벌: ‹ ● ● ● ›. 사진 바로 아래에 놓고, 액자 자리와 확대 화면에서 같은 것을 쓴다.
 * 터치 기기에서는 화살표가 CSS 로 숨고 좌우 스와이프가 그 자리를 대신한다.
 * 사진이 한 장뿐이면 통째로 그리지 않는다.
 */
export default function MuseumPager({ shots, index, onGo }: Props) {
  if (shots.length < 2) return null;
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <div className="wh-mu__pager">
      <button
        type="button"
        className="wh-mu__arrow"
        aria-label="이전 사진"
        onClick={(e) => { stop(e); onGo(index - 1); }}
      >
        &#8249;
      </button>
      <div className="wh-mu__dots">
        {shots.map((s, i) => (
          <button
            key={s.kind}
            type="button"
            className="wh-mu__dot"
            title={s.label}
            aria-label={s.label}
            aria-current={i === index}
            onClick={(e) => { stop(e); onGo(i); }}
          />
        ))}
      </div>
      <button
        type="button"
        className="wh-mu__arrow"
        aria-label="다음 사진"
        onClick={(e) => { stop(e); onGo(index + 1); }}
      >
        &#8250;
      </button>
    </div>
  );
}
