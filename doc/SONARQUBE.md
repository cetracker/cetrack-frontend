# SonarQube/SonarScanner Setup Guide

This document explains how to set up and run SonarQube code analysis locally for the CETracker v2 frontend.

## Overview

SonarQube analysis helps identify code quality issues, including:
- Unused variables and imports
- Code complexity violations
- Potential bugs and security issues
- Cognitive complexity in deeply nested logic
- Missing error handling patterns

## Prerequisites

### Option A: Using SonarCloud (Recommended for GitHub-based projects)

SonarCloud is a cloud-based solution that integrates with GitHub:

1. Go to https://sonarcloud.io
2. Sign in with your GitHub account
3. Create an organization
4. Add your CETracker repository
5. Generate a project token from your account settings

### Option B: Using Local SonarQube Server

For a self-hosted instance, install SonarQube:

```bash
# Docker (simplest way)
docker run -d --name sonarqube -p 9000:9000 sonarqube:latest

# Then access at http://localhost:9000
# Default login: admin / admin
```

## Local Analysis Setup

### 1. Install Dependencies

The scanner is already included in `package.json` as a dev dependency. Install it:

```bash
npm install
```

This installs `sonar-scanner`, which runs the analysis without needing a full SonarQube server.

### 2. Configure Authentication

Set your SonarQube server URL and authentication token via environment variables:

```bash
# For local SonarQube server
export SONAR_HOST_URL=http://localhost:9000
export SONAR_LOGIN=your_generated_token

# For SonarCloud
export SONAR_HOST_URL=https://sonarcloud.io
export SONAR_LOGIN=your_sonarcloud_token
export SONAR_ORGANIZATION=your_github_org
```

Or create a `.env.sonar` file (don't commit this):

```env
SONAR_HOST_URL=http://localhost:9000
SONAR_LOGIN=your_token
```

Then load it before running:

```bash
source .env.sonar
npm run sonar
```

### 3. Run Local Analysis

Run the SonarQube scanner:

```bash
npm run sonar
```

This will:
1. Analyze all TypeScript/TSX files in `src/`
2. Send results to your configured SonarQube server
3. Display a summary in the console

### 4. View Results

- **SonarCloud**: Log in to https://sonarcloud.io and view your project
- **Local SonarQube**: Open http://localhost:9000 and navigate to your project

## Integration with CI/CD

### GitHub Actions

Add to `.github/workflows/build-with-node.yml`:

```yaml
- name: Run SonarQube Analysis
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  run: npm run sonar
  env:
    SONAR_HOST_URL: https://sonarcloud.io
    SONAR_LOGIN: ${{ secrets.SONAR_TOKEN }}
    SONAR_ORGANIZATION: your_org_key
```

Then add `SONAR_TOKEN` as a secret in your GitHub repository settings.

## Build-Time Analysis

To include SonarQube scanning as part of the build process:

```bash
npm run build
```

This runs type-check, build, and can be extended to include sonar scanning.

## Common Issues & Solutions

### Issue: "Could not find sonar-scanner"

**Solution**: Ensure dependencies are installed:
```bash
npm install
npx sonar-scanner --version
```

### Issue: "403 Unauthorized"

**Solution**: Check your authentication token:
```bash
echo $SONAR_LOGIN
# Verify token is valid in your SonarQube/SonarCloud settings
```

### Issue: "No such file or directory: /path/to/.scannerwork"

**Solution**: This is expected on first run. The scanner creates this directory automatically.

### Issue: Analysis takes too long

**Solution**: Ensure `.scannerwork` directory is in `.gitignore` and excluded from analysis.

## Fixing SonarQube Issues

Common issues and their fixes:

### 1. Unused Variables

If ESLint reports unused variables, SonarQube will too. Pattern:
```typescript
// ❌ Before
const handleChange = (e: Event, _unusedParam) => {
  console.log(e)
}

// ✅ After (use parameter prefix)
const handleChange = (e: Event, ignoredParam: unknown) => {
  console.log(e, ignoredParam) // Use it, or remove if truly unused
}
```

### 2. Cognitive Complexity

Deeply nested conditionals increase cognitive complexity. Refactor:
```typescript
// ❌ Before: High complexity
if (a) {
  if (b) {
    if (c) {
      doSomething()
    }
  }
}

// ✅ After: Flattened with early returns
if (!a || !b || !c) return
doSomething()
```

### 3. Missing Error Handling

Always handle async/promise rejections:
```typescript
// ❌ Before
const data = await fetchData()

// ✅ After
try {
  const data = await fetchData()
} catch (error) {
  notify('Failed to load data', 'error')
}
```

## Updating Sonar Configuration

Edit `sonar-project.properties` to:
- Exclude additional directories
- Configure code coverage paths
- Change project metadata

Common exclusions:
```properties
sonar.exclusions=**/node_modules/**,**/dist/**,**/*.d.ts
```

## Resources

- **SonarQube Docs**: https://docs.sonarqube.org/
- **SonarCloud**: https://sonarcloud.io
- **TypeScript Analysis**: https://docs.sonarqube.org/latest/analysis/languages/typescript/
- **Rules Reference**: https://rules.sonarsource.com/

## Support

For issues or questions:
1. Check the SonarQube/SonarCloud documentation
2. Review the analysis report in the web UI
3. Consult the `.scannerwork/report-task.txt` file for detailed logs

