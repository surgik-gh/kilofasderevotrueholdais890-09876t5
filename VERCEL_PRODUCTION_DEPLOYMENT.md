# Vercel Production Deployment Guide

## Overview

This guide covers deploying the AILesson Platform with the complete gamification system to Vercel production.

## Prerequisites

- Vercel account with access to the project
- Supabase project with all migrations applied
- All environment variables ready
- Domain name (optional, for custom domain setup)

---

## Step 1: Production Environment Variables

### Required Environment Variables

Configure these in Vercel Dashboard → Settings → Environment Variables:

#### Supabase Configuration
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### Groq API Configuration (for AI features)
```
VITE_GROQ_API_KEY=your-groq-api-key
```

#### Robokassa Payment Configuration (optional)
```
VITE_ROBOKASSA_MERCHANT_LOGIN=your-merchant-login
VITE_ROBOKASSA_PASSWORD_1=your-password-1
VITE_ROBOKASSA_PASSWORD_2=your-password-2
VITE_ROBOKASSA_TEST_MODE=false
```

#### Cron Job Secret (for Vercel Cron Jobs)
```
CRON_SECRET=your-secure-random-secret
```

**Generate CRON_SECRET:**
```bash
# Use this command to generate a secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Setting Environment Variables in Vercel

1. Go to Vercel Dashboard
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable:
   - **Key**: Variable name (e.g., `VITE_SUPABASE_URL`)
   - **Value**: Variable value
   - **Environment**: Select **Production** (and optionally Preview/Development)
5. Click **Save**

---

## Step 2: Verify Vercel Configuration

### Check vercel.json

The `vercel.json` file should contain all cron job configurations:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-reset",
      "schedule": "0 18 * * *"
    },
    {
      "path": "/api/cron/biweekly-grants",
      "schedule": "0 0 */14 * *"
    },
    {
      "path": "/api/cron/daily-eligibility",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/reset-daily-quests",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/reset-weekly-quests",
      "schedule": "0 0 * * 1"
    },
    {
      "path": "/api/cron/check-streaks",
      "schedule": "0 0 * * *"
    }
  ],
  "env": {
    "CRON_SECRET": "@cron-secret"
  }
}
```

### Cron Job Schedule Explanation

| Cron Job | Schedule | Description |
|----------|----------|-------------|
| `daily-reset` | `0 18 * * *` | Daily at 6:00 PM - Reset leaderboard and award top 3 |
| `biweekly-grants` | `0 0 */14 * *` | Every 14 days at midnight - Grant tokens |
| `daily-eligibility` | `0 0 * * *` | Daily at midnight - Check eligibility |
| `reset-daily-quests` | `0 0 * * *` | Daily at midnight - Reset daily quests |
| `reset-weekly-quests` | `0 0 * * 1` | Every Monday at midnight - Reset weekly quests |
| `check-streaks` | `0 0 * * *` | Daily at midnight - Check and update streaks |

---

## Step 3: Custom Domain Setup (Optional)

### Add Custom Domain

1. Go to Vercel Dashboard → Your Project
2. Navigate to **Settings** → **Domains**
3. Click **Add Domain**
4. Enter your domain name (e.g., `ailesson.com` or `app.ailesson.com`)
5. Follow Vercel's DNS configuration instructions

### DNS Configuration

Add these DNS records at your domain registrar:

**For root domain (ailesson.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For subdomain (app.ailesson.com):**
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

### SSL Certificate

Vercel automatically provisions SSL certificates for all domains. Wait 1-2 minutes after DNS propagation.

---

## Step 4: Enable Vercel Cron Jobs

### Verify Cron Jobs are Enabled

1. Go to Vercel Dashboard → Your Project
2. Navigate to **Settings** → **Cron Jobs**
3. Verify all 6 cron jobs are listed and enabled:
   - ✅ `/api/cron/daily-reset`
   - ✅ `/api/cron/biweekly-grants`
   - ✅ `/api/cron/daily-eligibility`
   - ✅ `/api/cron/reset-daily-quests`
   - ✅ `/api/cron/reset-weekly-quests`
   - ✅ `/api/cron/check-streaks`

### Test Cron Jobs Manually

You can trigger cron jobs manually for testing:

```bash
# Replace with your production URL and CRON_SECRET
curl -X GET "https://your-app.vercel.app/api/cron/reset-daily-quests" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "message": "Daily quests reset completed",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Step 5: Deploy to Production

### Option A: Deploy via Git Push

1. Commit all changes:
```bash
git add .
git commit -m "Production deployment ready"
git push origin main
```

2. Vercel will automatically deploy from the `main` branch

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy to production:
```bash
vercel --prod
```

### Option C: Manual Deploy via Dashboard

1. Go to Vercel Dashboard → Your Project
2. Click **Deployments** tab
3. Click **Deploy** button
4. Select branch and click **Deploy**

---

## Step 6: Monitor Deployment Logs

### Real-time Deployment Monitoring

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click on the latest deployment
3. Monitor the build logs in real-time

### Check for Build Errors

Common issues to watch for:
- ❌ Missing environment variables
- ❌ TypeScript compilation errors
- ❌ Missing dependencies
- ❌ Build timeout (increase in settings if needed)

### Successful Deployment Indicators

- ✅ Build completed successfully
- ✅ All routes deployed
- ✅ Cron jobs registered
- ✅ Domain assigned (if configured)

---

## Step 7: Post-Deployment Verification

### Verify Application is Running

1. Visit your production URL: `https://your-app.vercel.app`
2. Check that the landing page loads correctly
3. Test user registration and login
4. Verify gamification features:
   - Achievements page loads
   - Quests page loads
   - Leaderboard displays correctly
   - Experience bar shows in profile

### Verify API Endpoints

Test key API endpoints:

```bash
# Test achievements endpoint
curl https://your-app.vercel.app/api/gamification/achievements

# Test quests endpoint
curl https://your-app.vercel.app/api/gamification/quests
```

### Verify Cron Jobs

1. Go to Vercel Dashboard → Your Project → **Cron Jobs**
2. Check **Last Run** timestamps
3. Click on each job to see execution logs
4. Verify no errors in recent runs

### Check Supabase Connection

1. Login to the application
2. Create a test lesson
3. Verify it appears in Supabase dashboard
4. Check that gamification triggers work:
   - Experience points awarded
   - Quest progress updated
   - Achievements checked

---

## Step 8: Performance Monitoring

### Vercel Analytics

1. Enable Vercel Analytics:
   - Go to **Analytics** tab in Vercel Dashboard
   - Enable Web Analytics
   - Enable Speed Insights

2. Monitor key metrics:
   - Page load times
   - Core Web Vitals (LCP, FID, CLS)
   - User traffic patterns

### Error Tracking

1. Go to **Logs** tab in Vercel Dashboard
2. Filter by:
   - Errors (500 status codes)
   - Warnings
   - Cron job failures

3. Set up alerts for critical errors

### Database Performance

1. Check Supabase Dashboard → **Database** → **Performance**
2. Monitor:
   - Query performance
   - Connection pool usage
   - Slow queries

---

## Troubleshooting

### Issue: Cron Jobs Not Running

**Solution:**
1. Verify `CRON_SECRET` is set in environment variables
2. Check cron job is enabled in Vercel Dashboard
3. Verify the schedule syntax is correct
4. Check function logs for errors

### Issue: Environment Variables Not Working

**Solution:**
1. Verify variables are set for **Production** environment
2. Redeploy after adding new variables
3. Check variable names match exactly (case-sensitive)
4. For `VITE_*` variables, ensure they're prefixed correctly

### Issue: Build Failures

**Solution:**
1. Check build logs for specific errors
2. Verify all dependencies are in `package.json`
3. Test build locally: `npm run build`
4. Check TypeScript errors: `npx tsc --noEmit`

### Issue: Database Connection Errors

**Solution:**
1. Verify Supabase URL and anon key are correct
2. Check Supabase project is active (not paused)
3. Verify RLS policies are configured correctly
4. Check network connectivity from Vercel to Supabase

### Issue: Slow Performance

**Solution:**
1. Enable Vercel Edge Caching
2. Optimize images and assets
3. Implement code splitting
4. Check database query performance
5. Add database indexes for frequently queried fields

---

## Rollback Procedure

If deployment fails or causes issues:

### Quick Rollback

1. Go to Vercel Dashboard → **Deployments**
2. Find the last working deployment
3. Click **⋯** (three dots) → **Promote to Production**
4. Confirm rollback

### Manual Rollback via CLI

```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

---

## Security Checklist

- [ ] All environment variables are set and secure
- [ ] `CRON_SECRET` is a strong random value
- [ ] Supabase RLS policies are enabled and tested
- [ ] API keys are not exposed in client code
- [ ] HTTPS is enforced (automatic with Vercel)
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled for API endpoints
- [ ] Sensitive data is not logged

---

## Maintenance Schedule

### Daily
- Monitor error logs
- Check cron job execution
- Review user feedback

### Weekly
- Review performance metrics
- Check database growth
- Update dependencies (if needed)

### Monthly
- Security audit
- Performance optimization
- Backup verification
- Cost analysis

---

## Support and Resources

### Vercel Documentation
- [Deployment Guide](https://vercel.com/docs/deployments/overview)
- [Environment Variables](https://vercel.com/docs/environment-variables)
- [Cron Jobs](https://vercel.com/docs/cron-jobs)

### Supabase Documentation
- [Database Management](https://supabase.com/docs/guides/database)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Project Documentation
- `README.md` - Project overview
- `GAMIFICATION_MIGRATION_GUIDE.md` - Gamification setup
- `INTEGRATION_TEST_GUIDE.md` - Testing guide

---

## Deployment Checklist

Use this checklist for each production deployment:

### Pre-Deployment
- [ ] All tests passing locally
- [ ] Database migrations applied to production Supabase
- [ ] Environment variables configured in Vercel
- [ ] `CRON_SECRET` generated and set
- [ ] Code reviewed and approved
- [ ] Changelog updated

### Deployment
- [ ] Code pushed to main branch (or deployed via CLI)
- [ ] Build completed successfully
- [ ] No errors in build logs
- [ ] All routes deployed correctly
- [ ] Cron jobs registered

### Post-Deployment
- [ ] Application loads correctly
- [ ] User authentication works
- [ ] Gamification features functional
- [ ] API endpoints responding
- [ ] Cron jobs executing on schedule
- [ ] No errors in production logs
- [ ] Performance metrics acceptable
- [ ] Custom domain working (if configured)

### Monitoring (First 24 Hours)
- [ ] Check error logs every 2 hours
- [ ] Monitor cron job executions
- [ ] Review user feedback
- [ ] Check database performance
- [ ] Verify all features working

---

## Success Criteria

Deployment is successful when:

✅ Application is accessible at production URL
✅ All pages load without errors
✅ User authentication works correctly
✅ Gamification features are functional
✅ All 6 cron jobs are running on schedule
✅ No critical errors in logs
✅ Database connections are stable
✅ Performance metrics are within acceptable ranges
✅ Custom domain is working (if configured)

---

## Next Steps After Deployment

1. **Announce Launch**: Notify users about new gamification features
2. **Monitor Closely**: Watch logs and metrics for first 48 hours
3. **Gather Feedback**: Collect user feedback on new features
4. **Optimize**: Make performance improvements based on real usage
5. **Plan Updates**: Schedule regular updates and improvements

---

**Deployment Date**: _________________
**Deployed By**: _________________
**Production URL**: _________________
**Custom Domain**: _________________
**Notes**: _________________

