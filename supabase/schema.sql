-- ============================================================
-- moment-log 初始 schema（貼到 Supabase SQL Editor 執行）
-- 包含：資料表、自動建立 profile 的 trigger、admin helper、RLS policies
-- ============================================================

-- ------------------------------------------------------------
-- 0. 擴充套件
--    pg_trgm：trigram 相似度比對，補強全文搜尋在「中文子字串」情境下的弱點
--    （Supabase 代管 Postgres 沒有中文分詞擴充套件，全文搜尋用的 simple config
--    對連續中文字只能整段當一個 token 比對；trigram 讓「巨蛋」也能找到「小巨蛋」）
-- ------------------------------------------------------------
create extension if not exists pg_trgm;

-- ------------------------------------------------------------
-- 1. 資料表
-- ------------------------------------------------------------

-- profiles：延伸 Supabase 內建的 auth.users（auth.users 不能直接加欄位）
create table public.profiles (
	id uuid primary key references auth.users on delete cascade,
	display_name text not null,
	avatar_url text,
	role text not null default 'user' check (role in ('admin', 'user')),
	is_banned boolean not null default false,
	created_at timestamptz not null default now()
);

-- concerts：管理員維護的「範本」
create table public.concerts (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	artist text not null,
	venue_name text not null,
	venue_lat double precision not null, -- 經 Nominatim geocoding 取得
	venue_lng double precision not null,
	date date not null,
	created_by uuid references public.profiles(id),
	created_at timestamptz not null default now()
);
-- 範本管理頁用 date desc 排序分頁
create index concerts_date_idx on public.concerts (date desc);

-- concert_records：使用者紀錄，套用範本後即與範本脫鉤
create table public.concert_records (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	template_id uuid references public.concerts(id) on delete set null, -- 選填，記錄來源
	title text not null,
	artist text not null,
	venue_name text not null,
	venue_lat double precision, -- 選填，手動紀錄可不附座標
	venue_lng double precision,
	date date not null,
	cover_image_url text,
	ticket_price integer,
	rating smallint check (rating between 1 and 5),
	review text check (review is null or char_length(review) <= 5000),
	is_public boolean not null default false,
	spotify_playlist_id text check (spotify_playlist_id is null or char_length(spotify_playlist_id) <= 200),
	created_at timestamptz not null default now()
);
-- /reviews 公開列表分頁用；user_id 索引給「我的列表」用
create index concert_records_public_date_idx on public.concert_records (is_public, date desc);
create index concert_records_user_idx on public.concert_records (user_id);

-- search_vector：全文搜尋用欄位，generated column 自動隨 title/artist/venue_name/review
-- 異動同步更新，不需要額外寫 trigger 維護
-- 用 setweight 給不同欄位不同權重：A（最高）標題 > B 藝人/場館 > C 心得內文，供 ts_rank 排序用
-- 使用 'simple' config（不是 'english'）：Supabase 代管 Postgres 沒有中文分詞擴充套件可裝，
-- 'simple' 只做 tokenizing+lowercase、不做 stemming，是中英混雜內容缺乏中文分詞器時
-- 最不會誤傷的通用選擇（曾嘗試疊加 pg_trgm 補中文子字串比對，但雜訊字串會被誤判為相似，
-- 調門檻無法兩全，已拿掉，見下方 RPC function 的說明）
alter table public.concert_records
	add column search_vector tsvector
	generated always as (
		setweight(to_tsvector('simple', coalesce(title, '')), 'A')
		|| setweight(to_tsvector('simple', coalesce(artist, '')), 'B')
		|| setweight(to_tsvector('simple', coalesce(venue_name, '')), 'B')
		|| setweight(to_tsvector('simple', coalesce(review, '')), 'C')
	) stored;

-- GIN index 給 tsvector 用（全文搜尋 @@ 比對加速）
create index concert_records_search_vector_idx on public.concert_records using gin (search_vector);

-- tags：全站共用標籤詞彙，使用者可自由新增；name 全站唯一（不分大小寫比對交給查詢層處理）
create table public.tags (
	id uuid primary key default gen_random_uuid(),
	name text not null unique,
	created_at timestamptz not null default now()
);

-- concert_record_tags：紀錄與標籤的多對多 join 表
create table public.concert_record_tags (
	record_id uuid not null references public.concert_records(id) on delete cascade,
	tag_id uuid not null references public.tags(id) on delete cascade,
	primary key (record_id, tag_id)
);
create index concert_record_tags_tag_idx on public.concert_record_tags (tag_id);

-- saved_routes：常用路線
create table public.saved_routes (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	venue_name text not null,
	start_point_label text not null,
	start_lat double precision not null,
	start_lng double precision not null,
	created_at timestamptz not null default now()
);
create index saved_routes_user_idx on public.saved_routes (user_id);

-- ------------------------------------------------------------
-- 2. 註冊時自動建立 profile
--    使用者一註冊（auth.users 新增一列），trigger 自動補一筆 profile
-- ------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
	insert into public.profiles (id, display_name)
	values (
		new.id,
		-- 優先用註冊時帶的 display_name，沒有就用 email 的 @ 前段當預設
		coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
	);
	return new;
end;
$$;

create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 3. admin 判斷 helper
--    security definer：函式以擁有者身分執行，繞過 RLS 讀 profiles，避免 policy 遞迴
-- ------------------------------------------------------------
create function public.is_admin()
returns boolean
language sql
security definer set search_path = ''
stable
as $$
	select exists (
		select 1 from public.profiles
		where id = auth.uid() and role = 'admin'
	);
$$;

-- ------------------------------------------------------------
-- 4. 開啟 RLS（開了之後，沒有 policy = 一律拒絕）
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.concerts enable row level security;
alter table public.concert_records enable row level security;
alter table public.saved_routes enable row level security;

-- profiles --------------------------------------------------
-- 所有人可讀（/reviews 要顯示作者 display_name / avatar）
create policy "profiles_select_all"
	on public.profiles for select
	using (true);

-- 只能建立自己的 profile（trigger 已自動建，這是保險）
create policy "profiles_insert_own"
	on public.profiles for insert
	with check (auth.uid() = id);

-- 可更新自己的 profile，但「role 不能改」→ 杜絕自我提權
-- with check 內的子查詢取的是更新前的舊值，要求 new.role = 舊 role 才放行
-- 真正要設 admin 時用 service_role key（繞過 RLS）在後端改
create policy "profiles_update_own_no_role"
	on public.profiles for update
	using (auth.uid() = id)
	with check (
		auth.uid() = id
		and role = (select role from public.profiles where id = auth.uid())
	);

-- concerts（範本）------------------------------------------
-- 所有人（含未登入 anon）可讀
create policy "concerts_select_all"
	on public.concerts for select
	using (true);

-- 只有 admin 可寫（insert / update / delete）
create policy "concerts_admin_write"
	on public.concerts for all
	using (public.is_admin())
	with check (public.is_admin());

-- concert_records ------------------------------------------
-- 公開的任何人可讀；私密的只有本人可讀
create policy "records_select_public_or_own"
	on public.concert_records for select
	using (is_public = true or auth.uid() = user_id);

create policy "records_insert_own"
	on public.concert_records for insert
	with check (auth.uid() = user_id);

create policy "records_update_own"
	on public.concert_records for update
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

create policy "records_delete_own"
	on public.concert_records for delete
	using (auth.uid() = user_id);

-- saved_routes ----------------------------------------------
-- 完全私人，只有本人可讀寫
create policy "routes_all_own"
	on public.saved_routes for all
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 5. 社交互動：按讚 / 留言 / 追蹤
-- ------------------------------------------------------------

-- record_likes：對公開心得按讚，unique(user_id, record_id) 防重複按讚
create table public.record_likes (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	record_id uuid not null references public.concert_records(id) on delete cascade,
	created_at timestamptz not null default now(),
	unique (user_id, record_id)
);
-- 詳情頁算讚數、判斷「我是否已讚」用
create index record_likes_record_idx on public.record_likes (record_id);
create index record_likes_user_idx on public.record_likes (user_id);

-- record_comments：對公開心得留言，不審核、只有作者本人可刪
create table public.record_comments (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	record_id uuid not null references public.concert_records(id) on delete cascade,
	body text not null check (char_length(body) between 1 and 1000),
	created_at timestamptz not null default now()
);
-- 詳情頁依時間列出該篇留言用
create index record_comments_record_created_idx on public.record_comments (record_id, created_at);

-- follows：使用者追蹤關係，unique(follower_id, followee_id) 防重複追蹤
create table public.follows (
	id uuid primary key default gen_random_uuid(),
	follower_id uuid not null references public.profiles(id) on delete cascade, -- 發起追蹤的人
	followee_id uuid not null references public.profiles(id) on delete cascade, -- 被追蹤的人
	created_at timestamptz not null default now(),
	unique (follower_id, followee_id)
);
-- 「我追蹤了誰」「誰追蹤了我」兩個方向都要查
create index follows_follower_idx on public.follows (follower_id);
create index follows_followee_idx on public.follows (followee_id);

create type notification_type as enum ('follow', 'comment', 'like');

-- notifications：站內通知，單一表用 type 區分三種類型，選填欄位依類型使用
-- （follow: actor_id；comment: actor_id + record_id + comment_id；like: actor_id + record_id）
create table public.notifications (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade, -- 通知的接收者
	type notification_type not null,
	actor_id uuid not null references public.profiles(id) on delete cascade, -- 觸發這則通知的人
	record_id uuid references public.concert_records(id) on delete cascade,
	comment_id uuid references public.record_comments(id) on delete cascade,
	is_read boolean not null default false,
	created_at timestamptz not null default now()
);
-- 通知清單依時間排序、未讀數統計用
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications (user_id) where is_read = false;

-- ------------------------------------------------------------
-- 6. 「這筆紀錄目前是否公開」helper：按讚/留言的 insert policy 用
--    security definer：以擁有者身分執行，繞過 RLS 讀 concert_records.is_public，
--    避免呼叫端因看不到私密紀錄而查不到、產生誤判
-- ------------------------------------------------------------
create function public.record_is_public(p_record_id uuid)
returns boolean
language sql
security definer set search_path = ''
stable
as $$
	select exists (
		select 1 from public.concert_records
		where id = p_record_id and is_public = true
	);
$$;

-- ------------------------------------------------------------
-- 7. 開啟 RLS
-- ------------------------------------------------------------
alter table public.record_likes enable row level security;
alter table public.record_comments enable row level security;
alter table public.follows enable row level security;
alter table public.tags enable row level security;
alter table public.concert_record_tags enable row level security;
alter table public.notifications enable row level security;

-- notifications ---------------------------------------------------
-- 只有本人能讀/改自己的通知；insert 交給觸發通知的那個人（actor）以自己的身分寫入，
-- 不限制對象是誰（比照 likes/comments 的 insert policy 不限制目標紀錄擁有者是誰）
create policy "notifications_select_own"
	on public.notifications for select
	using (auth.uid() = user_id);

create policy "notifications_insert_as_actor"
	on public.notifications for insert
	with check (auth.uid() = actor_id);

-- update：標記已讀用，本人限定
create policy "notifications_update_own"
	on public.notifications for update
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

-- tags ----------------------------------------------------------
-- 全站共用詞彙：任何人可讀；已登入使用者可新增（不可改名/刪除，避免影響其他人已使用的標籤）
create policy "tags_select_all" on public.tags for select using (true);
create policy "tags_insert_authenticated" on public.tags for insert to authenticated with check (true);

-- concert_record_tags --------------------------------------------
-- 可見性跟隨所屬紀錄（比照 spot_list_items 的 _select_via_list 模式）；寫入只能對自己的紀錄操作
create policy "concert_record_tags_select_via_record"
	on public.concert_record_tags for select
	using (record_is_public(record_id) or exists (
		select 1 from public.concert_records where id = record_id and user_id = auth.uid()
	));

create policy "concert_record_tags_insert_own_record"
	on public.concert_record_tags for insert
	with check (exists (
		select 1 from public.concert_records where id = record_id and user_id = auth.uid()
	));

create policy "concert_record_tags_delete_own_record"
	on public.concert_record_tags for delete
	using (exists (
		select 1 from public.concert_records where id = record_id and user_id = auth.uid()
	));

-- record_likes ------------------------------------------------
-- select：讚本身不是敏感資訊，但只曝光「公開紀錄」上的讚；本人一定看得到自己的讚
-- （即使該筆紀錄後來被改為私密，避免「已讚卻查不到」的不一致體感）
create policy "likes_select_public_record_or_own"
	on public.record_likes for select
	using (public.record_is_public(record_id) or auth.uid() = user_id);

-- insert：只能用自己的身分按讚，且該紀錄必須是公開的
create policy "likes_insert_own_on_public_record"
	on public.record_likes for insert
	with check (auth.uid() = user_id and public.record_is_public(record_id));

-- delete：只能取消自己的讚（紀錄事後變私密，仍允許收回自己的讚）
create policy "likes_delete_own"
	on public.record_likes for delete
	using (auth.uid() = user_id);

-- record_comments ----------------------------------------------
create policy "comments_select_public_record_or_own"
	on public.record_comments for select
	using (public.record_is_public(record_id) or auth.uid() = user_id);

create policy "comments_insert_own_on_public_record"
	on public.record_comments for insert
	with check (auth.uid() = user_id and public.record_is_public(record_id));

-- delete：只有留言作者本人能刪，紀錄擁有者沒有額外刪除權
create policy "comments_delete_own"
	on public.record_comments for delete
	using (auth.uid() = user_id);

-- follows -------------------------------------------------------
-- select：追蹤關係視為公開的社交圖資訊（比照多數社交產品），任何人（含 anon）可讀
create policy "follows_select_all"
	on public.follows for select
	using (true);

-- insert：只能用自己的身分（follower）建立追蹤關係；不擋自我追蹤
create policy "follows_insert_own"
	on public.follows for insert
	with check (auth.uid() = follower_id);

-- delete：只能取消自己發起的追蹤
create policy "follows_delete_own"
	on public.follows for delete
	using (auth.uid() = follower_id);

-- ------------------------------------------------------------
-- 8. 心得 + 讚數/留言數 view：/reviews 系列列表與 /concerts「我的紀錄」共用
--    security_invoker = true：查詢時遵循呼叫者的權限（沿用 concert_records 的 RLS），
--    不會因為 view 而繞過 is_public 限制
--    date_text：date 是 Postgres 原生日期型別，ilike 不支援，搜尋列要模糊比對
--    日期字串（例如輸入 2026 配到 2026-xx-xx）時改查這個文字欄位
--    like_count/comment_count 各用相關子查詢算，不用 join 是為了避免兩張明細表
--    一起 left join 時互相交叉相乘（笛卡兒積）導致計數錯誤
-- ------------------------------------------------------------
create or replace view public.concert_records_with_like_count
with (security_invoker = true)
as
select
	r.*,
	(select count(*) from public.record_likes l where l.record_id = r.id) as like_count,
	r.date::text as date_text,
	(select count(*) from public.record_comments c where c.record_id = r.id) as comment_count
from public.concert_records r;

-- ------------------------------------------------------------
-- 8-1. 全文搜尋 RPC：/concerts（我的紀錄）與 /reviews（公開心得）共用
--    只用 tsvector 全文比對（@@，語意/詞相等比對，有 ts_rank 相關性）
--    security invoker（預設，未寫 security definer）：沿用呼叫者權限，
--    concert_records 的既有 RLS policy 仍會過濾私密紀錄，這裡不做任何繞過
--    p_user_id 為 null 時代表「不限定作者」（/reviews 用這個分支，另外用 p_public_only 控制只看公開）
--    注意：RLS 擋不掉「呼叫者自己的私密紀錄」（auth.uid() = user_id 的 policy 分支本來就會放行），
--    /reviews 呼叫時務必傳 p_public_only = true，否則已登入使用者在公開頁搜尋會意外撈到自己的私密紀錄
--    原本疊加 pg_trgm trigram 子字串比對想補強中文子字串搜尋（例如「巨蛋」找到「小巨蛋」），
--    但實測發現連續重複字元的雜訊字串（如 "aaappppppppppppp"）跟含重複片段的正常內容
--    trigram 相似度也會偏高，調高門檻會連中文短詞子字串比對都失效，調低又擋不住誤判，
--    無法兩全，因此拿掉 trigram fallback，只保留 tsvector——代價是中文短詞的子字串搜尋
--    能力有限（simple config 對連續中文字整段視為一個 token），但行為可預期、不會有誤判
-- ------------------------------------------------------------
create or replace function public.search_concert_records(
	p_keyword text,
	p_user_id uuid default null,
	p_public_only boolean default false,
	p_tag_ids uuid[] default null,
	p_limit int default 9,
	p_offset int default 0
)
returns table (id uuid, rank real)
language sql
stable
security invoker
set search_path = ''
as $$
	with matched as (
		select
			r.id,
			ts_rank(r.search_vector, websearch_to_tsquery('simple', p_keyword)) as rank
		from public.concert_records r
		where
			(p_user_id is null or r.user_id = p_user_id)
			and (p_public_only is false or r.is_public = true)
			and r.search_vector @@ websearch_to_tsquery('simple', p_keyword)
			and (
				p_tag_ids is null or array_length(p_tag_ids, 1) is null
				or exists (
					select 1 from public.concert_record_tags t
					where t.record_id = r.id and t.tag_id = any(p_tag_ids)
				)
			)
	)
	select id, rank from matched
	order by rank desc, id
	limit p_limit offset p_offset;
$$;

-- 搭配上面的 RPC，回傳總筆數（分頁用；Supabase RPC 不支援 count: 'exact' 這種 REST 層參數，
-- 分頁計數要另外查）
create or replace function public.search_concert_records_count(
	p_keyword text,
	p_user_id uuid default null,
	p_public_only boolean default false,
	p_tag_ids uuid[] default null
)
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
	select count(*)
	from public.concert_records r
	where
		(p_user_id is null or r.user_id = p_user_id)
		and (p_public_only is false or r.is_public = true)
		and r.search_vector @@ websearch_to_tsquery('simple', p_keyword)
		and (
			p_tag_ids is null or array_length(p_tag_ids, 1) is null
			or exists (
				select 1 from public.concert_record_tags t
				where t.record_id = r.id and t.tag_id = any(p_tag_ids)
			)
		);
$$;

-- ------------------------------------------------------------
-- 9. 管理員：使用者管理用 function
--    security definer：以擁有者身分執行，內部立刻檢查 is_admin() 才放行，
--    非 admin 呼叫 admin_list_users 回空集合、呼叫 admin_set_user_role 直接 raise exception
-- ------------------------------------------------------------

-- 列出所有使用者（含 email，一般 RLS 查不到 auth.users）
create or replace function public.admin_list_users()
returns table (id uuid, display_name text, avatar_url text, role text, email text, created_at timestamptz, is_banned boolean)
language sql
security definer set search_path = ''
stable
as $$
	select p.id, p.display_name, p.avatar_url, p.role, u.email, p.created_at, p.is_banned
	from public.profiles p
	join auth.users u on u.id = p.id
	where public.is_admin()
	order by p.created_at desc;
$$;

-- 設定某使用者角色；擋自我操作，避免唯一 admin 誤降級鎖死自己
create or replace function public.admin_set_user_role(target_id uuid, new_role text)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
	if not public.is_admin() then
		raise exception 'not authorized';
	end if;
	if target_id = auth.uid() then
		raise exception 'cannot change your own role';
	end if;
	if new_role not in ('admin', 'user') then
		raise exception 'invalid role';
	end if;

	update public.profiles set role = new_role where id = target_id;
end;
$$;

-- 設定某使用者是否被封鎖；擋自我操作
create or replace function public.admin_set_user_banned(target_id uuid, banned boolean)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
	if not public.is_admin() then
		raise exception 'not authorized';
	end if;
	if target_id = auth.uid() then
		raise exception 'cannot ban yourself';
	end if;

	update public.profiles set is_banned = banned where id = target_id;
end;
$$;

-- 目前登入者是否被封鎖；middleware 每次請求檢查用，未登入或查無資料一律回 false
create or replace function public.is_current_user_banned()
returns boolean
language sql
security definer set search_path = ''
stable
as $$
	select coalesce(
		(select is_banned from public.profiles where id = auth.uid()),
		false
	);
$$;

-- ------------------------------------------------------------
-- 8-2. Auth Hook：簽發 access token 前檢查 is_banned，被封鎖的帳號直接在
--      這一步被拒絕，不必等應用層 signInWithPassword 成功後才另外查一次
--      is_current_user_banned RPC，省下登入流程裡一次獨立的資料庫往返。
--      需要在 Supabase Dashboard 的 Authentication → Hooks 手動啟用
--      「Custom Access Token」hook 並選擇這個 function，SQL 本身無法啟用
-- ------------------------------------------------------------
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
as $$
declare
	banned boolean;
begin
	select is_banned into banned
	from public.profiles
	where id = (event->>'user_id')::uuid;

	if banned then
		return jsonb_build_object(
			'error', jsonb_build_object(
				'http_code', 403,
				'message', 'Account has been suspended'
			)
		);
	end if;

	return event;
end;
$$;

grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- ------------------------------------------------------------
-- 9-1. 統計儀表板：依月分組的場次數，Supabase JS 沒有 group-by 語法，
--      改在資料庫端用 date_trunc + group by 聚合
--      security invoker（預設）+ auth.uid() 過濾，只回傳呼叫者自己的資料，不繞過 RLS
-- ------------------------------------------------------------
create or replace function public.get_monthly_record_counts()
returns table (month date, count bigint)
language sql
stable
as $$
	select date_trunc('month', date)::date as month, count(*)::bigint as count
	from public.concert_records
	where user_id = auth.uid()
	group by 1
	order by 1;
$$;

-- ------------------------------------------------------------
-- 10. 追星地圖：清單 + 地點兩層模型
--     spot_lists 是容器（標題、藝人 tag、公開設定）；spot_list_items 是清單內的地點，
--     不獨立設定公開性，可見度完全跟隨所屬清單
-- ------------------------------------------------------------

create table public.spot_lists (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	title text not null,
	artist text not null,
	description text,
	is_public boolean not null default false,
	created_at timestamptz not null default now()
);
create index spot_lists_public_artist_idx on public.spot_lists (is_public, artist);
create index spot_lists_user_idx on public.spot_lists (user_id);

create table public.spot_list_items (
	id uuid primary key default gen_random_uuid(),
	list_id uuid not null references public.spot_lists(id) on delete cascade,
	place_name text not null,
	place_lat double precision not null,
	place_lng double precision not null,
	place_type text check (place_type in ('restaurant', 'attraction', 'other')),
	description text,
	cover_image_url text,
	created_at timestamptz not null default now()
);
create index spot_list_items_list_idx on public.spot_list_items (list_id);

alter table public.spot_lists enable row level security;
alter table public.spot_list_items enable row level security;

-- spot_lists：比照 concert_records，公開的任何人可讀，私密的只有本人可讀
create policy "spot_lists_select_public_or_own"
	on public.spot_lists for select
	using (is_public = true or auth.uid() = user_id);

create policy "spot_lists_insert_own"
	on public.spot_lists for insert
	with check (auth.uid() = user_id);

create policy "spot_lists_update_own"
	on public.spot_lists for update
	using (auth.uid() = user_id);

create policy "spot_lists_delete_own"
	on public.spot_lists for delete
	using (auth.uid() = user_id);

-- 清單是否對目前使用者可見；security definer 避免在下面的 policy 內重複寫 subquery
create function public.spot_list_is_visible(p_list_id uuid)
returns boolean
language sql
security definer set search_path = ''
stable
as $$
	select exists (
		select 1 from public.spot_lists
		where id = p_list_id and (is_public = true or user_id = auth.uid())
	);
$$;

-- spot_list_items：讀取權限跟隨所屬清單是否可見
create policy "spot_list_items_select_via_list"
	on public.spot_list_items for select
	using (public.spot_list_is_visible(list_id));

-- 新增/改/刪地點：只有清單擁有者可操作
create policy "spot_list_items_insert_own_list"
	on public.spot_list_items for insert
	with check (
		exists (select 1 from public.spot_lists where id = list_id and user_id = auth.uid())
	);

create policy "spot_list_items_update_own_list"
	on public.spot_list_items for update
	using (
		exists (select 1 from public.spot_lists where id = list_id and user_id = auth.uid())
	);

create policy "spot_list_items_delete_own_list"
	on public.spot_list_items for delete
	using (
		exists (select 1 from public.spot_lists where id = list_id and user_id = auth.uid())
	);

-- spot_list_likes：對追星清單按讚，比照 record_likes 的設計
create table public.spot_list_likes (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	list_id uuid not null references public.spot_lists(id) on delete cascade,
	created_at timestamptz not null default now(),
	unique (user_id, list_id)
);
create index spot_list_likes_list_idx on public.spot_list_likes (list_id);
create index spot_list_likes_user_idx on public.spot_list_likes (user_id);

alter table public.spot_list_likes enable row level security;

-- 讀取：清單本身可見就可以看讚（沿用 spot_list_is_visible，跟 spot_list_items 同一套判斷）
create policy "spot_list_likes_select_via_list"
	on public.spot_list_likes for select
	using (public.spot_list_is_visible(list_id));

-- 新增：只能對「自己看得到的清單」按讚（公開清單或自己的清單），且只能用自己的 user_id
create policy "spot_list_likes_insert_own"
	on public.spot_list_likes for insert
	with check (auth.uid() = user_id and public.spot_list_is_visible(list_id));

-- 刪除：只能刪自己的讚
create policy "spot_list_likes_delete_own"
	on public.spot_list_likes for delete
	using (auth.uid() = user_id);

-- 清單 + 地點數量 + 讚數 view：/spots 列表卡片顯示用，避免對每筆清單各查一次 count（N+1）
-- security_invoker = true：查詢時遵循呼叫者的權限，不會因為 view 而繞過 is_public 限制
-- 明確列欄位（不用 l.*）：create or replace view 只能在最後新增欄位，用 l.* 展開的話，
-- 底層表新增欄位時欄位順序會插進中間，導致下次要 replace 這個 view 時又衝突
drop view if exists public.spot_lists_with_item_count;
create view public.spot_lists_with_item_count
with (security_invoker = true)
as
select
	l.id,
	l.user_id,
	l.title,
	l.artist,
	l.description,
	l.is_public,
	l.created_at,
	(select count(*) from public.spot_list_items i where i.list_id = l.id) as item_count,
	(select count(*) from public.spot_list_likes k where k.list_id = l.id) as like_count
from public.spot_lists l;
