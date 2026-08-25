import PageHead from '../components/PageHead';
import PageHero from '../components/PageHero';
import TimegrapherTool from '../components/TimegrapherTool';

export default function Timegrapher() {
  return (
    <>
      <PageHead
        title="Timegrapher"
        description="시계를 마이크에 가까이 대고 소리를 들려주면 BPH, Rate, Beat Error를 측정해주는 무료 온라인 타임그래퍼."
        path="/timegrapher"
      />
      {/* 원본이 2704px이라 기본 폭 목록의 2800은 확대가 되므로, 확대 없이 만들 수 있는 폭만 넘긴다. */}
      <PageHero
        title="Timegrapher"
        subtitle="시계 소리만으로 하루 오차와 비트 오차를 측정해 보세요"
        imgBase="timegrapher_hero"
        alt="타임그래퍼 스탠드에 물려 있는 금장 빈티지 론진 시계"
        widths={[800, 1400, 2000, 2704]}
      />
      <main className="container mx-auto mt-8 px-6 md:px-12 py-8 max-w-3xl">
        <TimegrapherTool />
      </main>
    </>
  );
}
