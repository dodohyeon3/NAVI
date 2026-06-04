import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 모든 봇: /manage 접근 차단
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/manage', '/manage/'],
      },
      // Googlebot 명시
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/manage', '/manage/'],
      },
      // Naver 봇
      {
        userAgent: 'Yeti',
        allow: '/',
        disallow: ['/manage', '/manage/'],
      },
      {
        userAgent: 'NaverBot',
        allow: '/',
        disallow: ['/manage', '/manage/'],
      },
      // Bing
      {
        userAgent: 'bingbot',
        allow: '/',
        disallow: ['/manage', '/manage/'],
      },
    ],
    sitemap: 'https://navichart.co.kr/sitemap.xml',
  }
}
