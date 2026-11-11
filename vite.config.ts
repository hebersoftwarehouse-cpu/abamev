import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production' || process.env.CONTEXT && process.env.CONTEXT !== 'production') process.env.VITE_NOINDEX = 'true';

export default defineConfig({ plugins: [reactRouter()] });
