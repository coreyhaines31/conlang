import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('requesting a magic link keeps the confirmation on screen', async ({ app, screen, browser }) => {
  await browser.route('**/api/auth/sign-in/magic-link', (route) => route.fulfill({ json: { status: true } }));
  await app.open('/');
  // A page reload would wipe this marker.
  await browser.evaluate(() => ((window as unknown as { e2eMarker: boolean }).e2eMarker = true));

  await screen.getByRole('button', 'Create Account').tap();
  await screen.getByLabel('Email').fill('ada@example.test');
  await screen.getByRole('button', 'Send Magic Link').tap();

  await expect(screen.getByRole('status')).toHaveText('Check your email for the login link!');
  const marker = await browser.evaluate(() => (window as unknown as { e2eMarker?: boolean }).e2eMarker ?? false);
  expect(marker).toBe(true);
});
