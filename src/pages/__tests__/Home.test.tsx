import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Home from '../Home';

function renderPage() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

const SERVICE_ROUTES = ['/timegrapher', '/year-finder', '/fit-finder', '/videos'];

describe('Home 서비스 카드', () => {
  it('카드마다 진짜 링크를 쓴다 — 예전에는 div 의 onClick 이라 탭으로 닿지 않았다', () => {
    renderPage();
    SERVICE_ROUTES.forEach((route) => {
      const link = document.querySelector(`a[href="${route}"]`);
      expect(link).toBeInTheDocument();
    });
  });

  it('카드 안에 버튼을 넣지 않는다 — 누를 수 있는 것이 겹치면 안 된다', () => {
    renderPage();
    SERVICE_ROUTES.forEach((route) => {
      const link = document.querySelector(`a[href="${route}"]`);
      expect(link?.querySelector('button')).toBeNull();
      expect(link?.querySelector('a')).toBeNull();
    });
  });

  it('탭으로 카드에 닿을 수 있다', async () => {
    const user = userEvent.setup();
    renderPage();
    const first = document.querySelector(`a[href="${SERVICE_ROUTES[0]}"]`) as HTMLElement;
    first.focus();
    expect(first).toHaveFocus();
    await user.tab();
    expect(document.querySelector(`a[href="${SERVICE_ROUTES[1]}"]`)).toHaveFocus();
  });

  it('카드 이름과 설명이 링크 이름에 들어간다 — 스크린리더가 읽을 것', () => {
    renderPage();
    const link = document.querySelector('a[href="/timegrapher"]');
    expect(link?.textContent).toContain('Timegrapher');
    expect(link?.textContent).toContain('세계에서 가장 간편한 시계 진단');
  });

  it('클릭할 수 있는 요소는 전부 링크이거나 버튼이다', () => {
    const { container } = renderPage();
    // onClick 을 단 div 가 다시 생기지 않도록 지킨다
    container.querySelectorAll('div[class*="cursor-pointer"]').forEach((el) => {
      expect(el.closest('a, button')).not.toBeNull();
    });
  });
});
