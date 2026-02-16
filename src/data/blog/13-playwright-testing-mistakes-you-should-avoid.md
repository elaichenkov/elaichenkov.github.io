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

I’ve seen teams blame CI, browsers, and infra when tests start flaking, but the root cause is usually simpler: we add manual waits, force actions, and custom retries where Playwright already has better built-in behavior. This list covers the 13 red flags I see most often and the patterns that make suites stable again.

## TL;DR

These are the first red flags I look for in a flaky Playwright test suite.

1. `waitForTimeout` in tests
2. `networkidle` as a readiness signal
3. non-web-first assertions
4. `{ force: true }` clicks
5. custom retry loops
6. deprecated Playwright APIs

## 1. Using hardcoded timeouts

```ts
// ❌ Bad
await page.goto("/dashboard");
await page.waitForTimeout(5000); // Wait for dashboard to load
await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
```

```ts
// ✅ Better
await page.goto("/dashboard");
await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
```

Hardcoded waits are guesswork. They either slow the suite down or still fail under load.

## 2. Waiting before actions that already auto-wait

```ts
// ❌ Bad
await page
  .getByRole("button", { name: "Submit" })
  .waitFor({ state: "visible" });
await page.getByRole("button", { name: "Submit" }).click();
```

```ts
// ✅ Better
await page.getByRole("button", { name: "Submit" }).click();
```

`click`, `fill`, `check`, and similar actions already wait for actionability.

## 3. Using one-shot assertions for UI state

```ts
// ❌ Bad
expect(await page.getByTestId("status").isVisible()).toBeTruthy();
expect(await page.getByTestId("name").textContent()).toBe("Alice");
```

```ts
// ✅ Better
await expect(page.getByTestId("status")).toBeVisible();
await expect(page.getByTestId("name")).toHaveText("Alice");
```

Web-first assertions retry until timeout. One-shot checks fail on timing jitter.

## 4. Using `waitUntil: "networkidle"`

```ts
// ❌ Bad
await page.goto("/app", { waitUntil: "networkidle" });
```

```ts
// ✅ Better
await page.goto("/app");
await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
```

Network silence is a weak proxy for readiness, especially with analytics, polling, and sockets.

## 5. Awaiting `waitForResponse` at the wrong moment

```ts
// ❌ Bad
await page.waitForResponse((r) => r.url().includes("/api/data"));
await page.getByRole("button", { name: "Load" }).click();
```

```ts
// ✅ Better
const responsePromise = page.waitForResponse(
  (r) => r.url().includes("/api/data") && r.status() === 200,
);
await page.getByRole("button", { name: "Load" }).click();
await responsePromise;
```

Set the listener first, trigger action second, await third.

## 6. Keeping deprecated APIs in new code

```ts
// ❌ Bad
await Promise.all([
  page.waitForNavigation(),
  page.getByRole("link", { name: "Profile" }).click(),
]);
await page.waitForSelector(".loading", { state: "hidden" });
```

```ts
// ✅ Better
await page.getByRole("link", { name: "Profile" }).click();
await page.waitForURL("**/profile");
await page.locator(".loading").waitFor({ state: "hidden" });
```

Prefer locator and URL-first APIs. They are clearer and easier to maintain.

## 7. Using `waitForFunction` for simple UI assertions

```ts
// ❌ Bad
await page.waitForFunction(
  (selector) => document.querySelector(selector)?.textContent === "Ready",
  ".status",
);
```

```ts
// ✅ Better
await expect(page.locator(".status")).toHaveText("Ready");
```

Use `waitForFunction` only when built-in assertions cannot express the condition.

## 8. Using `expect.poll` for DOM checks

```ts
// ❌ Bad
await expect.poll(() => page.getByTestId("counter").textContent()).toBe("10");
```

```ts
// ✅ Better
await expect(page.getByTestId("counter")).toHaveText("10");
```

`expect.poll` is best for values outside the page DOM (API, jobs, databases).

## 9. Overusing `{ force: true }`

```ts
// ❌ Bad
await page.getByRole("button", { name: "Delete" }).click({ force: true });
```

```ts
// ✅ Better
await page.getByRole("button", { name: "Close modal" }).click();
await page.getByRole("button", { name: "Delete" }).click();
```

If a real user cannot click it, your test should not force it either.

## 10. Writing manual retry loops

```ts
// ❌ Bad
let retries = 5;
while (retries > 0) {
  const state = await page.getByTestId("status").textContent();
  if (state === "Done") break;
  retries -= 1;
  await page.waitForTimeout(1000);
}
```

```ts
// ✅ Better
await expect(async () => {
  const res = await page.request.get("/api/status");
  expect(res.status()).toBe(200);
  expect((await res.json()).state).toBe("done");
}).toPass({ timeout: 30_000 });
```

`toPass` and `expect.poll` are safer and easier to reason about.

## 11. Forgetting short inner timeouts inside `toPass`

```ts
// ❌ Bad
await expect(async () => {
  await expect(page.getByTestId("status")).toHaveText("Ready");
}).toPass({ timeout: 60_000 });
```

```ts
// ✅ Better
await expect(async () => {
  await expect(page.getByTestId("status")).toHaveText("Ready", {
    timeout: 2_000,
  });
}).toPass({ timeout: 60_000 });
```

Fast-failing inner checks allow many retry attempts inside the outer timeout budget.

## 12. Returning new page objects from action methods

```ts
// ❌ Bad
async login(user: string, pass: string): Promise<DashboardPage> {
  await this.page.getByLabel("Username").fill(user);
  await this.page.getByLabel("Password").fill(pass);
  await this.page.getByRole("button", { name: "Sign in" }).click();
  return new DashboardPage(this.page);
}
```

```ts
// ✅ Better
async login(user: string, pass: string): Promise<void> {
  await this.page.getByLabel("Username").fill(user);
  await this.page.getByLabel("Password").fill(pass);
  await this.page.getByRole("button", { name: "Sign in" }).click();
}
```

Keep action methods focused. Let tests decide what object to create next.

## 13. Not using `eslint-plugin-playwright`

```ts
// ❌ Bad — no Playwright lint rules, so flaky patterns slip into PRs
```

```bash
# ✅ Better
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

Key rules worth enforcing: `no-wait-for-timeout`, `no-networkidle`, `no-force-option`, and `prefer-web-first-assertions`.

## Final thoughts

Reliable Playwright tests are usually simpler tests.

- Wait for user-visible state, not arbitrary time.
- Use locators and web-first assertions by default.
- Use built-in retries instead of handwritten loops.
- Let lint rules prevent known anti-patterns.

The result is faster CI, fewer flaky reruns, and easier maintenance.
