export interface VideoInfo {
  type: 'youtube' | 'bilibili' | 'vimeo' | 'twitch' | 'direct' | 'other';
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

  // Vimeo
  const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/i;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    return { type: 'vimeo', id: vimeoMatch[1], embedUrl: url };
  }

  // Twitch
  if (url.includes('twitch.tv')) {
    return { type: 'twitch', id: null, embedUrl: url };
  }

  // Generic check for direct video files
  const isDirectVideo = /\.(mp4|webm|ogg|mov)$/i.test(url);
  if (isDirectVideo) {
    return { type: 'direct', id: null, embedUrl: url };
  }

  return { type: 'other', id: null, embedUrl: url };
};

export const isThirdPartyVideo = (url: string): boolean => {
  const info = parseVideoUrl(url);
  return info.type !== 'direct';
};
