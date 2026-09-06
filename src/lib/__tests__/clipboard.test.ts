import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText } from '../clipboard';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('copyText', () => {
  it('복사에 성공하면 true', () => {
    document.execCommand = vi.fn(() => true);
    expect(copyText('hello')).toBe(true);
  });

  it('복사할 값을 textarea 에 담아 execCommand 로 넘긴다', () => {
    let captured: string | null = null;
    document.execCommand = vi.fn(() => {
      // execCommand 가 불리는 순간에만 임시 textarea 가 문서에 붙어 있다
      captured = document.querySelector('textarea')?.value ?? null;
      return true;
    });
    copyText('https://watch-hive.com/');
    expect(captured).toBe('https://watch-hive.com/');
  });

  it('여러 줄 문자열도 그대로 담는다 — 공유 문구는 제목·설명·링크 세 줄이다', () => {
    let captured: string | null = null;
    document.execCommand = vi.fn(() => {
      captured = document.querySelector('textarea')?.value ?? null;
      return true;
    });
    copyText('제목\n설명\nhttps://watch-hive.com/');
    expect(captured).toBe('제목\n설명\nhttps://watch-hive.com/');
  });

  it('임시 textarea 를 문서에 남기지 않는다', () => {
    document.execCommand = vi.fn(() => true);
    copyText('hello');
    expect(document.querySelectorAll('textarea')).toHaveLength(0);
  });

  it('execCommand 가 던지면 false — 호출부가 실패 문구를 띄운다', () => {
    document.execCommand = vi.fn(() => {
      throw new Error('nope');
    });
    expect(copyText('hello')).toBe(false);
  });

  it('execCommand 가 false 를 주면 false', () => {
    document.execCommand = vi.fn(() => false);
    expect(copyText('hello')).toBe(false);
  });

  it('규격에 없는 값을 주는 브라우저는 성공으로 본다 — 멀쩡한 복사를 실패라 하지 않는다', () => {
    document.execCommand = vi.fn(() => undefined as unknown as boolean);
    expect(copyText('hello')).toBe(true);
  });

  it('복사가 실패해도 임시 textarea 를 남기지 않는다', () => {
    // 예전에는 execCommand 가 던지면 removeChild 까지 가지 못해 textarea 가 문서에 쌓였다.
    document.execCommand = vi.fn(() => {
      throw new Error('nope');
    });
    copyText('a');
    copyText('b');
    expect(document.querySelectorAll('textarea')).toHaveLength(0);
  });
});
