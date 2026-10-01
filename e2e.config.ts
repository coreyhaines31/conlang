import { existsSync } from 'node:fs';
import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';
import { gateway } from 'ai';

// e2e loads no .env files itself; AI_GATEWAY_API_KEY lives in .env.local locally.
if (existsSync('.env.local')) process.loadEnvFile('.env.local');

export default {
  agents: {
    default: {
      model: gateway('openai/gpt-6-luna-fast'),
      system: 'You are a thorough QA agent. Verify every outcome.',
      context:
        'Conlang is a constructed-language editor. A "language" has a sound system (consonants, vowels, syllable types) used to generate words. Signed-out visitors keep languages as local drafts in the browser.',
    },
  },
  targets: [{
    engine: web(),
    app: {
      url: process.env.APP_URL ?? 'http://localhost:3001',
      command: {
        executable: 'npm',
        args: ['run', 'dev'],
        log: '.e2e/logs/app.log',
        reuseExisting: true,
        startupTimeout: 120000,
      },
    },
  }],
} satisfies E2EConfig;
