"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { Bell } from "lucide-react";
import { getNotificationsAction, getUnreadCountAction, markAllAsRead } from "@/lib/actions/notifications";
import type { NotificationItem } from "@/lib/data/notifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CoverImage } from "@/components/ui/CoverImage";
import { Spinner } from "@/components/ui/Spinner";

const POLL_INTERVAL_MS = 30000;

function buildNotificationText(n: NotificationItem): string {
	switch (n.type) {
		case "follow":
			return `${n.actorName} 開始追蹤你`;
		case "comment":
			return `${n.actorName} 在《${n.recordTitle ?? "一篇心得"}》留言`;
		case "like":
			return `${n.actorName} 對《${n.recordTitle ?? "一篇心得"}》按讚`;
	}
}

function buildNotificationHref(n: NotificationItem): string {
	if (n.type === "follow") {
		return `/users/${n.actorId}`;
	}
	// comment/like 通知只會在公開紀錄上產生，固定連公開心得詳情頁
	return `/reviews/${n.recordId}`;
}

// header 鈴鐺：每 30 秒輪詢未讀數，Popover 開啟時抓清單並一次標記全部已讀
export function NotificationBell(): ReactElement {
	const router = useRouter();
	const [unreadCount, setUnreadCount] = useState(0);
	// null = 尚未載入過（顯示 loading）；[] = 載入完成但沒有通知（顯示空狀態文字）
	const [notifications, setNotifications] = useState<NotificationItem[] | null>(null);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		let cancelled = false;

		const poll = (): void => {
			getUnreadCountAction().then((count) => {
				if (!cancelled) {
					setUnreadCount(count);
				}
			});
		};

		poll();
		const timer = setInterval(poll, POLL_INTERVAL_MS);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, []);

	const handleOpenChange = (next: boolean): void => {
		setOpen(next);
		if (next) {
			setNotifications(null); // 每次重新開啟都先顯示 loading，避免沿用上次的舊清單
			getNotificationsAction().then(setNotifications);
			markAllAsRead().then(() => setUnreadCount(0));
		}
	};

	const handleItemClick = (n: NotificationItem): void => {
		setOpen(false);
		router.push(buildNotificationHref(n));
	};

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger
				aria-label="通知"
				className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-background hover:text-foreground"
			>
				<Bell className="h-5 w-5" />
				{unreadCount > 0 && (
					<span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
						{unreadCount > 99 ? "99+" : unreadCount}
					</span>
				)}
			</PopoverTrigger>
			<PopoverContent align="end" className="flex max-h-96 flex-col gap-1 overflow-y-auto p-1">
				{notifications === null ? (
					<div className="flex justify-center py-6">
						<Spinner />
					</div>
				) : notifications.length === 0 ? (
					<p className="p-3 text-center text-sm text-muted-foreground">目前沒有通知</p>
				) : (
					notifications.map((n) => (
						<button
							key={n.id}
							type="button"
							onClick={() => handleItemClick(n)}
							className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-left text-sm text-foreground hover:bg-background"
						>
							<div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background text-xs font-medium text-muted-foreground">
								{n.actorAvatarUrl ? (
									<CoverImage
										src={n.actorAvatarUrl}
										alt={n.actorName}
										width={32}
										height={32}
										className="h-8 w-8 rounded-full object-cover"
									/>
								) : (
									n.actorName[0]
								)}
							</div>
							<span className="line-clamp-2">{buildNotificationText(n)}</span>
						</button>
					))
				)}
			</PopoverContent>
		</Popover>
	);
}
