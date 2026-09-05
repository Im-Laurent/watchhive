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

/** 명제표 한 벌. 영문·국문을 같은 모양으로 담는다. */
export type MuseumPlate = {
  artist: string;
  meta: string;
  title: string;
  medium: string;
  watch: string;
};

/** 한 작품이 가진 사진 한 장. kind 는 full → detail → watch 순으로 온다. */
export type MuseumShot = {
  kind: 'full' | 'detail' | 'watch';
  label: string;
  /** 확장자 없는 경로. webp 와 jpg 가 한 벌씩 있다. */
  src: string;
  w: number;
  h: number;
};

export type MuseumPiece = {
  id: string;
  alt: string;
  shots: MuseumShot[];
  en: MuseumPlate;
  ko: MuseumPlate;
  spec: string;
  credit: string;
};

export type MuseumPayload = {
  updatedAt: string;
  count: number;
  pieces: MuseumPiece[];
};
