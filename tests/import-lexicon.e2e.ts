import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

const exported = {
  name: 'Aqualia',
  seed: 12345,
  generator_version: '1.0.0',
  definition: {},
  lexicon: [
    { id: 'old-1', gloss: 'water', phonemicForm: '/aka/', orthographicForm: 'aka', tags: [] },
    { id: 'old-2', gloss: 'fire', phonemicForm: '/iki/', orthographicForm: 'iki', tags: [] },
  ],
};

test('importing a language file keeps its lexicon on the draft', async ({ app, screen, browser }) => {
  await app.open('/');
  await expect(screen.getByRole('heading', 'Create Your Language')).toBeVisible();

  // Import opens a detached file input; feed it the exported file instead of a native picker.
  await browser.evaluate((json) => {
    const click = HTMLInputElement.prototype.click;
    HTMLInputElement.prototype.click = function () {
      if (this.type !== 'file') return click.call(this);
      const files = new DataTransfer();
      files.items.add(new File([json], 'Aqualia.json', { type: 'application/json' }));
      this.files = files.files;
      this.dispatchEvent(new Event('change'));
    };
    return null;
  }, JSON.stringify(exported));

  await screen.getByRole('button', 'Import').tap();
  await expect(screen.getByText('2 lexicon entries will be added when you save this language.')).toBeVisible();
  await expect(screen.getByRole('button', 'Aqualia')).toBeVisible();

  const pending = await browser.evaluate(() => {
    const drafts = JSON.parse(localStorage.getItem('languageDrafts') ?? '[]');
    const draft = drafts.find((d: { name?: string }) => d.name === 'Aqualia');
    return draft?.pendingLexicon?.map((e: { gloss: string }) => e.gloss) ?? [];
  });
  expect(pending).toEqual(['water', 'fire']);
});
