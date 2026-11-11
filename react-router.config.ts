import type { Config } from '@react-router/dev/config';
import { publicPaths } from './scripts/content.mjs';

export default {
  ssr: false,
  prerender: publicPaths(),
} satisfies Config;
