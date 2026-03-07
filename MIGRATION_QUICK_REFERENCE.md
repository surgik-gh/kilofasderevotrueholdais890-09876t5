# Gamification Migration - Quick Reference

## Quick Commands

```bash
# Install dependencies (first time only)
npm install

# Run migration
npm run migrate:gamification

# Verify migration
npm run verify:gamification
```

## What Gets Created

For each user:
- 1 user_levels record (Level 1, 0 XP)
- 27 user_achievements records (all locked)
- 4 streaks records (all at 0)
- 23 user_milestones records (all not achieved)

## Safety Features

✅ Idempotent - Run multiple times safely  
✅ Error handling - Errors don't stop migration  
✅ Detailed logging - See exactly what happens  
✅ Verification - Confirm results automatically  

## Expected Output

### Migration Success
```
✅ Found N users
✅ Found 27 achievements
✅ Found 23 milestones
✅ Created N user levels
✅ Created N×27 user achievements
✅ Created N×4 user streaks
✅ Created N×23 user milestones
```

### Verification Success
```
✅ All N users have level records
✅ All users have achievement records
✅ All users have streak records
✅ All users have milestone records
✅ All data has correct initial values
Summary: 9/9 checks passed
```

## Troubleshooting

### No users found
- Normal if database is empty
- Users will get gamification data on registration

### Permission denied
- Check Supabase credentials in .env
- Verify RLS policies allow operations

### Some records already exist
- Normal - script skips existing records
- Just re-run to complete migration

## Files

- `scripts/migrate-gamification-data.ts` - Migration script
- `scripts/verify-gamification-migration.ts` - Verification script
- `GAMIFICATION_MIGRATION_GUIDE.md` - Full guide
- `scripts/README.md` - Detailed documentation

## Support

For issues:
1. Check error messages in output
2. Review GAMIFICATION_MIGRATION_GUIDE.md
3. Run verification script
4. Check Supabase logs

## Production Checklist

- [ ] Test in staging first
- [ ] Backup database
- [ ] Run during low-traffic period
- [ ] Monitor output for errors
- [ ] Run verification after migration
- [ ] Test with sample users
- [ ] Monitor application logs

## One-Liner Summary

Run `npm run migrate:gamification` to initialize gamification data for all users, then `npm run verify:gamification` to confirm success.
