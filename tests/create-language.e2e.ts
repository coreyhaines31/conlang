import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('a visitor creates a language and generates words', async ({ app, agent, screen, browser }) => {
  await app.open('/');
  await expect(screen.getByRole('heading', 'Create Your Language')).toBeVisible();

  await agent.act('name the language {name}, choose Quick Start, and pick any sound style', {
    params: { name: 'Eldarin' },
  });
  await expect(screen.getByLabel('Language name')).toHaveValue('Eldarin');

  await screen.getByRole('button', 'Generate').tap();
  await expect(screen.getByText('Generated Words (20)')).toBeVisible();

  await screen.getByRole('button', 'Save Local').tap();
  await expect(screen.getByText('Saved to local storage')).toBeVisible();
  await browser.reload();
  await agent.act('open the language selector');
  await agent.assert('Eldarin is listed under Local Drafts');
});
