import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useClipboard } from '../useClipboard';

beforeEach(() => {
  vi.useFakeTimers();
  document.execCommand = vi.fn(() => true);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useClipboard', () => {
  it('처음에는 안내 문구가 없다', () => {
    const { result } = renderHook(() => useClipboard());
    expect(result.current.copyMessage).toBe('');
  });

  it('복사하면 기본 문구를 띄운다', () => {
    const { result } = renderHook(() => useClipboard());
    act(() => result.current.copyToClipboard('hello'));
    expect(result.current.copyMessage).toBe('클립보드에 복사되었습니다!');
  });

  it('문구를 직접 넘길 수 있다', () => {
    const { result } = renderHook(() => useClipboard());
    act(() => result.current.copyToClipboard('a@b.com', '이메일 주소가 복사되었습니다!'));
    expect(result.current.copyMessage).toBe('이메일 주소가 복사되었습니다!');
  });

  it('복사에 실패하면 실패 문구', () => {
    document.execCommand = vi.fn(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => useClipboard());
    act(() => result.current.copyToClipboard('hello'));
    expect(result.current.copyMessage).toBe('복사에 실패했습니다.');
  });

  it('3초 뒤에 문구가 사라진다', () => {
    const { result } = renderHook(() => useClipboard());
    act(() => result.current.copyToClipboard('hello'));
    act(() => void vi.advanceTimersByTime(2999));
    expect(result.current.copyMessage).not.toBe('');
    act(() => void vi.advanceTimersByTime(1));
    expect(result.current.copyMessage).toBe('');
  });

  it('연달아 누르면 타이머가 새로 시작한다 — 먼저 건 타이머가 새 문구를 지우면 안 된다', () => {
    const { result } = renderHook(() => useClipboard());
    act(() => result.current.copyToClipboard('first'));
    act(() => void vi.advanceTimersByTime(2500));
    act(() => result.current.copyToClipboard('second', '두 번째!'));
    // 첫 타이머가 살아 있었다면 여기서 지워졌을 시점
    act(() => void vi.advanceTimersByTime(600));
    expect(result.current.copyMessage).toBe('두 번째!');
    act(() => void vi.advanceTimersByTime(2400));
    expect(result.current.copyMessage).toBe('');
  });

  it('언마운트 뒤 타이머가 터져도 조용하다', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result, unmount } = renderHook(() => useClipboard());
    act(() => result.current.copyToClipboard('hello'));
    unmount();
    act(() => void vi.advanceTimersByTime(5000));
    expect(error).not.toHaveBeenCalled();
  });
});
