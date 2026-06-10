const STAGE_MAP: Array<[string, string]> = [
  ['Vòng Bảng', 'Group Stage'],
  ['Vòng 1/16',  'Round of 32'],
  ['Vòng 1/8',   'Round of 16'],
  ['Tứ Kết',     'Quarter-finals'],
  ['Bán Kết',    'Semi-finals'],
  ['Tranh Hạng Ba', 'Third-place play-off'],
  ['Chung Kết',  'Final'],
];

export function getStageLabel(stage: string, locale: 'vi' | 'en'): string {
  if (locale === 'vi') return stage;
  for (const [vi, en] of STAGE_MAP) {
    if (stage.startsWith(vi)) {
      const suffix = stage.slice(vi.length).replace(/Bảng\s/g, 'Group ');
      return `${en}${suffix}`;
    }
  }
  return stage;
}
