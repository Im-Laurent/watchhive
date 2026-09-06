import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRemoteList } from '../useRemoteList';

const FALLBACK = [{ id: 0, name: 'fallback' }];

function mockFetchJson(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetchJson({ items: [] }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useRemoteList', () => {
  it('첫 렌더에서는 fallback 을 보여주며 loading 상태다', () => {
    const { result } = renderHook(() => useRemoteList('t.json', 'items', FALLBACK));
    expect(result.current.items).toBe(FALLBACK);
    expect(result.current.source).toBe('loading');
    expect(result.current.updatedAt).toBeNull();
  });

  it('목록을 받으면 live 로 바꾸고 updatedAt 을 싣는다', async () => {
    const items = [{ id: 1, name: 'live' }];
    vi.stubGlobal('fetch', mockFetchJson({ items, updatedAt: '2026-09-05' }));

    const { result } = renderHook(() => useRemoteList('t.json', 'items', FALLBACK));
    await waitFor(() => expect(result.current.source).toBe('live'));
    expect(result.current.items).toEqual(items);
    expect(result.current.updatedAt).toBe('2026-09-05');
  });

  it('updatedAt 이 없으면 null 로 둔다', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ items: [{ id: 1 }] }));
    const { result } = renderHook(() => useRemoteList('t.json', 'items', FALLBACK));
    await waitFor(() => expect(result.current.source).toBe('live'));
    expect(result.current.updatedAt).toBeNull();
  });

  it('빈 목록이면 fallback 으로 떨어진다 — 빈 화면을 보여주지 않는다', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ items: [] }));
    const { result } = renderHook(() => useRemoteList('t.json', 'items', FALLBACK));
    await waitFor(() => expect(result.current.source).toBe('fallback'));
    expect(result.current.items).toBe(FALLBACK);
  });

  it('키가 배열이 아니면 fallback', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ items: 'not an array' }));
    const { result } = renderHook(() => useRemoteList('t.json', 'items', FALLBACK));
    await waitFor(() => expect(result.current.source).toBe('fallback'));
  });

  it('키 자체가 없어도 fallback', async () => {
    vi.stubGlobal('fetch', mockFetchJson({ somethingElse: [1, 2] }));
    const { result } = renderHook(() => useRemoteList('t.json', 'items', FALLBACK));
    await waitFor(() => expect(result.current.source).toBe('fallback'));
  });

  it('404 면 fallback', async () => {
    vi.stubGlobal('fetch', mockFetchJson({}, false, 404));
    const { result } = renderHook(() => useRemoteList('t.json', 'items', FALLBACK));
    await waitFor(() => expect(result.current.source).toBe('fallback'));
    expect(result.current.items).toBe(FALLBACK);
  });

  it('네트워크가 끊겨도 fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { result } = renderHook(() => useRemoteList('t.json', 'items', FALLBACK));
    await waitFor(() => expect(result.current.source).toBe('fallback'));
  });

  it('JSON 이 깨져 있어도 fallback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.reject(new Error('bad json')) })
    );
    const { result } = renderHook(() => useRemoteList('t.json', 'items', FALLBACK));
    await waitFor(() => expect(result.current.source).toBe('fallback'));
  });

  it('BASE_URL 을 앞에 붙여 요청한다', async () => {
    const fetchMock = mockFetchJson({ items: [{ id: 1 }] });
    vi.stubGlobal('fetch', fetchMock);
    renderHook(() => useRemoteList('videos.json', 'videos', FALLBACK));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe(`${import.meta.env.BASE_URL}videos.json`);
    expect(fetchMock.mock.calls[0][1]).toEqual({ cache: 'no-cache' });
  });

  it('응답이 도착하기 전에 언마운트되면 상태를 건드리지 않는다', async () => {
    let resolveJson: (v: unknown) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => new Promise((r) => { resolveJson = r; }),
      })
    );
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { unmount } = renderHook(() => useRemoteList('t.json', 'items', FALLBACK));
    unmount();
    resolveJson({ items: [{ id: 9 }] });
    await Promise.resolve();
    expect(warn).not.toHaveBeenCalled();
  });
});
