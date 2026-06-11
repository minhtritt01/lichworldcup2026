export interface BroadcastChannel {
  name: string;
  url: string;
  region?: string;
}

export const FREE_BROADCASTS: Record<'vi' | 'en', BroadcastChannel[]> = {
  vi: [
    { name: 'VTV2', url: 'https://vtvgo.vn/channel/vtv2' },
    { name: 'VTV3', url: 'https://vtvgo.vn/channel/vtv3' },
    { name: 'VTVGo', url: 'https://vtvgo.vn' },
    { name: 'FPT Play', url: 'https://fptplay.vn' },
  ],
  en: [
    { name: 'BBC iPlayer', url: 'https://www.bbc.co.uk/iplayer', region: 'UK' },
    { name: 'ITVX', url: 'https://www.itv.com/itvx', region: 'UK' },
    { name: 'SBS On Demand', url: 'https://www.sbs.com.au/ondemand', region: 'AUS' },
    { name: 'CazéTV', url: 'https://www.youtube.com/@cazetv', region: 'BRA' },
    { name: 'FOX Sports', url: 'https://www.foxsports.com/soccer/fifa-world-cup', region: 'USA' },
    { name: 'Telemundo', url: 'https://www.telemundodeportes.com/futbol/mundial-2026', region: 'USA' },
  ],
};
