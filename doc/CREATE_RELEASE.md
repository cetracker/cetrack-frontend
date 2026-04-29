# NPM Release Command

The built-in `npm version` can be used.
It updates `version` in `package.json` (and `package-lock.json`),
creates a git commit, and tags it.

## Usage

```bash
npm version 2.0.3 -m "Release v%s"
```

This will:
1. Update `package.json` version to `2.0.3`
2. Git commit with message `Release v2.0.3`
3. Create git tag `v2.0.3`

You can also use semver keywords:
 - `npm version patch` (2.0.2 → 2.0.3),
 - `npm version minor` (2.0.2 → 2.1.0),
 - `npm version major` (2.0.2 → 3.0.0).
