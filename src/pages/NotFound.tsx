import { Link } from 'react-router-dom';
import PageHead from '../components/PageHead';

export default function NotFound() {
  return (
    <>
      <PageHead title="Not Found" description="요청하신 페이지를 찾을 수 없습니다." path="/404" />
      <section>
        <h1>404</h1>
        <p>요청하신 페이지를 찾을 수 없습니다.</p>
        <Link to="/">홈으로 돌아가기</Link>
      </section>
    </>
  );
}
