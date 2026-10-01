import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('the editor opens on onboarding', async ({ app, screen }) => {
  await app.open('/');
  await expect(screen.getByRole('heading', 'Create Your Language')).toBeVisible();
});
