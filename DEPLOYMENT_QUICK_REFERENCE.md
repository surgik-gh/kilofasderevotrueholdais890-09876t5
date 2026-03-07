# Deployment Quick Reference Card

## 🚀 Quick Deploy (5 Minutes)

### 1. Generate CRON_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output.

### 2. Set Environment Variables in Vercel
Go to: **Vercel Dashboard → Settings → Environment Variables**

Add these (select "Production"):
```
VITE_SUPABASE_URL=https://pnhmrddjsoyatqwvkgvr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuaG1yZGRqc295YXRxd3ZrZ3ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNTQzMDgsImV4cCI6MjA4MzgzMDMwOH0.GRYvyLacVgoyVjFXFgaZoACS_VaE6dbz86cJP89eGug
VITE_GROQ_API_KEY=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
CRON_SECRET=[paste generated secret from step 1]
```

### 3. Deploy
```bash
git add .
git commit -m "Production deployment"
git push origin main
```

### 4. Verify
1. Visit your Vercel URL
2. Test login
3. Check **Vercel Dashboard → Cron Jobs**

---

## 📋 Pre-Deploy Checklist

- [ ] Run `npm run verify:deployment`
- [ ] All tests passing
- [ ] Database migrations applied to production Supabase
- [ ] Environment variables ready
- [ ] CRON_SECRET generated

---

## 🔧 Vercel Dashboard Tasks

### After First Deployment

1. **Enable Cron Jobs**
   - Go to: Settings → Cron Jobs
   - Verify all 6 jobs are listed and enabled

2. **Check Logs**
   - Go to: Logs tab
   - Monitor for errors

3. **Test Cron Jobs** (Optional)
   ```bash
   curl -X GET "https://your-app.vercel.app/api/cron/reset-daily-quests" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

---

## 🎯 6 Cron Jobs to Verify

- [ ] `/api/cron/daily-reset` - 6:00 PM daily
- [ ] `/api/cron/biweekly-grants` - Every 14 days
- [ ] `/api/cron/daily-eligibility` - Midnight daily
- [ ] `/api/cron/reset-daily-quests` - Midnight daily
- [ ] `/api/cron/reset-weekly-quests` - Monday midnight
- [ ] `/api/cron/check-streaks` - Midnight daily

---

## 🆘 Quick Troubleshooting

### Build Fails
```bash
# Test locally first
npm run build
```

### Cron Jobs Not Running
1. Check CRON_SECRET is set
2. Verify jobs are enabled in Dashboard
3. Check execution logs

### Environment Variables Not Working
1. Verify set for "Production" environment
2. Redeploy after adding variables

### Database Errors
1. Check Supabase project is active
2. Verify URL and key are correct
3. Test connection in Supabase Dashboard

---

## 🔄 Rollback

If something goes wrong:

1. Go to: **Vercel Dashboard → Deployments**
2. Find last working deployment
3. Click **⋯** → **Promote to Production**

---

## 📚 Full Documentation

- `VERCEL_PRODUCTION_DEPLOYMENT.md` - Complete guide
- `PRE_DEPLOYMENT_CHECKLIST.md` - Detailed checklist
- `DEPLOYMENT_SUMMARY.md` - Task completion summary

---

## ✅ Success Indicators

After deployment, verify:
- ✅ App loads at production URL
- ✅ Login works
- ✅ Gamification features work
- ✅ All 6 cron jobs show "Last Run" time
- ✅ No errors in logs

---

## 📞 Need Help?

1. Check `VERCEL_PRODUCTION_DEPLOYMENT.md` for detailed guide
2. Review error logs in Vercel Dashboard
3. Check Supabase Dashboard for database issues
4. Consult troubleshooting section in deployment guide

