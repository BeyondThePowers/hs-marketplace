// @ts-check
import { defineConfig, envField } from 'astro/config';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';

const disableNetlifyAdapter = process.env.DISABLE_NETLIFY_ADAPTER === '1';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://marketplace.example.com',
  adapter: disableNetlifyAdapter
    ? undefined
    : netlify({
        imageCDN: true,
        cacheOnDemandPages: false,
      }),

  server: {
    host: '0.0.0.0',
    port: 4322,
  },

  integrations: [sitemap()],

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },

  image: {
    layout: 'constrained',
    responsiveStyles: true,
  },

  build: {
    inlineStylesheets: 'always',
  },

  env: {
    schema: {
      PUBLIC_SITE_URL: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
      SUPABASE_URL: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      SUPABASE_ANON_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      ALLOW_INSECURE_SOURCE_URLS: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      MARKETPLACE_DIAGNOSTICS_USER: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
      MARKETPLACE_DIAGNOSTICS_PASSWORD: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
    },
    validateSecrets: true,
  },
});
