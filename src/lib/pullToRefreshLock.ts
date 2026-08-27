/**
 * 당겨서 새로고침을 잠시 꺼두기 위한 스위치.
 *
 * 타임그래퍼 측정 중에 화면을 잘못 건드려 새로고침되면 15초짜리 측정이 통째로 날아간다.
 * 그 구간에서만 잠근다. 컴포넌트 트리를 가로지르는 값이라 컨텍스트 대신 모듈 하나로 둔다.
 */
let locked = false;

export function setPullToRefreshLocked(value: boolean): void {
  locked = value;
}

export function isPullToRefreshLocked(): boolean {
  return locked;
}
