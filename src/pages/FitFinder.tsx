import { useState, useRef } from 'react';
import PageHead from '../components/PageHead';
import { useShare } from '../hooks/useShare';
import { SIZE_CHART } from '../data/sizeChart';

type Result = { recCase: string; recLug: string };

export default function FitFinder() {
  const [watchType, setWatchType] = useState('dress-watch');
  const [wristInput, setWristInput] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);
  const { handleShare, shareMessage } = useShare('Fit Finder', '나에게 맞는 시계 사이즈를 찾아보세요!');

  const calculate = () => {
    setError('');
    setResult(null);
    const value = parseFloat(wristInput);
    if (isNaN(value) || value < 40 || value > 65) {
      setError('40mm~65mm 사이로 입력해 주세요');
      return;
    }

    let recCase = '';
    let recLug = '';
    if (watchType === 'dress-watch') {
      recCase = `${(value * 0.6).toFixed(1)}mm ~ ${(value * 0.7).toFixed(1)}mm`;
      recLug = `${(value * 0.85).toFixed(1)}mm`;
    } else if (watchType === 'generous-fit') {
      recCase = `${(value * 0.75).toFixed(1)}mm ~ ${(value * 0.8).toFixed(1)}mm`;
      recLug = `${(value * 0.9).toFixed(1)}mm`;
    } else {
      const data = SIZE_CHART.find((r) => r.crossSection === Math.round(value)) || SIZE_CHART[0];
      const maxC = parseFloat(data.caseSizes[1]);
      recCase = `${(maxC - 2).toFixed(1)}mm ~ ${maxC}mm`;
      recLug = `${(parseFloat(data.maxLugToLug) - 1).toFixed(1)}mm`;
    }
    setResult({ recCase, recLug });
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <>
      <PageHead
        title="Fit Finder"
        description="손목 단면 너비로 나에게 어울리는 시계 케이스·러그 사이즈를 계산합니다."
        path="/fit-finder"
      />
      <main className="container mx-auto mt-8 px-6 md:px-12 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center mt-4 md:mt-8">Fit Finder</h1>
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">나에게 맞는 시계 사이즈 찾기</h2>
          <p className="text-gray-600 mb-6">손목 위에서 시계가 가장 조화로운 비율로 보여지는 케이스 사이즈와 러그 투 러그 길이를 찾아보세요.</p>
          <div className="mb-4">
            <label className="block text-gray-700 text-base font-bold mb-2">시계 종류 선택:</label>
            <select value={watchType} onChange={(e) => setWatchType(e.target.value)} className="shadow border rounded w-full py-2 px-3 text-gray-700 text-base">
              <option value="dress-watch">드레스 워치</option>
              <option value="tool-watch">툴 워치</option>
              <option value="generous-fit">대중적인 사이즈</option>
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-base font-bold mb-2">손목 단면 (mm) 입력:</label>
            <input type="number" value={wristInput} onChange={(e) => setWristInput(e.target.value)} className="shadow border rounded w-full py-2 px-3 text-base" placeholder="예: 55" />
            {error && <p className="text-red-500 text-sm italic mt-2">{error}</p>}
          </div>
          <button onClick={calculate} className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 px-4 rounded-full shadow-md w-full">추천 사이즈 확인</button>
          <div className="mt-4 mb-6">
            <ul className="list-none p-0 m-0 text-gray-700 text-base mb-4">
              <li>1. 손목 단면 너비</li>
              <li>2. 케이스 사이즈</li>
              <li>3. 러그 투 러그 사이즈</li>
            </ul>
            <div className="flex justify-center">
              <img src="/images/fit_finder_guide.png" alt="guide" className="max-w-full h-auto rounded-lg shadow-sm" />
            </div>
          </div>
          {result && (
            <div ref={resultRef} className="mt-8 p-4 bg-blue-100 border-l-4 border-blue-500 text-blue-800 rounded-md flex flex-col items-center space-y-1">
              <p className="font-bold text-xl md:text-2xl text-blue-700">{watchType === 'dress-watch' ? '드레스 워치' : watchType === 'generous-fit' ? '후한인심' : '툴 워치'}</p>
              <p className="font-bold text-xl md:text-2xl mb-1">추천 케이스 사이즈: <span className="text-blue-700">{result.recCase}</span> (용두 제외)</p>
              <p className="font-bold text-lg md:text-xl">최대 러그 투 러그 길이: <span className="text-blue-700">{result.recLug}</span></p>
            </div>
          )}
          <div className="mt-8 p-4 bg-gray-100 border-l-4 border-gray-300 text-gray-700 rounded-md">
            <p className="font-bold text-lg mb-2">💡 참고해주세요!</p>
            <ul className="list-disc list-inside space-y-2 text-base">
              <li>✋ 손목 단면 너비는 손목 뼈에서 1.0~1.5cm 왼쪽을 측정하세요. (왼손 기준)</li>
              <li>📏 세로로 긴 직사각형, 타원형 시계의 경우 추천 케이스 사이즈는 세로를 기준으로 참고하세요.</li>
              <li>🎲 바둑알 간지를 원하시면 추천 케이스 사이즈의 최소값에 도전해 보세요.</li>
              <li>🙋‍♂️ 손목 너비 5cm인 저는 27~32mm 빈티지를 즐겨 차며, 최대 사이즈는 34mm로 하고 있습니다.</li>
              <li>🛡️ 파네라이는 방간 맛으로 차는 시계니까 추천 사이즈와 무관하게 호신용으로 좋아보이는걸 선택하세요.</li>
            </ul>
          </div>
        </div>
        <section className="p-8 text-center mt-8">
          <p className="text-gray-700 text-lg mb-6">구독과 공유는 콘텐츠 제작에 큰 힘이 됩니다.</p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4">
            <a href="https://www.youtube.com/@seemoung?sub_confirmation=1" target="_blank" rel="noreferrer" className="bg-gray-800 text-gray-300 font-bold py-3 px-6 rounded-full shadow-md">YouTube 채널 구독하기</a>
            <button onClick={() => handleShare()} className="bg-gray-800 text-gray-300 font-bold py-3 px-6 rounded-full shadow-md">다른 시계 덕후에게 공유하기</button>
          </div>
          {shareMessage && <div className="mt-4 text-blue-600 text-sm">{shareMessage}</div>}
        </section>
      </main>
    </>
  );
}
