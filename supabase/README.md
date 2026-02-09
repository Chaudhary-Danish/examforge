# ExamForge Database Migrations

This folder contains SQL scripts for managing the database schema.

## Structure

```
supabase/
├── schema.sql              # Full schema (for fresh installs)
├── reset.sql               # Drops everything (dangerous!)
└── migrations/
    ├── 001_initial.sql     # Base schema (created by schema.sql)
    └── 002_add_hierarchy_and_notices.sql  # Adds years/semesters/notices
```

## For Fresh Install (No existing data)

1. Run `reset.sql` in Supabase SQL Editor
2. Run `schema.sql`

## For Existing Database (With data you want to keep)

Run migrations in order:
1. Check current version: `SELECT * FROM schema_migrations;`
2. Run any migrations after your current version

## Adding New Migrations

1. Create a new file: `migrations/00X_description.sql`
2. Always check if migration was already applied
3. Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
4. Record the migration in `schema_migrations` table

## Best Practices

- Never modify old migration files after they've been run
- Test migrations on a dev database first
- Always backup before running migrations in production
- Use transactions where possible
