"use client";

import { useState, useTransition } from "react";
import type { FormEvent, ReactElement } from "react";
import { createComment } from "@/lib/actions/comments";
import { commentSchema } from "@/lib/validation/comment";

interface CommentFormProps {
	recordId: string;
	onCreated: (totalPages: number) => void;
	// 私密紀錄無法被留言（RLS 擋 insert），傳 disabled 時輸入框/送出鈕都禁用
	disabled?: boolean;
}

export function CommentForm({ recordId, onCreated, disabled = false }: CommentFormProps): ReactElement {
	const [body, setBody] = useState("");
	const [error, setError] = useState<string | undefined>();
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (e: FormEvent): void => {
		e.preventDefault();
		const parsed = commentSchema.safeParse({ body });
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message);
			return;
		}
		setError(undefined);

		startTransition(async () => {
			const result = await createComment(recordId, parsed.data);
			if ("error" in result) {
				setError(result.error);
				return;
			}
			setBody(""); // 成功才清空
			onCreated(result.totalPages);
		});
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-2">
			<textarea
				value={body}
				onChange={(e) => setBody(e.target.value)}
				rows={3}
				disabled={disabled}
				placeholder={disabled ? "公開後才能留言" : "留言…"}
				aria-label="留言"
				aria-invalid={Boolean(error)}
				className="w-full rounded-lg border border-[#e4dcd0] bg-transparent px-3 py-2 text-sm text-[#18130f] outline-none transition-colors placeholder:text-[#7d7568]/70 focus:border-[#b8934a] disabled:cursor-not-allowed disabled:bg-[#f4f1ea] disabled:text-[#7d7568]"
			/>
			{error && <span className="text-xs text-destructive">{error}</span>}
			<div className="flex justify-end">
				<button
					type="submit"
					disabled={disabled || isPending}
					className="cursor-pointer bg-transparent px-2 py-1 text-xs font-semibold text-[#b8934a] hover:underline disabled:cursor-not-allowed disabled:text-[#7d7568] disabled:no-underline"
				>
					{isPending ? "送出中…" : "送出留言 →"}
				</button>
			</div>
		</form>
	);
}
