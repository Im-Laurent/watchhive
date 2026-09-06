import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { PAGE_META } from '../data/pageMeta';

/**
 * 라우트가 실제로 그려지는지만 확인하는 얇은 그물.
 * 중복 정리로 컴포넌트를 옮겨 다니다 어느 페이지가 통째로 깨지는 일을 막는다.
 */

beforeEach(() => {
  // 목록 페이지들은 마운트되자마자 public/*.json 을 읽으러 간다 — fallback 경로로 태운다.
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

const ROUTES = Object.entries(PAGE_META);

describe('라우트', () => {
  it.each(ROUTES)('%s 가 그려진다', (_key, meta) => {
    renderAt(meta.path);
    expect(document.title).toBe(
      meta.title === 'Watch HIVE' ? 'Watch HIVE' : `${meta.title} · Watch HIVE`
    );
  });

  it.each(ROUTES)('%s 에 머리글과 바닥글이 함께 온다', (_key, meta) => {
    renderAt(meta.path);
    expect(screen.getAllByRole('link', { name: 'Watch HIVE' }).length).toBeGreaterThan(0);
    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
  });

  it('없는 주소는 404 화면으로 간다', () => {
    renderAt('/이런-페이지-없음');
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '홈으로 돌아가기' })).toBeInTheDocument();
  });

  it('머리글 메뉴가 모든 도구 페이지로 이어진다', () => {
    renderAt('/');
    ['Timegrapher', 'Year Finder', 'Fit Finder', 'Museum', 'Videos', 'About Me'].forEach((label) => {
      expect(screen.getAllByRole('link', { name: label }).length).toBeGreaterThan(0);
    });
  });
});
