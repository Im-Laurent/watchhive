/**
 * 페이지 상단 명판. 소장 시계 사진 위에 딤을 깔고 제목과 한 줄 부제만 얹는다.
 *
 * 사진은 public/images 에 {imgBase}-{폭}.webp 와 .jpg 를 한 벌씩 두고,
 * 브라우저가 화면 폭×배율에 맞는 판을 골라 받는다 (명판이 전체 폭이므로 sizes=100vw).
 * 전부 2.4:1 로 미리 잘라 둔 것들이다 — 명판은 화면 폭을 꽉 채우고 높이는 250~360px 라
 * 원본 16:9 를 그대로 넣으면 PC 에서 위아래 대부분을 버리면서 가로 해상도만 모자라게 된다.
 */
const DEFAULT_WIDTHS = [800, 1400, 2000, 2800];

type Props = {
  title: string;
  /** PC 에서 한 줄로 떨어지는 길이를 유지할 것 */
  subtitle: string;
  imgBase: string;
  alt: string;
  /** 준비된 파일 폭. 원본 해상도가 낮으면 확대 없이 만들 수 있는 만큼만 넘긴다. */
  widths?: number[];
};

export default function PageHero({ title, subtitle, imgBase, alt, widths = DEFAULT_WIDTHS }: Props) {
  const set = (ext: string) => widths.map((w) => `/images/${imgBase}-${w}.${ext} ${w}w`).join(', ');
  const fallback = widths[Math.min(1, widths.length - 1)];

  return (
    <section className="wh-hero">
      <picture>
        <source type="image/webp" srcSet={set('webp')} sizes="100vw" />
        <img
          className="wh-hero__img"
          src={`/images/${imgBase}-${fallback}.jpg`}
          srcSet={set('jpg')}
          sizes="100vw"
          alt={alt}
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <div className="wh-hero__scrim" />
      <div className="absolute inset-x-0 bottom-0 px-6 md:px-12 pb-5 md:pb-8">
        <h1
          className="text-[36px] sm:text-[44px] lg:text-[60px] font-bold leading-[0.95] text-[#f7f3ec] mb-2"
          style={{ textShadow: '0 2px 18px rgba(16,14,12,.5)' }}
        >
          {title}
        </h1>
        <p className="text-[13px] lg:text-[15px] text-[#d8d1c5]">{subtitle}</p>
      </div>
    </section>
  );
}
