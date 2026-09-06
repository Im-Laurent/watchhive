import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SubscribeShare from '../SubscribeShare';

beforeEach(() => {
  document.execCommand = vi.fn(() => true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SubscribeShare', () => {
  it('구독 링크는 새 탭으로 열리고 구독 확인 파라미터를 단다', () => {
    render(<SubscribeShare />);
    const link = screen.getByRole('link', { name: 'YouTube 채널 구독하기' });
    expect(link).toHaveAttribute('href', 'https://www.youtube.com/@seemoung?sub_confirmation=1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('공유 버튼을 누르면 안내 문구가 뜬다', async () => {
    const user = userEvent.setup();
    render(<SubscribeShare />);
    await user.click(screen.getByRole('button', { name: '다른 시계 덕후에게 공유하기' }));
    expect(await screen.findByText('링크가 클립보드에 복사되었습니다!')).toBeInTheDocument();
  });

  it('처음에는 안내 문구가 없다', () => {
    render(<SubscribeShare />);
    expect(screen.queryByText(/복사되었습니다/)).not.toBeInTheDocument();
  });

  it('페이지별 공유 문구를 넘길 수 있다', async () => {
    let captured: string | null = null;
    document.execCommand = vi.fn(() => {
      captured = document.querySelector('textarea')?.value ?? null;
      return true;
    });
    const user = userEvent.setup();
    render(<SubscribeShare shareTitle="Year Finder" shareText="생산년도를 확인해보세요!" />);
    await user.click(screen.getByRole('button', { name: '다른 시계 덕후에게 공유하기' }));
    expect(captured).toContain('Year Finder');
    expect(captured).toContain('생산년도를 확인해보세요!');
  });

  it('바깥 클래스를 덧붙일 수 있다 — Museum 은 container 가 필요하다', () => {
    const { container } = render(<SubscribeShare className="container mx-auto" />);
    const section = container.querySelector('section');
    expect(section).toHaveClass('container', 'mx-auto', 'p-8', 'text-center');
  });

  it('두 버튼이 같은 모양을 쓴다 — 페이지마다 갈리던 것을 한 벌로 모았다', () => {
    render(<SubscribeShare />);
    const link = screen.getByRole('link', { name: 'YouTube 채널 구독하기' });
    const button = screen.getByRole('button', { name: '다른 시계 덕후에게 공유하기' });
    expect(link.className).toBe(button.className);
    expect(link).toHaveClass('w-full', 'sm:w-auto');
  });
});
