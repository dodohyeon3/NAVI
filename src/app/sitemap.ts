import type { MetadataRoute } from 'next'

const SITE_URL = 'https://navichart.co.kr'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // ── 홈 ─── 최우선 색인
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // ── 메인 차트 페이지 ───
    {
      url: `${SITE_URL}/chart`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // ── 지표 학습 페이지 ───
    {
      url: `${SITE_URL}/indicator/rsi`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/indicator/macd`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/indicator/bollinger`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/indicator/moving-average`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/indicator/trendline`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/indicator/fibonacci`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // 제외: /manage (검색 차단 대상)
  ]
}
