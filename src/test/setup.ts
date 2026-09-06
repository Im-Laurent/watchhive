import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// vitest 를 globals 없이 쓰고 있어서 Testing Library 의 자동 정리가 등록되지 않는다.
// 붙여 두지 않으면 앞선 테스트가 그린 DOM 이 남아 다음 테스트의 조회가 중복으로 걸린다.
afterEach(cleanup);

// jsdom 에는 레이아웃이 없어 이 둘이 구현돼 있지 않다. 결과 자리로 스크롤하는 코드가
// 실제로 부르는 함수라, 없으면 테스트가 엉뚱한 TypeError 로 죽는다.
Element.prototype.scrollIntoView = () => {};
window.scrollTo = () => {};
