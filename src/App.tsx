import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Videos from './pages/Videos';
import FitFinder from './pages/FitFinder';
import YearFinder from './pages/YearFinder';
import Timegrapher from './pages/Timegrapher';
import AboutMe from './pages/AboutMe';
import NotFound from './pages/NotFound';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/fit-finder" element={<FitFinder />} />
        <Route path="/year-finder" element={<YearFinder />} />
        <Route path="/timegrapher" element={<Timegrapher />} />
        <Route path="/about-me" element={<AboutMe />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
