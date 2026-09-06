import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useShare } from '../useShare';

beforeEach(() => {
  document.execCommand = vi.fn(() => true);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'share');
});

function stubNativeShare(impl: (data: unknown) => Promise<void>) {
  Object.defineProperty(navigator, 'share', { value: impl, configurable: true, writable: true });
}

describe('useShare', () => {
  it('네이티브 공유가 없으면 복사만 하고 안내한다', async () => {
    const { result } = renderHook(() => useShare());
    await act(async () => { await result.current.handleShare(); });
    expect(result.current.shareMessage).toBe('링크가 클립보드에 복사되었습니다!');
  });

  it('복사에 실패하면 실패 문구', async () => {
    document.execCommand = vi.fn(() => { throw new Error('blocked'); });
    const { result } = renderHook(() => useShare());
    await act(async () => { await result.current.handleShare(); });
    expect(result.current.shareMessage).toBe('클립보드 복사에 실패했습니다.');
  });

  it('네이티브 공유가 성공하면 그 결과로 문구를 덮는다', async () => {
    stubNativeShare(() => Promise.resolve());
    const { result } = renderHook(() => useShare());
    await act(async () => { await result.current.handleShare(); });
    expect(result.current.shareMessage).toBe('성공적으로 공유되었습니다!');
  });

  it('공유를 취소해도 복사는 됐으므로 실패라고 말하지 않는다', async () => {
    stubNativeShare(() => Promise.reject(new Error('AbortError')));
    const { result } = renderHook(() => useShare());
    await act(async () => { await result.current.handleShare(); });
    expect(result.current.shareMessage).toBe('링크가 클립보드에 복사되었습니다!');
  });

  it('복사도 공유도 실패하면 그때만 공유 실패를 알린다', async () => {
    document.execCommand = vi.fn(() => { throw new Error('blocked'); });
    stubNativeShare(() => Promise.reject(new Error('AbortError')));
    const { result } = renderHook(() => useShare());
    await act(async () => { await result.current.handleShare(); });
    expect(result.current.shareMessage).toBe('공유에 실패했습니다.');
  });

  it('제목·설명·주소를 세 줄로 이어 복사한다', async () => {
    let captured: string | null = null;
    document.execCommand = vi.fn(() => {
      captured = document.querySelector('textarea')?.value ?? null;
      return true;
    });
    const { result } = renderHook(() => useShare('Year Finder', '생산년도를 확인해보세요!'));
    await act(async () => { await result.current.handleShare({ url: 'https://watch-hive.com/year-finder' }); });
    expect(captured).toBe('Year Finder\n생산년도를 확인해보세요!\nhttps://watch-hive.com/year-finder');
  });

  it('넘긴 값이 기본값을 이긴다', async () => {
    const shareSpy = vi.fn(() => Promise.resolve());
    stubNativeShare(shareSpy);
    const { result } = renderHook(() => useShare('기본 제목', '기본 설명'));
    await act(async () => { await result.current.handleShare({ title: '다른 제목' }); });
    expect(shareSpy).toHaveBeenCalledWith(expect.objectContaining({ title: '다른 제목', text: '기본 설명' }));
  });

  it('주소를 안 주면 현재 페이지 주소를 쓴다', async () => {
    const shareSpy = vi.fn(() => Promise.resolve());
    stubNativeShare(shareSpy);
    const { result } = renderHook(() => useShare());
    await act(async () => { await result.current.handleShare(); });
    expect(shareSpy).toHaveBeenCalledWith(expect.objectContaining({ url: window.location.href }));
  });
});
