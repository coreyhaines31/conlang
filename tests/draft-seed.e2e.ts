import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('randomizing the seed keeps a single draft', async ({ app, agent, screen, browser }) => {
  await app.open('/');
  await agent.act('name the language {name}, choose Quick Start, and pick any sound style', {
    params: { name: 'Sindarin' },
  });
  await expect(screen.getByLabel('Language name')).toHaveValue('Sindarin');

  await screen.getByText('Advanced Settings', { exact: false }).tap();
  await screen.getByRole('button', 'Randomize').tap();
  await screen.getByRole('button', 'Randomize').tap();

  const drafts = await browser.evaluate(() =>
    JSON.parse(localStorage.getItem('languageDrafts') ?? '[]').map((d: { name: string }) => d.name),
  );
  expect(drafts).toEqual(['Sindarin']);
});
