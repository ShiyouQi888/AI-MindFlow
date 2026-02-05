import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getEmbedUrl(url: string): { url: string; type: 'video' | 'embed' } {
  if (!url) return { url: '', type: 'video' };

  // YouTube
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    return {
      url: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
      type: 'embed'
    };
  }

  // Bilibili
  const bilibiliRegex = /(?:bilibili\.com\/video\/|b23\.tv\/)(BV[a-zA-Z0-9]+)/;
  const bilibiliMatch = url.match(bilibiliRegex);
  if (bilibiliMatch) {
    return {
      url: `//player.bilibili.com/player.html?bvid=${bilibiliMatch[1]}&page=1&high_quality=1&danmaku=0`,
      type: 'embed'
    };
  }

  // Check if it's a direct video file
  const isDirectVideo = /\.(mp4|webm|ogg|mov)(?:\?.*)?$/i.test(url);
  return {
    url: url,
    type: isDirectVideo ? 'video' : 'embed' // Default to embed for unknown links
  };
}
