-- ============================================================
-- 封面圖 Storage 設定（貼到 Supabase SQL Editor 執行）
-- bucket: covers（公開讀，登入者只能傳到自己 uid 開頭的路徑）
-- ============================================================

-- 1. 建立 public bucket，限 5MB、限圖片類型
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
	'covers',
	'covers',
	true,
	5242880, -- 5 MB
	array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 2. Storage RLS policies（作用在 storage.objects）
-- 上傳：登入者，且路徑第一段 = 自己的 uid
create policy "covers_insert_own"
	on storage.objects for insert
	to authenticated
	with check (
		bucket_id = 'covers'
		and (storage.foldername(name))[1] = auth.uid()::text
	);

-- 更新自己的
create policy "covers_update_own"
	on storage.objects for update
	to authenticated
	using (
		bucket_id = 'covers'
		and (storage.foldername(name))[1] = auth.uid()::text
	);

-- 刪除自己的
create policy "covers_delete_own"
	on storage.objects for delete
	to authenticated
	using (
		bucket_id = 'covers'
		and (storage.foldername(name))[1] = auth.uid()::text
	);

-- 讀取：公開（bucket 已 public，可用 public URL 讀；此 policy 讓 API 也可讀）
create policy "covers_select_public"
	on storage.objects for select
	to public
	using (bucket_id = 'covers');

-- ============================================================
-- 大頭貼 Storage 設定
-- bucket: avatars（公開讀，登入者只能傳到自己 uid 開頭的路徑）
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
	'avatars',
	'avatars',
	true,
	5242880, -- 5 MB
	array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "avatars_insert_own"
	on storage.objects for insert
	to authenticated
	with check (
		bucket_id = 'avatars'
		and (storage.foldername(name))[1] = auth.uid()::text
	);

create policy "avatars_update_own"
	on storage.objects for update
	to authenticated
	using (
		bucket_id = 'avatars'
		and (storage.foldername(name))[1] = auth.uid()::text
	);

create policy "avatars_delete_own"
	on storage.objects for delete
	to authenticated
	using (
		bucket_id = 'avatars'
		and (storage.foldername(name))[1] = auth.uid()::text
	);

create policy "avatars_select_public"
	on storage.objects for select
	to public
	using (bucket_id = 'avatars');

-- ============================================================
-- 追星地點封面圖 Storage 設定
-- bucket: spot-covers（公開讀，登入者只能傳到自己 uid 開頭的路徑）
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
	'spot-covers',
	'spot-covers',
	true,
	5242880, -- 5 MB
	array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "spot_covers_insert_own"
	on storage.objects for insert
	to authenticated
	with check (
		bucket_id = 'spot-covers'
		and (storage.foldername(name))[1] = auth.uid()::text
	);

create policy "spot_covers_update_own"
	on storage.objects for update
	to authenticated
	using (
		bucket_id = 'spot-covers'
		and (storage.foldername(name))[1] = auth.uid()::text
	);

create policy "spot_covers_delete_own"
	on storage.objects for delete
	to authenticated
	using (
		bucket_id = 'spot-covers'
		and (storage.foldername(name))[1] = auth.uid()::text
	);

create policy "spot_covers_select_public"
	on storage.objects for select
	to public
	using (bucket_id = 'spot-covers');
