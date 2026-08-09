import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Videos from './pages/Videos';
import FitFinder from './pages/FitFinder';
import YearFinder from './pages/YearFinder';
import AboutMe from './pages/AboutMe';
import NotFound from './pages/NotFound';
import './App.css';

// 어드민(/admin)은 개발 전용. import.meta.env.DEV 는 프로덕션에서 false 로 치환되어
// 아래 dynamic import 가 dead-code 로 제거된다 → dist 번들에 포함되지 않음.
const PlacesAdmin = import.meta.env.DEV ? lazy(() => import('./pages/PlacesAdmin')) : null;

// Vintage Maps(/vintage-maps)도 같은 이유로 개발 전용. 미해결 결정(지도 API 선택, 데이터 부족)이
// 정리될 때까지 프로덕션에서는 라우트와 번들 양쪽에서 빠진다. 공개할 때는 이 가드만 걷어내면 된다.
const VintageMaps = import.meta.env.DEV ? lazy(() => import('./pages/VintageMaps')) : null;

export default function App() {
  return (
    <Routes>
      {PlacesAdmin && (
        <Route
          path="/admin"
          element={
            <Suspense fallback={null}>
              <PlacesAdmin />
            </Suspense>
          }
        />
      )}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/fit-finder" element={<FitFinder />} />
        <Route path="/year-finder" element={<YearFinder />} />
        {VintageMaps && (
          <Route
            path="/vintage-maps"
            element={
              <Suspense fallback={null}>
                <VintageMaps />
              </Suspense>
            }
          />
        )}
        <Route path="/about-me" element={<AboutMe />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
