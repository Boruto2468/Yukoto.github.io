export type RhiyeGroup = 'learn' | 'listen' | 'watch' | 'quiz';
export type RhiyeKind = 'character' | 'idiom' | 'phrase' | 'audio' | 'life-video' | 'screen-video';
export type RhiyeLanguage = 'zh' | 'ja';

export interface RhiyeCard {
  id: string;
  group: Exclude<RhiyeGroup, 'quiz'>;
  kind: RhiyeKind;
  language: RhiyeLanguage;
  level: string;
  text: string;
  reading: string;
  meaning: string;
  example?: string;
  components?: string;
  literalMeaning?: string;
  whenToUse?: string;
  romaji?: string;
  audioUrl?: string;
  videoId?: string;
  startSeconds?: number;
  endSeconds?: number;
  segmentVerified?: boolean;
  embedVerified?: boolean;
  listenFor?: { text: string; reading: string; meaning: string };
  source?: string;
  tags?: string[];
}

export interface RhiyeHistoryEntry {
  card: RhiyeCard;
  dateSeen: string;
}
