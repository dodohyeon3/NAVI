import { NextResponse } from 'next/server'

const SITE_URL = 'https://navichart.co.kr'

const URLS = [
  { loc: SITE_URL,                                  changefreq: 'weekly',  priority: '1.0' },
  { loc: `${SITE_URL}/chart`,                       changefreq: 'weekly',  priority: '0.9' },
  { loc: `${SITE_URL}/indicator/rsi`,               changefreq: 'monthly', priority: '0.7' },
  { loc: `${SITE_URL}/indicator/macd`,              changefreq: 'monthly', priority: '0.7' },
  { loc: `${SITE_URL}/indicator/bollinger`,         changefreq: 'monthly', priority: '0.7' },
  { loc: `${SITE_URL}/indicator/moving-average`,    changefreq: 'monthly', priority: '0.7' },
  { loc: `${SITE_URL}/indicator/trendline`,         changefreq: 'monthly', priority: '0.7' },
  { loc: `${SITE_URL}/indicator/fibonacci`,         changefreq: 'monthly', priority: '0.7' },
]

export async function GET() {
  const lastmod = new Date().toISOString()

  const urlEntries = URLS.map(
    ({ loc, changefreq, priority }) =>
      `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`,
  ).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  })
}
