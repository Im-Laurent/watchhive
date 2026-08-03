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
export type KoreanHistoryItem = { year: number; fact: string };

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

export type BrandKey = 'Omega' | 'Rolex' | 'IWC' | 'Longines' | 'UniversalGenève';
