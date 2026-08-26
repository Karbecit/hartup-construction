import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  site: 'https://hartupconstruction.com.au',
  compressHTML: true,
  server: {
    host: true,
    port: 4321,
  },
  env: {
    schema: {
      STAGING: envField.boolean({
        context: 'server',
        access: 'public',
        default: false,
      }),
    },
  },
});
