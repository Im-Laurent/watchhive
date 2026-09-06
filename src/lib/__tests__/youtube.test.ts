import { describe, expect, it } from 'vitest';
import { nextThumbnailUrl, thumbnailUrl } from '../youtube';

const ID = 'vLLYrPZsUH4';

describe('thumbnailUrl', () => {
  it('영상 id 와 화질로 주소를 만든다', () => {
    expect(thumbnailUrl(ID, 'maxresdefault')).toBe(`https://i.ytimg.com/vi/${ID}/maxresdefault.jpg`);
  });
});

describe('nextThumbnailUrl', () => {
  it('maxres 가 없으면 hq 로 내려간다', () => {
    expect(nextThumbnailUrl(ID, thumbnailUrl(ID, 'maxresdefault'))).toBe(thumbnailUrl(ID, 'hqdefault'));
  });

  it('hq 도 없으면 mq 로 내려간다', () => {
    expect(nextThumbnailUrl(ID, thumbnailUrl(ID, 'hqdefault'))).toBe(thumbnailUrl(ID, 'mqdefault'));
  });

  it('mq 까지 실패하면 더 내려가지 않는다 — 무한 재시도를 막는다', () => {
    expect(nextThumbnailUrl(ID, thumbnailUrl(ID, 'mqdefault'))).toBeNull();
  });

  it('사슬에 없는 주소면 null', () => {
    expect(nextThumbnailUrl(ID, 'https://example.com/other.jpg')).toBeNull();
  });

  it('폴백은 언제나 그 영상의 주소를 가리킨다', () => {
    const next = nextThumbnailUrl(ID, thumbnailUrl(ID, 'maxresdefault'));
    expect(next).toContain(ID);
  });
});
