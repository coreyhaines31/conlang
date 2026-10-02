import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('a visitor deletes a local draft', async ({ app, agent, screen, browser }) => {
  await app.open('/');
  await screen.getByPlaceholder('e.g., Eldarin, Klingon, Dothraki...').fill('Quenya');

  await agent.act('open the language selector');
  await screen.getByRole('button', 'Delete draft Quenya').tap();

  const dialog = screen.getByRole('alertdialog');
  await expect(dialog).toContainText('Delete draft “Quenya”?');
  await dialog.getByRole('button', 'Delete').tap();

  await expect(screen.getByText('Draft deleted')).toBeVisible();
  const drafts = await browser.evaluate(() => localStorage.getItem('languageDrafts'));
  expect(drafts).not.toContain('Quenya');
});
