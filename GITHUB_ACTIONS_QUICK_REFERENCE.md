# GitHub Actions Quick Reference

## Overview
This repository now includes GitHub Actions workflows to handle CI/CD with protected branches.

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)
**Triggers:** All branches on push and PRs to main
**Purpose:** Continuous Integration - validates code quality
**Steps:**
1. Checkout code
2. Setup Node.js 18
3. Install dependencies (`npm ci`)
4. Run linter (non-blocking)
5. Build the application

**Status:** ✅ Runs on every push to any branch

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)
**Triggers:** Pushes to main and PRs to main
**Purpose:** Build and prepare for deployment
**Steps:**
1. Checkout code with full history
2. Setup Node.js 18
3. Install dependencies (`npm ci`)
4. Build the application
5. Run linter (non-blocking)

**Status:** ✅ Runs when code reaches main branch

## Permissions
Both workflows follow the **principle of least privilege**:
- `contents: read` - Read repository contents
- `pull-requests: write` - Comment on PRs (CI only)

## How to Use

### Making Changes
1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "Your descriptive message"
   ```

3. Push to GitHub:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request on GitHub

5. The CI workflow will automatically:
   - ✅ Run linting
   - ✅ Build your code
   - ✅ Report status to PR

6. After approval, merge the PR

7. The Deploy workflow will:
   - ✅ Build the code for production
   - ✅ Prepare for deployment (manual or via Vercel)

### Viewing Workflow Status
- Go to the "Actions" tab in GitHub
- Click on any workflow run to see details
- Green checkmark = Success ✅
- Red X = Failure ❌

### Troubleshooting Workflow Failures

#### Build Failures
```bash
# Test locally first
npm ci
npm run build
```

#### Lint Failures
```bash
# Test locally
npm run lint
```
Note: Linting is non-blocking, so it won't fail the workflow

#### Permission Errors
- Check that branch protection is configured correctly
- Verify workflow permissions in Settings → Actions

## Protected Branches

### Current Setup
The workflows are designed to work with protected branches:
- ✅ `main` branch should be protected
- ✅ Require PR reviews before merging
- ✅ Require status checks (CI workflow) to pass

### Recommended Branch Protection Rules
1. Go to Settings → Branches
2. Add rule for `main`:
   - ✅ Require pull request reviews (1 approval)
   - ✅ Require status checks: `test` (from CI workflow)
   - ✅ Require conversation resolution
   - ✅ Require branches to be up to date

## Deployment

### Vercel Integration
The `vercel.json` file configures automatic deployments:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

Vercel will automatically:
1. Deploy preview builds for PRs
2. Deploy production builds when merged to `main`

### Manual Deployment
If deploying manually:
```bash
npm run build
# Deploy the `dist` folder to your hosting service
```

## Best Practices

### ✅ DO
- Create feature branches for all changes
- Write descriptive commit messages
- Wait for CI to pass before merging
- Review the build output in Actions

### ❌ DON'T
- Push directly to `main` (protected)
- Merge PRs with failing status checks
- Skip code review
- Ignore linting warnings (fix when possible)

## Workflow Files
- `.github/workflows/ci.yml` - Continuous Integration
- `.github/workflows/deploy.yml` - Deployment preparation
- `vercel.json` - Deployment configuration
- `BRANCH_PROTECTION_SETUP.md` - Detailed setup guide

## Need Help?
- Check `BRANCH_PROTECTION_SETUP.md` for detailed troubleshooting
- Review workflow logs in the Actions tab
- Ensure you have the latest code: `git pull origin main`
