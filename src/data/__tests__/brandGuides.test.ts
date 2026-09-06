import { describe, expect, it } from 'vitest';
import { BRAND_GUIDES } from '../brandGuides';

describe('BRAND_GUIDES', () => {
  it('시리얼 표를 가진 브랜드가 모두 들어 있다', () => {
    expect(Object.keys(BRAND_GUIDES).sort()).toEqual(
      ['IWC', 'Longines', 'Omega', 'Rolex', 'UniversalGenève'].sort()
    );
  });

  it('제목과 설명이 비어 있지 않다', () => {
    Object.values(BRAND_GUIDES).forEach((guide) => {
      expect(guide.title.trim()).not.toBe('');
      expect(guide.description.trim()).not.toBe('');
    });
  });

  it('설명은 "질문\n답변" 블록이 빈 줄로 갈린 형식이다 — 화면이 그렇게 파싱한다', () => {
    Object.values(BRAND_GUIDES).forEach((guide) => {
      guide.description.split('\n\n').forEach((block) => {
        const [question, ...rest] = block.split('\n');
        expect(question.trim()).not.toBe('');
        expect(rest.join('\n').trim()).not.toBe('');
      });
    });
  });

  it('바깥 호스트를 가리키는 주소가 없다 — 예전 imageUrl 이 전부 404 였다', () => {
    const serialized = JSON.stringify(BRAND_GUIDES);
    expect(serialized).not.toContain('http://');
    expect(serialized).not.toContain('https://');
  });
});
