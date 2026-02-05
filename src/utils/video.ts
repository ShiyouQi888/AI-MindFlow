export interface VideoInfo {
  type: 'youtube' | 'bilibili' | 'direct';
  id: string | null;
  embedUrl: string | null;
}

export const parseVideoUrl = (url: string): VideoInfo => {
  if (!url) return { type: 'direct', id: null, embedUrl: null };

  // YouTube
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    const id = youtubeMatch[1];
    return {
      type: 'youtube',
      id,
      embedUrl: `https://www.youtube.com/embed/${id}`
    };
  }

  // Bilibili
  // Matches: 
  // https://www.bilibili.com/video/BV1GJ411x7h7
  // https://b23.tv/BV1GJ411x7h7
  const bilibiliRegex = /(?:bilibili\.com\/video\/|b23\.tv\/)(BV[a-zA-Z0-9]+)/i;
  const bilibiliMatch = url.match(bilibiliRegex);
  if (bilibiliMatch) {
    const id = bilibiliMatch[1];
    return {
      type: 'bilibili',
      id,
      embedUrl: `//player.bilibili.com/player.html?bvid=${id}&page=1&high_quality=1&danmaku=0`
    };
  }

  return { type: 'direct', id: null, embedUrl: url };
};

export const isThirdPartyVideo = (url: string): boolean => {
  const info = parseVideoUrl(url);
  return info.type !== 'direct';
};
