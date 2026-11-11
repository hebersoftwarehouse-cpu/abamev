export type Media = { src: string; alt: string; width?: number; height?: number };
export type Attachment = { id: string; title: string; originalUrl: string; src: string; status: string; bytes?: number };
export type RecordEntry = {
  id: string; slug: string; path: string; title: string; originalTitle: string; summary: string;
  category: string; categories: string[]; format: string; sourcePublishedAt: string | null; author: string | null;
  body: string; cover: Media | null; images: Media[]; attachments: Attachment[];
  videos: { id: string; title: string }[]; source: { originalUrl: string }; legacyUrls: string[];
  chair?: number; occupant?: string | null; patron?: string | null; vacancyInSource?: boolean;
  boardNumber?: number; positions?: { role: string; name: string }[]; empty?: boolean;
};
export type EntrySummary = Omit<RecordEntry, 'body'>;
export type PageData = {
  path: string; title: string; description: string; kind: string;
  entry?: RecordEntry; entries: EntrySummary[]; selected: RecordEntry[];
};
