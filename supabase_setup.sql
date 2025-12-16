-- 1. Enable UUID extension (if not already enabled)
create extension if not exists "uuid-ossp";

-- 2. Create 'products' table
create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  image_url text, -- Kept for legacy support, use 'images' for new
  status text default 'visible',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create 'sliders' table
create table if not exists public.sliders (
  id uuid default uuid_generate_v4() primary key,
  title text,
  image_url text not null,
  "order" integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS)
alter table public.products enable row level security;
alter table public.sliders enable row level security;

-- 5. Create Security Policies

-- PRODUCT POLICIES
drop policy if exists "Public products are viewable by everyone" on public.products;
create policy "Public products are viewable by everyone" 
on public.products for select 
using (true);

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products" 
on public.products for insert 
with check (auth.role() = 'authenticated');

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products" 
on public.products for update 
using (auth.role() = 'authenticated');

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products" 
on public.products for delete 
using (auth.role() = 'authenticated');

-- SLIDER POLICIES
drop policy if exists "Public sliders are viewable by everyone" on public.sliders;
create policy "Public sliders are viewable by everyone" 
on public.sliders for select 
using (true);

drop policy if exists "Admins can insert sliders" on public.sliders;
create policy "Admins can insert sliders" 
on public.sliders for insert 
with check (auth.role() = 'authenticated');

drop policy if exists "Admins can update sliders" on public.sliders;
create policy "Admins can update sliders" 
on public.sliders for update 
using (auth.role() = 'authenticated');

drop policy if exists "Admins can delete sliders" on public.sliders;
create policy "Admins can delete sliders" 
on public.sliders for delete 
using (auth.role() = 'authenticated');

-- 6. Storage Policies
drop policy if exists "Public Access to Images" on storage.objects;
create policy "Public Access to Images"
on storage.objects for select
using ( bucket_id = 'images' );

drop policy if exists "Admins can upload images" on storage.objects;
create policy "Admins can upload images"
on storage.objects for insert
with check ( bucket_id = 'images' and auth.role() = 'authenticated' );

-- ==========================================
-- NEW MIGRATION COMMANDS (Run these in SQL Editor)
-- ==========================================

-- Add new columns to 'products' table if they don't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name='products' and column_name='price') then
        alter table products add column price numeric default 0;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='products' and column_name='quantity') then
        alter table products add column quantity integer default 0;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='products' and column_name='variants') then
        alter table products add column variants jsonb default '[]'::jsonb;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='products' and column_name='images') then
        alter table products add column images text[] default array[]::text[];
    end if;
end
$$;
