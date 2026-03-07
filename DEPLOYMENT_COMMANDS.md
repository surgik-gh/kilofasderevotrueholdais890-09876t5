# Deployment Commands Reference

Quick reference for all deployment-related commands.

---

## 🔍 Pre-Deployment

### Verify Deployment Readiness
```bash
npm run verify:deployment
```
Checks: environment variables, configuration, files, dependencies

### Test Build Locally
```bash
npm run build
```
Ensures the production build works

### Run All Tests
```bash
npm run test:run
```
Verifies all tests pass

### Preview Production Build
```bash
npm run preview
```
Test the production build locally

---

## 🔐 Generate CRON_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and add to Vercel environment variables

---

## 🚀 Deployment

### Option 1: Git Push (Recommended)
```bash
git add .
git commit -m "Production deployment"
git push origin main
```
Vercel auto-deploys from main branch

### Option 2: Vercel CLI
```bash
# Install Vercel CLI (first time only)
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

### Option 3: Manual Deploy
Go to Vercel Dashboard → Click "Deploy" button

---

## 🧪 Test Cron Jobs

### Test Daily Quests Reset
```bash
curl -X GET "https://your-app.vercel.app/api/cron/reset-daily-quests" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Weekly Quests Reset
```bash
curl -X GET "https://your-app.vercel.app/api/cron/reset-weekly-quests" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Streak Check
```bash
curl -X GET "https://your-app.vercel.app/api/cron/check-streaks" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Daily Reset
```bash
curl -X GET "https://your-app.vercel.app/api/cron/daily-reset" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Biweekly Grants
```bash
curl -X GET "https://your-app.vercel.app/api/cron/biweekly-grants" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test Daily Eligibility
```bash
curl -X GET "https://your-app.vercel.app/api/cron/daily-eligibility" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 🔄 Rollback

### Via Vercel Dashboard
1. Go to Deployments tab
2. Find last working deployment
3. Click ⋯ → "Promote to Production"

### Via Vercel CLI
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

---

## 📊 Monitoring

### View Deployment Logs
```bash
vercel logs [deployment-url]
```

### View Production Logs
```bash
vercel logs --prod
```

### Follow Logs in Real-time
```bash
vercel logs --follow
```

---

## 🗄️ Database

### Run Gamification Migration
```bash
npm run migrate:gamification
```

### Verify Migration
```bash
npm run verify:gamification
```

---

## 🧹 Cleanup

### Clear Local Build
```bash
rm -rf dist
```

### Clear Node Modules (if needed)
```bash
rm -rf node_modules
npm install
```

### Clear Vercel Cache (via CLI)
```bash
vercel --force
```

---

## 📦 Dependencies

### Install Dependencies
```bash
npm install
```

### Update Dependencies
```bash
npm update
```

### Check for Outdated Packages
```bash
npm outdated
```

---

## 🔧 Development

### Start Dev Server
```bash
npm run dev
```

### Run Tests in Watch Mode
```bash
npm run test
```

### Run Tests with UI
```bash
npm run test:ui
```

---

## 📝 Git Commands

### Check Status
```bash
git status
```

### Add All Changes
```bash
git add .
```

### Commit Changes
```bash
git commit -m "Your message"
```

### Push to Main
```bash
git push origin main
```

### Create New Branch
```bash
git checkout -b feature-name
```

### Switch Branch
```bash
git checkout main
```

---

## 🌐 Environment Variables

### List Vercel Environment Variables (CLI)
```bash
vercel env ls
```

### Add Environment Variable (CLI)
```bash
vercel env add VARIABLE_NAME
```

### Remove Environment Variable (CLI)
```bash
vercel env rm VARIABLE_NAME
```

---

## 🔍 Debugging

### Check TypeScript Errors
```bash
npx tsc --noEmit
```

### Check for Linting Issues
```bash
npx eslint src
```

### View Package Info
```bash
npm list
```

### View Specific Package Version
```bash
npm list [package-name]
```

---

## 📱 Testing URLs

### Local Development
```
http://localhost:5173
```

### Local Production Preview
```
http://localhost:4173
```

### Vercel Preview (after push)
```
https://your-app-[hash].vercel.app
```

### Vercel Production
```
https://your-app.vercel.app
```

---

## 🆘 Quick Fixes

### Fix: Build Fails
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Fix: Tests Fail
```bash
# Run tests with verbose output
npm run test:run -- --reporter=verbose
```

### Fix: Deployment Stuck
```bash
# Force new deployment
vercel --force --prod
```

### Fix: Environment Variables Not Working
```bash
# Redeploy after adding variables
vercel --prod
```

---

## 📚 Documentation Commands

### View README
```bash
cat README.md
```

### View Deployment Guide
```bash
cat VERCEL_PRODUCTION_DEPLOYMENT.md
```

### View Quick Reference
```bash
cat DEPLOYMENT_QUICK_REFERENCE.md
```

---

## ✅ Verification Checklist Commands

Run these before deployment:

```bash
# 1. Verify deployment readiness
npm run verify:deployment

# 2. Run all tests
npm run test:run

# 3. Test build
npm run build

# 4. Preview build
npm run preview

# 5. Check TypeScript
npx tsc --noEmit

# 6. Check git status
git status
```

---

## 🎯 One-Command Deploy

```bash
npm run verify:deployment && npm run test:run && npm run build && git add . && git commit -m "Production deployment" && git push origin main
```

This command:
1. ✅ Verifies deployment readiness
2. ✅ Runs all tests
3. ✅ Tests production build
4. ✅ Commits changes
5. ✅ Pushes to main (triggers Vercel deploy)

---

## 📞 Help Commands

### Vercel Help
```bash
vercel --help
```

### NPM Help
```bash
npm help
```

### Git Help
```bash
git --help
```

---

**Quick Access**: Save this file for quick reference during deployment and maintenance.

