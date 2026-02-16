---
title: "TIL: Playwright step decorator for better test reporting"
description: "A TypeScript decorator that wraps page object methods with Playwright test steps — giving you clear, readable trace reports with parameter interpolation."
author: Yevhen Laichenkov
pubDatetime: 2026-02-16T12:00:00-05:00
slug: til-playwright-step-decorator
featured: false
draft: false
tags:
  - til
  - Playwright
  - TypeScript
---

If you use page objects in Playwright, your trace reports can quickly become a wall of low-level actions. You can fix this by wrapping methods with `test.step()`, but doing it manually everywhere is tedious.

Here's a `@step()` decorator that does it automatically:

<details>
<summary>Full implementation</summary>

```typescript
import { test } from "@playwright/test";

type Method<This, Args extends unknown[], Return> = (
  this: This,
  ...args: Args
) => Promise<Return>;

type MethodDecoratorContext<
  This,
  Args extends unknown[],
  Return,
> = ClassMethodDecoratorContext<This, Method<This, Args, Return>>;

function extractParams(fn: Function): string[] {
  const fnStr = fn.toString();
  const argsMatch = fnStr.match(/\(([^)]*)\)/);

  if (!argsMatch?.[1]) return [];

  return argsMatch[1]
    .split(",")
    .map(param => param.trim())
    .filter(Boolean)
    .map(param => param.replace(/=.*$/, "").trim())
    .map(param => param.replace(/^\.\.\./, "").trim());
}

function interpolateParams<Args extends unknown[]>(
  message: string,
  fn: Function,
  args: Args
): string {
  const paramNames = extractParams(fn);

  return message.replace(/\{\{(\w+)\}\}/g, (_, paramName) => {
    const index = paramNames.indexOf(paramName);
    if (index === -1 || index >= args.length) return `{{${paramName}}}`;

    const value = args[index];
    return typeof value === "object" ? JSON.stringify(value) : String(value);
  });
}

export function step<
  This extends { constructor: { name: string } },
  Args extends unknown[],
  Return,
>(message?: string) {
  return (
    value: Method<This, Args, Return>,
    context: MethodDecoratorContext<This, Args, Return>
  ) => {
    const target = value;
    const name = context.name ?? "unknown";

    function replacementMethod(
      this: This,
      ...args: Args
    ): Promise<Return> {
      const defaultName = `${this.constructor.name}.${String(name)}`;
      const stepName = message
        ? interpolateParams(message, target, args)
        : defaultName;

      return test.step(stepName, async () => {
        return await target.call(this, ...args);
      });
    }

    return replacementMethod as Method<This, Args, Return>;
  };
}
```

</details>

Now every method decorated with `@step()` shows up as a named step in Playwright traces and reports:

```typescript
class LoginPage {
  @step("Log in with {{username}}")
  async logIn(username: string, password: string) {
    await this.page.getByLabel("Username").fill(username);
    await this.page.getByLabel("Password").fill(password);
    await this.page.getByRole("button", { name: "Sign in" }).click();
  }

  @step() // defaults to ClassName.methodName (e.g. "LoginPage.navigateTo")
  async navigateTo() {
    await this.page.goto("/login");
  }
}
```

The `{{paramName}}` syntax uses the parameter names from the function signature, so `{{username}}` resolves to the actual value passed at runtime. This makes trace reports way more readable — instead of seeing a generic step name, you see `"Log in with john.doe"`.
