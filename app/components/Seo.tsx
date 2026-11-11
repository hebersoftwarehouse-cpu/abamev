import { Helmet } from 'react-helmet-async';
import site from '../../content/site.json';
import type { PageData } from '../types';

export function Seo({ data }: { data: PageData }) {
  const base = import.meta.env.VITE_SITE_URL || site.url;
  const canonical = `${base}${data.path === '/' ? '' : data.path}`;
  const title = data.path === '/' ? `${site.shortName} — ${site.name}` : `${data.title} | ABAMEV`;
  const preview = import.meta.env.VITE_NOINDEX === 'true' || data.path === '/busca' || data.path === '/404';
  const image = `${base}/social/${data.entry?.id || 'default'}.png`;
  const org = { '@context': 'https://schema.org', '@type': 'Organization', name: site.name, alternateName: 'ABAMEV', url: base, foundingDate: '1999-09-09', sameAs: [site.youtube, ...(site.instagram ? [site.instagram] : [])] };
  const article = data.entry ? { '@context': 'https://schema.org', '@type': 'Article', headline: data.title, description: data.description, url: canonical, image, ...(data.entry.sourcePublishedAt ? { datePublished: data.entry.sourcePublishedAt } : {}), ...(data.entry.author ? { author: { '@type': 'Person', name: data.entry.author } } : {}), publisher: { '@type': 'Organization', name: site.name }, inLanguage: 'pt-BR' } : null;
  const breadcrumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Início', item: base }, ...(data.path !== '/' ? [{ '@type': 'ListItem', position: 2, name: data.title, item: canonical }] : [])] };
  return <Helmet><title>{title}</title><meta name="description" content={data.description} /><link rel="canonical" href={canonical} /><meta name="robots" content={preview ? 'noindex, follow' : 'index, follow'} /><meta property="og:locale" content="pt_BR" /><meta property="og:site_name" content="ABAMEV" /><meta property="og:type" content={article ? 'article' : 'website'} /><meta property="og:title" content={title} /><meta property="og:description" content={data.description} /><meta property="og:url" content={canonical} /><meta property="og:image" content={image} /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content={title} /><meta name="twitter:description" content={data.description} /><meta name="twitter:image" content={image} /><script type="application/ld+json">{JSON.stringify([org, breadcrumbs, ...(article ? [article] : [])]).replace(/</g, '\\u003c')}</script></Helmet>;
}
