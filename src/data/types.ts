export type OmegaSerial = { year: number; serial: number };

export type RangeSerial = {
  year: number | string;
  serialStart?: number;
  serialEnd?: number;
  serialPrefix?: string;
};

export type SizeRow = {
  crossSection: number;
  caseSizes: [string, string];
  maxLugToLug: string;
  circumference: string;
};

export type WatchHistoryItem = { brand: string; year: number; fact: string };

export type BrandGuide = { title: string; imageUrl: string; description: string };

export type Video = {
  id: number;
  title: string;
  category: string;
  youtubeId: string;
  description: string;
  publishedAt?: string;
  thumbnail?: string;
};

export type VideosPayload = {
  updatedAt: string;
  channelId: string;
  count: number;
  videos: Video[];
};

export type BrandKey = 'Omega' | 'Rolex' | 'IWC' | 'Longines' | 'UniversalGenève' | 'Seiko';

// ── Vintage Maps ────────────────────────────────────────────────
export type Region = 'korea' | 'shanghai' | 'japan' | 'hongkong';

// 지도에 실제로 노출되는 최종 시계점 (public/places.json).
export type WatchPlace = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  region: Region;
  placeId?: string | null; // 있으면 Embed place_id 사용, 없으면 name+address 쿼리
  note?: string;
  googleUrl: string;
};

export type PlacesPayload = {
  updatedAt: string;
  count: number;
  places: WatchPlace[];
};

// 어드민(/admin)이 다루는 후보 (public/places.candidates.json, 개발 전용).
// Takeout 원본은 좌표·이름이 없을 수 있어 nullable.
export type PlaceCandidate = {
  id: string;
  name: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  cid: string | null;
  placeId: string | null;
  googleUrl: string;
  countryCode: string | null;
  hasLocation: boolean;
  region: Region | null;
  isWatchGuess: boolean;
  savedAt: string | null;
};

export type CandidatesPayload = {
  updatedAt: string;
  count: number;
  candidates: PlaceCandidate[];
};
