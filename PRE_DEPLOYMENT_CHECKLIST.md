# Pre-Deployment Checklist

Use this checklist before deploying to Vercel production.

## 📋 Pre-Deployment Tasks

### 1. Code Quality
- [ ] All TypeScript errors resolved
- [ ] All tests passing (`npm run test:run`)
- [ ] No console errors in development
- [ ] Code reviewed and approved
- [ ] Git repository is clean (no uncommitted changes)

### 2. Database
- [ ] All migrations applied to production Supabase
- [ ] RLS policies tested and working
- [ ] Database indexes created
- [ ] Seed data populated (achievements, milestones)
- [ ] Backup of production database created

### 3. Environment Variables
- [ ] All required variables documented
- [ ] `CRON_SECRET` generated (use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] Supabase URL and keys ready
- [ ] Groq API key ready
- [ ] Payment credentials ready (if using)

### 4. Vercel Configuration
- [ ] `vercel.json` includes all 6 cron jobs
- [ ] Cron schedules are correct
- [ ] Build command is correct (`vite build`)
- [ ] Output directory is correct (`dist`)

### 5. API Endpoints
- [ ] All gamification endpoints exist in `/api/gamification/`
- [ ] All cron job files exist in `/api/cron/`
- [ ] Authentication middleware implemented
- [ ] Error handling implemented

### 6. Frontend
- [ ] All gamification pages working
- [ ] All components rendering correctly
- [ ] Mobile responsive design tested
- [ ] Loading states implemented
- [ ] Error states implemented

### 7. Testing
- [ ] Integration tests passing
- [ ] User flows tested manually
- [ ] Gamification features tested end-to-end
- [ ] Cron jobs tested locally

### 8. Documentation
- [ ] README.md updated
- [ ] Deployment guide created
- [ ] API documentation updated
- [ ] Changelog updated

## 🔍 Run Verification Script

Before deploying, run the verification script:

```bash
npm run verify:deployment
```

This will check:
- ✅ Environment variables
- ✅ Vercel configuration
- ✅ Cron job files
- ✅ API endpoints
- ✅ Database migrations
- ✅ Build configuration
- ✅ Documentation

## 🚀 Deployment Steps

### Step 1: Set Environment Variables in Vercel

Go to Vercel Dashboard → Settings → Environment Variables and add:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GROQ_API_KEY=your-groq-api-key
CRON_SECRET=your-generated-secret
```

### Step 2: Deploy

Choose one method:

**Option A: Git Push (Recommended)**
```bash
git add .
git commit -m "Production deployment"
git push origin main
```

**Option B: Vercel CLI**
```bash
vercel --prod
```

**Option C: Manual Deploy**
- Go to Vercel Dashboard
- Click "Deploy" button

### Step 3: Verify Deployment

After deployment:

1. **Check Build Logs**
   - Go to Vercel Dashboard → Deployments
   - Click on latest deployment
   - Verify no errors

2. **Test Application**
   - Visit production URL
   - Test login/registration
   - Test gamification features
   - Check all pages load

3. **Verify Cron Jobs**
   - Go to Vercel Dashboard → Cron Jobs
   - Verify all 6 jobs are listed
   - Check "Last Run" status

4. **Monitor Logs**
   - Go to Vercel Dashboard → Logs
   - Watch for errors in first hour

## 📊 Post-Deployment Monitoring

### First Hour
- [ ] Check error logs every 15 minutes
- [ ] Monitor user feedback
- [ ] Verify cron jobs execute

### First Day
- [ ] Check error logs every 2 hours
- [ ] Monitor performance metrics
- [ ] Verify all features working
- [ ] Check database performance

### First Week
- [ ] Daily log review
- [ ] Performance optimization
- [ ] User feedback collection
- [ ] Bug fixes as needed

## 🆘 Rollback Plan

If deployment fails:

1. **Quick Rollback**
   - Go to Vercel Dashboard → Deployments
   - Find last working deployment
   - Click "Promote to Production"

2. **Via CLI**
   ```bash
   vercel rollback
   ```

3. **Fix and Redeploy**
   - Fix the issue locally
   - Test thoroughly
   - Deploy again

## ✅ Success Criteria

Deployment is successful when:

- ✅ Application loads at production URL
- ✅ User authentication works
- ✅ All gamification features functional
- ✅ All 6 cron jobs running
- ✅ No critical errors in logs
- ✅ Performance metrics acceptable

## 📞 Support Contacts

- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Project Documentation**: See README.md

---

**Deployment Date**: _________________
**Deployed By**: _________________
**Checklist Completed**: ☐ Yes ☐ No
**Notes**: _________________

