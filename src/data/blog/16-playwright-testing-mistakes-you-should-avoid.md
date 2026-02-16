---
title: 13 Playwright Testing Mistakes You Should Avoid
description: A practical guide to 13 Playwright mistakes that cause flaky, slow, and hard-to-maintain tests.
author: Yevhen Laichenkov
pubDatetime: 2026-02-14T10:00:00-05:00
slug: 13-playwright-testing-mistakes-you-should-avoid
featured: true
draft: false
tags:
  - Playwright
  - Testing
  - Automation
---

I keep seeing the same pattern: tests start flaking and the blame goes to data, CI, browsers, or infrastructure. Then the test gets 'fixed' with sleeps, forced actions that skip [actionability checks](https://playwright.dev/docs/actionability), and custom retry or wait helpers that reimplement what Playwright already provides. Sometimes deprecated APIs even make it into fresh code, which guarantees maintenance trouble later. In this article, I go through the most common mistakes I see in projects.

<details>
<summary>TL;DR</summary>

1. Every test needs assertions. If there are no checks, it's just a script.
2. Use [web-first assertions](https://playwright.dev/docs/test-assertions) instead of one-shot checks `isVisible`, `textContent`, `toBe`
3. Stop using sleeps like `waitForTimeout`.
4. Stop treating `networkidle` as “page is ready.”
5. Don't pre-wait before actions that already auto-wait `click`, `fill`, `check`
6. Don't try to solve UI issues with `{ force: true }`
7. For `waitForResponse`: listen first, trigger request second, await third
8. Don't write manual retry loops. Use `toPass` or [`expect.poll`](https://playwright.dev/docs/test-assertions#expectpoll)
9. When using `toPass`, keep inner assertion timeouts short
10. Stop using deprecated APIs and options `waitForNavigation`, `waitForSelector`
11. Make locators strict with `{ exact: true }`
12. Use `expect.poll` for specific polling scenarios, not basic DOM checks
13. Use `waitForFunction` only for truly custom conditions
14. Prefer positive assertions `toBeHidden` over negative ones `not.toBeVisible` when possible
15. Add [`eslint-plugin-playwright`](https://github.com/playwright-community/eslint-plugin-playwright) and catch bad patterns before they make it into your codebase
16. Keep page-object actions simple. Avoid returning new page objects from every action

</details>

Let's dive into each of these anti-patterns and how to fix them.

## 1. Forgetting assertions in tests

```ts
// ❌ Bad
test('should open the page', async ({ page }) => {
  await page.goto('/dashboard');
});
```

```ts
// ✅ Better
test('should open dashboard page and verify text', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('Dashboard')).toBeVisible();
});
```

A test without assertions is not really a test, it's just a script that performs actions without verifying any outcomes. Always make sure to include assertions in your tests to validate that the application is behaving as expected.

## 2. One-shot checks `.toBe` vs web-first assertions `.toBeVisible`, `.toHaveText`, etc.

```ts
// ❌ Bad
expect(await page.getByTestId('status').isVisible()).toBeTruthy();
expect(await page.getByTestId('name').textContent()).toBe('Alice');
expect(page.url()).toMatch(/\/dashboard$/);
expect(await page.locator('li').count()).toBe(5);
expect(await page.getByRole('button', { name: 'Submit' }).isEnabled()).toBe(true);
```

```ts
// ✅ Better
await expect(page.getByTestId('status')).toBeVisible();
await expect(page.getByTestId('name')).toHaveText('Alice');
await expect(page).toHaveURL(/\/dashboard$/);
await expect(page.locator('li')).toHaveCount(5);
await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
```

Web-first assertions retry until timeout. One-shot checks pass/fail based on timing luck. If you see `isVisible`, `textContent` with pair of `toBe` assertions in your tests it's a red flag that the test might be flaky and should be refactored to use web-first assertions instead.

## 3. Avoid using hardcoded timeouts with `waitForTimeout`

```ts
// ❌ Bad
await page.goto('/dashboard');
await page.waitForTimeout(5000); // Wait for dashboard to load
await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
```

```ts
// ✅ Better
await page.goto('/dashboard');
await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
```

But the page needs a moment to stabilize! Sure, but `waitForTimeout(5000)` doesn't actually check whether the page has stabilized. It just waits blindly and hopes. A web-first assertion like `.toBeVisible()` keeps checking until the element is truly there, which is both faster on a quick machine and safer on a slow one.

## 4. Avoid using `networkidle`

```ts
// ❌ Bad
await page.goto('/app', { waitUntil: 'networkidle' });
```

```ts
// ✅ Better
await page.goto('/app');
await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
```

`networkidle` is a brittle signal that can cause flakiness. It waits for no network connections for 500ms, which can happen too early (e.g. if the page has long-polling or WebSocket connections) or too late (e.g. if the page has a slow API call). Instead, wait for a user-visible state that indicates the page is ready, such as a heading, button, or other element that users interact with.

## 5. Waiting before actions that already auto-wait

```ts
// ❌ Bad
await page
  .getByRole('button', { name: 'Submit' })
  .waitFor({ state: 'visible' });
await page.getByRole('button', { name: 'Submit' }).click();
```

```ts
// ✅ Better
await page.getByRole('button', { name: 'Submit' }).click();
```

Almost all actions (e.g `click`, `fill`, `check` and many other) already wait for [actionability](https://playwright.dev/docs/actionability) and it will automatically retry until the element is ready not just visible. Yeah, it's not harmful and will not cause flakiness but it adds unnecessary code and slows down the suite. If you find this pattern in your codebase, just remove the extra wait and let Playwright do its job.

## 6. Avoid overusing `{ force: true }`

```ts
// ❌ Bad
await page.getByRole('button', { name: 'Delete' }).click({ force: true });
await page.locator('.email-input').fill('example@example.com', { force: true });
```

```ts
// ✅ Better
await page.getByRole('button', { name: 'Delete' }).click();
await page.locator('.email-input').fill('example@example.com');
```

If users cannot click it, your test should not force it either. Using `{ force: true }` can hide real issues with the page, such as elements being covered by others, not being visible, or not being enabled. If you find `{ force: true }` in your tests, check if it's really necessary or if it can be removed to make the test more reliable and closer to real user interactions.

## 7. Incorrect ordering of `waitForResponse` and the triggering action

```ts
// ❌ Bad
await page.waitForResponse((r) => r.url().includes('/api/data'));
await page.getByRole('button', { name: 'Load' }).click();

// also bad
await page.getByRole('button', { name: 'Load' }).click();
await page.waitForResponse((r) => r.url().includes('/api/data'));
```

```ts
// ✅ Better
// 1. Set up the listener first (no await)
const responsePromise = page.waitForResponse(
  (r) => r.url().includes('/api/data') && r.status() === 200,
);

// 2. Trigger the action second
await page.getByRole('button', { name: 'Load' }).click();

// 3. Await the response third
await responsePromise;
```

I know, I know many people are scared of missing an await, but this is one place where that habit backfires. You need to set up the listener first (no await), trigger the action second, then await the response third.

## 8. Avoid writing custom retry loops instead of using `toPass` or `expect.poll`

```ts
// ❌ Bad
let retries = 5;

while (retries > 0) {
  const state = await page.getByTestId('total').textContent();
  const value = parseInt(state || '0', 10);
  if (value === 100) {
    expect(value).toBe(100);
    break;
  }
  retries--;
  await page.waitForTimeout(1000);
}
```

```ts
// ✅ Better

// Using `toPass`
await expect(async () => {
  const state = await page.getByTestId('total').textContent({ timeout: 1_000 }); // Short timeout for the inner assertion
  const value = parseInt(state || '0', 10);
  expect(value).toBe(100);
}).toPass({ timeout: 30_000, interval: [500, 1_000] });

// Using `expect.poll`
await expect.poll(async () => {
  const state = await page.getByTestId('total').textContent({ timeout: 1_000 }); // Short timeout for the inner assertion
  const value = parseInt(state || '0', 10);

  return value;
}).toBe(100, { timeout: 30_000, interval: [500, 1_000] });
```

`toPass` and `expect.poll` are safer and easier to reason about than custom retry loops. They handle timing, retries, and timeouts in a consistent way, and they integrate well with Playwright's built-in waiting mechanisms. If you see custom retry loops in your tests, consider refactoring them to use `toPass` or `expect.poll` for better reliability and readability.

## 9. Short inner timeouts inside `toPass` and `expect.poll`

```ts
// ❌ Bad
await expect(async () => {
  // some actions here
  // ...
  await expect(page.getByTestId('status')).toHaveText('Ready');
}).toPass({ timeout: 30_000 });
```

```ts
// ✅ Better
await expect(async () => {
  // some actions here
  // ...
  await expect(page.getByTestId('status')).toHaveText('Ready', {
    timeout: 1_000, // Short timeout for the inner assertion
  });
}).toPass({ timeout: 30_000 });
```

When using `toPass`, it's important to set short timeouts for the inner assertions. Otherwise, if the inner assertion has a long default timeout (e.g. 30 seconds), it can cause the test to wait unnecessarily long before retrying, which can make the test suite slower and less responsive to failures. Setting a short timeout for the inner assertion allows `toPass` to retry more quickly and fail faster when the condition is not met.

## 10. Avoid using deprecated APIs and options

```ts
// ❌ Bad
await Promise.all([
  page.waitForNavigation(), // Waiting for navigation after clicking a link
  page.getByRole('link', { name: 'Profile' }).click(),
]);
```

```ts
// ✅ Better
await page.getByRole('link', { name: 'Profile' }).click();
await page.waitForURL('**/profile');
```

`waitForNavigation` is deprecated because it can miss navigations triggered by non-click actions (e.g. `window.location` changes) and it doesn't work well with single-page applications. Use `waitForURL` or web-first assertions instead to wait for the expected state after the action.

## 11. Strict locators with `{ exact: true }`

```ts
// ❌ Bad
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByText('Submit').click();
```

```ts
// ✅ Better
await page.getByRole('button', { name: 'Submit', exact: true }).click();
await page.getByText('Submit', { exact: true }).click();
```

It's really important to make locators strict even if you think that there is only one element that matches. If there are multiple elements that match the locator, Playwright will throw an error and fail the test. This can lead to flakiness if the page structure changes or if there are dynamic elements that can appear or disappear. By adding `{ exact: true }`, you ensure that the locator matches exactly what you expect and reduces the chances of flakiness due to ambiguous locators.

## 12. Avoid using `expect.poll` for simple DOM checks

```ts
// ❌ Bad
await expect.poll(() => page.getByTestId('counter').textContent()).toBe('10');
```

```ts
// ✅ Better
await expect(page.getByTestId('counter')).toHaveText('10');
```

`expect.poll` is useful for polling, yeah you still can use it for DOM elements but only when it's necessary. In most cases web-first assertions like `toHaveText`, `toBeVisible`, etc. are more concise and reliable. If you see `expect.poll` being used to check DOM state that can be done with web-first assertions, consider refactoring it to use web-first assertions instead.

## 13. Avoid using `waitForFunction` for simple UI assertions

```ts
// ❌ Bad
await page.waitForFunction(
  (selector) => document.querySelector('.status')?.textContent === 'Ready',
);
```

```ts
// ✅ Better
await expect(page.locator('.status')).toHaveText('Ready');
```

`waitForFunction` is a powerful tool for waiting on complex conditions, but it's often overused for simple UI assertions that can be expressed with web-first assertions. If you see `waitForFunction` in your tests, check if it can be refactored to use `expect` and locators instead for better readability and reliability.

## 14. Using `.not` negative assertions when a positive one is available

```ts
// ❌ Bad
await expect(page.getByRole('button', { name: 'Submit' })).not.toBeVisible();
```

```ts
// ✅ Better
await expect(page.getByRole('button', { name: 'Submit' })).toBeHidden();
```

Using `.not` can make test less readable and can lead to confusion. If there is a positive assertion available (like `toBeHidden`), it's usually clearer to use it instead of negating a positive assertion.

## 15. Ignoring `eslint-plugin-playwright`

If you don't have `eslint-plugin-playwright` set up in your project, you're missing out on a powerful tool that can catch many of these anti-patterns before they even make it into your codebase. This plugin provides linting rules specifically designed for Playwright tests, helping you enforce best practices and avoid common mistakes.

It's super easy to include it in your project:

```bash
npm install -D eslint-plugin-playwright
```

```js
// eslint.config.mjs
import playwright from "eslint-plugin-playwright";

export default [
  {
    ...playwright.configs["flat/recommended"],
    files: ["tests/**"],
  },
];
```

Many of the mistakes mentioned in this article can be automatically detected and prevented with the right linting rules. If you find that your test suite has some of these anti-patterns, consider adding `eslint-plugin-playwright` to catch them in the future and maintain a healthier codebase.

## 16. Returning new page objects from action methods

```ts
// ❌ Bad
async login(user: string, pass: string): Promise<DashboardPage> {
  await this.page.getByLabel('Username').fill(user);
  await this.page.getByLabel('Password').fill(pass);
  await this.page.getByRole('button', { name: 'Sign in' }).click();
  return new DashboardPage(this.page);
}
```

```ts
// ✅ Better
async login(user: string, pass: string): Promise<void> {
  await this.page.getByLabel('Username').fill(user);
  await this.page.getByLabel('Password').fill(pass);
  await this.page.getByRole('button', { name: 'Sign in' }).click();
}
```

Well, it's not a mistake tbh, but returning new page objects from action methods can lead to unnecessary complexity and maintenance overhead. It can create tight coupling between page objects and make it harder to reuse them across different tests. Instead, let the test itself decide which page object to use after the action is performed, based on the expected state of the application.

## Final thoughts

Good Playwright tests are usually the simple ones.
Assert what users see, trust built-in waiting, and avoid custom timing hacks.
Do that consistently, and your tests get faster, more stable, and easier to maintain. Thank you for reading, and happy testing!
