export type TeamKey =
  | 'mexico' | 'nam-phi' | 'han-quoc' | 'sec'
  | 'canada' | 'bosnia' | 'qatar' | 'thuy-si'
  | 'my' | 'paraguay' | 'uc' | 'tho-nhi-ky'
  | 'brazil' | 'maroc' | 'haiti' | 'scotland'
  | 'duc' | 'curacao' | 'ha-lan' | 'nhat-ban'
  | 'bo-bien-nga' | 'ecuador' | 'thuy-dien' | 'tunisia'
  | 'tay-ban-nha' | 'cape-verde' | 'bi' | 'ai-cap'
  | 'a-rap-xe-ut' | 'uruguay' | 'iran' | 'new-zealand'
  | 'phap' | 'senegal' | 'iraq' | 'na-uy'
  | 'argentina' | 'algeria' | 'ao' | 'jordan'
  | 'bo-dao-nha' | 'congo-dr' | 'anh' | 'croatia'
  | 'ghana' | 'panama' | 'uzbekistan' | 'colombia';

interface TeamNames {
  vi: string;
  en: string;
}

export const TEAM_NAMES: Record<TeamKey, TeamNames> = {
  'mexico':        { vi: 'Mexico',              en: 'Mexico' },
  'nam-phi':       { vi: 'Nam Phi',             en: 'South Africa' },
  'han-quoc':      { vi: 'Hàn Quốc',            en: 'South Korea' },
  'sec':           { vi: 'Séc',                 en: 'Czechia' },
  'canada':        { vi: 'Canada',              en: 'Canada' },
  'bosnia':        { vi: 'Bosnia & Herzegovina', en: 'Bosnia & Herzegovina' },
  'qatar':         { vi: 'Qatar',               en: 'Qatar' },
  'thuy-si':       { vi: 'Thụy Sĩ',             en: 'Switzerland' },
  'my':            { vi: 'Mỹ',                  en: 'USA' },
  'paraguay':      { vi: 'Paraguay',            en: 'Paraguay' },
  'uc':            { vi: 'Úc',                  en: 'Australia' },
  'tho-nhi-ky':    { vi: 'Thổ Nhĩ Kỳ',          en: 'Türkiye' },
  'brazil':        { vi: 'Brazil',              en: 'Brazil' },
  'maroc':         { vi: 'Maroc',               en: 'Morocco' },
  'haiti':         { vi: 'Haiti',               en: 'Haiti' },
  'scotland':      { vi: 'Scotland',            en: 'Scotland' },
  'duc':           { vi: 'Đức',                 en: 'Germany' },
  'curacao':       { vi: 'Curaçao',             en: 'Curaçao' },
  'ha-lan':        { vi: 'Hà Lan',              en: 'Netherlands' },
  'nhat-ban':      { vi: 'Nhật Bản',            en: 'Japan' },
  'bo-bien-nga':   { vi: 'Bờ Biển Ngà',         en: 'Ivory Coast' },
  'ecuador':       { vi: 'Ecuador',             en: 'Ecuador' },
  'thuy-dien':     { vi: 'Thụy Điển',           en: 'Sweden' },
  'tunisia':       { vi: 'Tunisia',             en: 'Tunisia' },
  'tay-ban-nha':   { vi: 'Tây Ban Nha',         en: 'Spain' },
  'cape-verde':    { vi: 'Cape Verde',           en: 'Cape Verde' },
  'bi':            { vi: 'Bỉ',                  en: 'Belgium' },
  'ai-cap':        { vi: 'Ai Cập',              en: 'Egypt' },
  'a-rap-xe-ut':   { vi: 'Ả Rập Xê Út',         en: 'Saudi Arabia' },
  'uruguay':       { vi: 'Uruguay',             en: 'Uruguay' },
  'iran':          { vi: 'Iran',                en: 'Iran' },
  'new-zealand':   { vi: 'New Zealand',         en: 'New Zealand' },
  'phap':          { vi: 'Pháp',                en: 'France' },
  'senegal':       { vi: 'Senegal',             en: 'Senegal' },
  'iraq':          { vi: 'Iraq',                en: 'Iraq' },
  'na-uy':         { vi: 'Na Uy',               en: 'Norway' },
  'argentina':     { vi: 'Argentina',           en: 'Argentina' },
  'algeria':       { vi: 'Algeria',             en: 'Algeria' },
  'ao':            { vi: 'Áo',                  en: 'Austria' },
  'jordan':        { vi: 'Jordan',              en: 'Jordan' },
  'bo-dao-nha':    { vi: 'Bồ Đào Nha',          en: 'Portugal' },
  'congo-dr':      { vi: 'Congo DR',            en: 'DR Congo' },
  'anh':           { vi: 'Anh',                 en: 'England' },
  'croatia':       { vi: 'Croatia',             en: 'Croatia' },
  'ghana':         { vi: 'Ghana',               en: 'Ghana' },
  'panama':        { vi: 'Panama',              en: 'Panama' },
  'uzbekistan':    { vi: 'Uzbekistan',          en: 'Uzbekistan' },
  'colombia':      { vi: 'Colombia',            en: 'Colombia' },
};

export function getTeamName(slug: string, locale: 'vi' | 'en'): string {
  const entry = TEAM_NAMES[slug as TeamKey];
  if (!entry) return slug;
  return entry[locale];
}
