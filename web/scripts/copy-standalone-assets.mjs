// The standalone server (.next/standalone/server.js) does not include the CSS/JS in .next/static or the files in public/.
// Without them the page loads as plain unstyled HTML with a broken logo. Copy both next to the server after every build.
import { cpSync, existsSync } from 'node:fs';

const target = '.next/standalone';
if (existsSync(target)) {
  cpSync('.next/static', `${target}/.next/static`, { recursive: true });
  if (existsSync('public')) cpSync('public', `${target}/public`, { recursive: true });
  console.log('Copied .next/static and public into .next/standalone');
}
