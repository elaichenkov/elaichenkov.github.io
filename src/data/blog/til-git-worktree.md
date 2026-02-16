---
title: "TIL: git worktree lets you work on multiple branches at once"
description: "You can use git worktree to check out multiple branches simultaneously in separate directories — no more stashing or committing WIP."
author: Yevhen Laichenkov
pubDatetime: 2026-02-16T10:00:00-05:00
slug: til-git-worktree
featured: false
draft: false
tags:
  - til
  - git
  - ai
---

Today I learned that `git worktree` lets you check out multiple branches at the same time, each in its own directory. No more stashing or committing half-done work just to switch branches.

```bash
# Create a new worktree for a branch
git worktree add ../my-feature feature-branch

# List all worktrees
git worktree list

# Remove a worktree when done
git worktree remove ../my-feature
```

Each worktree is a real working directory linked to the same repo. Changes, commits, and history are all shared:

```
my-project/                    ← main worktree (main branch)
├── src/
├── .git/
│   └── worktrees/
│       ├── feature-auth/      ← linked worktree metadata
│       └── feature-api/       ← linked worktree metadata
│
├── ../feature-auth/           ← worktree directory (feature/auth branch)
│   └── src/
│
└── ../feature-api/            ← worktree directory (feature/api branch)
    └── src/
```

This is especially useful when working with LLM-powered coding agents across multiple sessions. Instead of juggling branches in one directory and constantly losing context, you can spin up a separate worktree per feature and point each AI session at its own directory. Each session stays focused on its own branch with no stash conflicts, no WIP commits, and no context bleeding between features.

Super handy when you need to review a PR while working on something else, or run tests on a different branch without losing your current state.
