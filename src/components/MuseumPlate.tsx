import type { MuseumPiece } from '../data/types';

/**
 * 미술관 벽 라벨. 영문·국문 두 벌을 관례대로 쌓고, 그 아래 시계 해설과 AI 합성 표기를 붙인다.
 *
 * 문구는 여기서 만들지 않는다 — 명화 프로젝트의 artworks.json + watches.json 에서
 * 조립돼 museum.json 으로 실려 온다. 작가 이름을 한 군데만 고치면 모든 명제표가 따라 바뀐다.
 */
export default function MuseumPlate({ piece }: { piece: MuseumPiece }) {
  const { en, ko } = piece;
  return (
    <aside className="wh-mu__plate">
      <div className="wh-mu__en">
        <div className="wh-mu__artist">{en.artist}</div>
        <div className="wh-mu__meta">{en.meta}</div>
        <div className="wh-mu__wtitle">{en.title}</div>
        <div className="wh-mu__medium">{en.medium}</div>
        <div className="wh-mu__fitted">{en.watch}</div>
      </div>
      <div className="wh-mu__rule" />
      <div className="wh-mu__ko">
        <div className="a">{ko.artist}</div>
        <div className="d">{ko.meta}</div>
        <div>{ko.title}</div>
        <div className="d">{ko.medium}</div>
        <div className="w">{ko.watch}</div>
      </div>
      <div className="wh-mu__spec">{piece.spec}</div>
      <div className="wh-mu__credit">{piece.credit}</div>
    </aside>
  );
}
