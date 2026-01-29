// Usage:
// 1) Ensure env vars are set in your shell:
//    - SUPABASE_URL
//    - SUPABASE_SERVICE_ROLE_KEY
//    - SUPABASE_DB_URL (Postgres connection string, ssl enabled)
// 2) Run: npm run setup:supabase

import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbUrl = process.env.SUPABASE_DB_URL;

  if (!url || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  if (!dbUrl) {
    console.warn('SUPABASE_DB_URL not provided. Will create Storage bucket only and skip database steps.');
  }

  const supabase = createClient(url, serviceKey);

  console.log('Checking Storage bucket: media');
  const { data: buckets } = await supabase.storage.listBuckets();
  const hasMedia = (buckets || []).some((b) => b.name === 'media');
  if (!hasMedia) {
    console.log('Creating bucket: media (public)');
    const { error: bucketErr } = await supabase.storage.createBucket('media', { public: true });
    if (bucketErr) {
      console.error('Failed to create bucket:', bucketErr.message);
      process.exit(1);
    }
  } else {
    console.log('Bucket media already exists');
  }

  if (dbUrl) {
    console.log('Connecting to Postgres');
    const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();

  const ddl = `
  create table if not exists public.media_library (
    id uuid primary key default gen_random_uuid(),
    church_id uuid not null references public.churches(id),
    title text not null,
    description text,
    category text not null,
    storage_path text not null,
    public_url text,
    share_id text unique not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );
  alter table public.media_library enable row level security;
  alter table public.members add column if not exists zip_code text;

  create table if not exists public.site_settings (
    church_id uuid primary key references public.churches(id) on delete cascade,
    data jsonb not null,
    updated_at timestamptz default now()
  );
  alter table public.site_settings enable row level security;
  `;

    console.log('Applying table DDL (media_library, members.zip_code)');
    await client.query(ddl);

  const policies = `
  do $$ begin
    begin
      drop policy if exists media_insert_authenticated on public.media_library;
      create policy media_insert_authenticated on public.media_library
        for insert to authenticated
        with check (
          exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.church_id = media_library.church_id
          )
        );
    exception when others then null; end;

    begin
      drop policy if exists media_select_authenticated on public.media_library;
      create policy media_select_authenticated on public.media_library
        for select to authenticated
        using (
          exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.church_id = media_library.church_id
          )
        );
    exception when others then null; end;

    begin
      drop policy if exists media_select_public_share on public.media_library;
      create policy media_select_public_share on public.media_library
        for select to anon
        using (share_id is not null);
    exception when others then null; end;
  end $$;

  do $$ begin
    begin
      drop policy if exists site_settings_upsert_authenticated on public.site_settings;
      create policy site_settings_upsert_authenticated on public.site_settings
        for insert to authenticated
        with check (
          exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.church_id = site_settings.church_id
          )
        );
    exception when others then null; end;

    begin
      drop policy if exists site_settings_update_authenticated on public.site_settings;
      create policy site_settings_update_authenticated on public.site_settings
        for update to authenticated
        using (
          exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.church_id = site_settings.church_id
          )
        );
    exception when others then null; end;

    begin
      drop policy if exists site_settings_select_authenticated on public.site_settings;
      create policy site_settings_select_authenticated on public.site_settings
        for select to authenticated
        using (
          exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.church_id = site_settings.church_id
          )
        );
    exception when others then null; end;
  end $$;
  `;
    console.log('Applying RLS policies');
    await client.query(policies);

    const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();
      for (const f of files) {
        const full = path.join(migrationsDir, f);
        console.log('Applying migration:', f);
        const sql = fs.readFileSync(full, 'utf8');
        await client.query(sql);
      }
    } else {
      console.warn('Migrations directory not found:', migrationsDir);
    }

    await client.end();
  } else {
    console.warn('Database steps skipped. Provide SUPABASE_DB_URL to create table and RLS policies.');
  }
  console.log('Supabase setup completed (bucket created, database ' + (dbUrl ? 'configured' : 'skipped') + ')');
}

main().catch((e) => {
  console.error('Setup failed:', e?.message || e);
  process.exit(1);
});
