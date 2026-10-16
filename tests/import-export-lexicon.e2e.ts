import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('importing a language file restores the lexicon', async ({ app, agent, screen }) => {
  await app.open('/');
  await expect(screen.getByRole('heading', 'Create Your Language')).toBeVisible();

  // Create and authenticate
  await screen.getByRole('button', 'Create Account').tap();
  await agent.act('enter email {email} and submit', {
    params: { email: `test-lexicon-${Date.now()}@example.com` },
  });
  await agent.assert('magic link sent message is visible');
  
  // Use the magic link from logs/email to authenticate
  await agent.act('find the magic link in the most recent email and click it');
  await agent.assert('signed in successfully');

  // Create a language with lexicon entries
  await agent.act('create a new language named {name} with quick start', {
    params: { name: 'TestLang' },
  });
  await expect(screen.getByLabel('Language name')).toHaveValue('TestLang');

  // Save the language first
  await screen.getByRole('button', 'Save').tap();
  await agent.assert('language saved successfully');

  // Navigate to lexicon tab and add entries
  await agent.act('open the Lexicon tab');
  await agent.act('add a new lexicon entry with gloss "water", phonemic form "/aka/" and orthographic form "aka"');
  await agent.act('add a new lexicon entry with gloss "fire", phonemic form "/iki/" and orthographic form "iki"');
  
  await agent.assert('the lexicon shows 2 entries');

  // Export the language
  await screen.getByRole('button', 'Export').tap();
  await agent.assert('language file downloaded');

  // Create a new language to clear the state
  await agent.act('create a new language');

  // Import the previously exported file
  await screen.getByRole('button', 'Import').tap();
  await agent.act('select the most recently downloaded JSON file');
  
  // Verify the imported language has the correct name
  await agent.assert('the language name contains "TestLang"');

  // Save the imported language
  await screen.getByRole('button', 'Save').tap();
  await agent.assert('language saved successfully');

  // Navigate to lexicon and verify entries were restored
  await agent.act('open the Lexicon tab');
  await agent.assert('the lexicon contains an entry for "water" with phonemic form "/aka/"');
  await agent.assert('the lexicon contains an entry for "fire" with phonemic form "/iki/"');
  await agent.assert('the lexicon shows 2 entries');
});
