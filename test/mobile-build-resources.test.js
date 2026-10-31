import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('both Android splash variants reference a defined brand color', () => {
  const colors = read('android/app/src/main/res/values/colors.xml');
  for (const folder of ['drawable', 'drawable-v21']) {
    const splash = read(`android/app/src/main/res/${folder}/launch_background.xml`);
    const color = splash.match(/@color\/([\w_]+)/)?.[1];
    assert.ok(color, `${folder} defines a background color reference`);
    assert.ok(colors.includes(`name="${color}"`), `${folder}: ${color} exists`);
  }
});

test('iOS upload matches the Xcode app product name', () => {
  const project = read('ios/Runner.xcodeproj/project.pbxproj');
  const workflow = read('.github/workflows/ios.yml');
  const name = workflow.match(/path: build\/ios\/iphoneos\/([^\n]+)\.app/)?.[1];
  assert.ok(name, 'workflow uploads a device app');
  const products = [...project.matchAll(/PRODUCT_NAME = "?([^";]+)"?;/g)].map(match => match[1]);
  assert.ok(products.includes(name), 'Xcode produces the uploaded app');
});