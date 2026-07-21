"use client";

import { useState, useTransition } from "react";
import type { FormEvent, ReactElement } from "react";
import { createComment } from "@/lib/actions/comments";
import { commentSchema } from "@/lib/validation/comment";
import { Field, inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

interface CommentFormProps {
	recordId: string;
	onCreated: (totalPages: number) => void;
}

export function CommentForm({ recordId, onCreated }: CommentFormProps): ReactElement {
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
			<Field label="留言" error={error}>
				{(fieldProps) => (
					<textarea
						value={body}
						onChange={(e) => setBody(e.target.value)}
						rows={3}
						className={inputClass}
						{...fieldProps}
					/>
				)}
			</Field>
			<Button type="submit" disabled={isPending} className="self-end">
				{isPending ? "送出中…" : "送出留言"}
			</Button>
		</form>
	);
}
