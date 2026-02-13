# Branch Protection and Deployment Setup

## Overview
This document explains how to configure GitHub branch protection to avoid "Cannot update this protected ref" errors.

## Problem
The error "Cannot update this protected ref" occurs when:
1. GitHub Actions workflows try to push to protected branches without proper permissions
2. Automated deployment systems try to create tags or push commits to protected branches
3. Bots or integrations lack the necessary permissions

## Solution

### 1. GitHub Actions Workflows
We've created workflows with proper permissions:
- `.github/workflows/ci.yml` - Continuous Integration for all branches
- `.github/workflows/deploy.yml` - Deployment workflow for main branch

Both workflows include the necessary `permissions` configuration.

### 2. Branch Protection Settings
To configure branch protection for your repository:

#### For the `main` branch:
1. Go to repository Settings → Branches
2. Click "Add rule" or edit existing rule for `main`
3. Configure the following settings:

**Required:**
- ✅ Require a pull request before merging
- ✅ Require approvals: 1
- ✅ Require status checks to pass before merging
  - Select: `build-and-deploy` or `test` (from CI workflow)
- ✅ Require conversation resolution before merging

**Recommended:**
- ✅ Require branches to be up to date before merging
- ✅ Include administrators (optional, based on team size)

**Important - Allow GitHub Actions:**
- ✅ In the "Restrict who can push to matching branches" section:
  - Leave unchecked OR
  - Add `github-actions[bot]` to the allowed list

### 3. GitHub Actions Permissions
Ensure the repository has the following settings:

1. Go to Settings → Actions → General
2. Under "Workflow permissions":
   - Select "Read and write permissions"
   - ✅ Check "Allow GitHub Actions to create and approve pull requests"

### 4. Vercel/Deployment Integration
If using Vercel or other deployment platforms:

1. **Vercel Configuration** (`vercel.json` is provided):
   - Vercel will automatically deploy from the configured branch
   - No git operations are performed by Vercel on protected branches

2. **Deployment Branch:**
   - Configure Vercel to deploy from `main` branch only
   - Preview deployments will work from PR branches

### 5. Working with Protected Branches

#### Making Changes:
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit: `git commit -am "Your message"`
3. Push to GitHub: `git push origin feature/your-feature`
4. Create a Pull Request
5. After approval and CI passes, merge the PR

#### The workflow will:
- Run CI checks on your PR
- Build and test the code
- Deploy to production when merged to `main`

## Troubleshooting

### Error: "Cannot update this protected ref"
**Cause:** Trying to push directly to a protected branch

**Solution:**
- Use Pull Requests instead of direct pushes
- Ensure GitHub Actions has proper permissions (see above)
- Check that the workflow has the correct `permissions` in the YAML file

### Error: "Resource not accessible by integration"
**Cause:** GitHub Actions lacks permissions

**Solution:**
- Update workflow permissions in Settings → Actions → General
- Add `permissions:` block to workflow YAML files (already done)

### Error: "Refusing to allow a GitHub App to create or update workflow"
**Cause:** GitHub Actions trying to modify workflow files

**Solution:**
- Use a personal access token (PAT) for workflow modifications
- Or modify workflows manually through Pull Requests

## Files Created
- `.github/workflows/ci.yml` - CI workflow for all branches
- `.github/workflows/deploy.yml` - Deployment workflow for main branch  
- `vercel.json` - Vercel deployment configuration
- `BRANCH_PROTECTION_SETUP.md` - This documentation

## Next Steps
1. Configure branch protection rules in GitHub (see above)
2. Set up Vercel or your deployment platform
3. Create a feature branch and test the workflow
4. Merge via Pull Request to verify everything works

## Additional Resources
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Actions Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token)
- [Vercel Git Integration](https://vercel.com/docs/deployments/git)
