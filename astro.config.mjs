import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  site: 'https://hartupconstruction.com.au',
  compressHTML: true,
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
