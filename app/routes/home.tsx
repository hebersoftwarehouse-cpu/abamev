import { useLoaderData } from 'react-router';
import { getPage } from '../data.server';
import { Home } from '../components/Home';
import { Seo } from '../components/Seo';
import type { PageData } from '../types';

export function loader() { return getPage('/')!; }
export default function HomePage() {
  const data = useLoaderData<PageData>();
  return <main id="main" tabIndex={-1}><Seo data={data} /><Home data={data} /></main>;
}
