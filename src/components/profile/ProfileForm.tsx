"use client";

import { useState, useTransition } from "react";
import type { FormEvent, ReactElement } from "react";
import { updateProfile } from "@/lib/actions/profile";
import { profileSchema } from "@/lib/validation/profile";
import { Field, inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/common/ImageUpload";

interface ProfileFormProps {
	initialDisplayName: string;
	initialAvatarUrl: string | null;
}

export function ProfileForm({
	initialDisplayName,
	initialAvatarUrl,
}: ProfileFormProps): ReactElement {
	const [displayName, setDisplayName] = useState(initialDisplayName);
	const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
	const [error, setError] = useState<string | undefined>();
	const [saved, setSaved] = useState(false);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (e: FormEvent): void => {
		e.preventDefault();
		const parsed = profileSchema.safeParse({ displayName });
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message);
			return;
		}
		setError(undefined);
		setSaved(false);

		startTransition(async () => {
			const result = await updateProfile({
				...parsed.data,
				...(avatarUrl ? { avatarUrl } : {}),
			});
			if (result?.error) {
				setError(result.error);
				return;
			}
			setSaved(true);
		});
	};

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			<ImageUpload
				bucket="avatars"
				shape="circle"
				label="大頭貼（選填，≤ 5MB）"
				value={avatarUrl}
				fallbackText={displayName}
				onUploaded={setAvatarUrl}
				onRemoved={() => setAvatarUrl(null)}
			/>
			<Field label="顯示名稱" error={error}>
				{(fieldProps) => (
					<input
						type="text"
						value={displayName}
						onChange={(e) => setDisplayName(e.target.value)}
						className={inputClass}
						{...fieldProps}
					/>
				)}
			</Field>
			<Button type="submit" disabled={isPending} className="self-start">
				{isPending ? "儲存中…" : "儲存"}
			</Button>
			{saved && !isPending && (
				<p className="text-sm text-green-600">已儲存</p>
			)}
		</form>
	);
}
