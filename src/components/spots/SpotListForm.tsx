"use client";

import type { ReactElement } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSpotList, updateSpotList } from "@/lib/actions/spots";
import { spotListSchema, type SpotListInput } from "@/lib/validation/spot";
import { Field, inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/Spinner";

interface SpotListFormProps {
	// 有帶 listId = 編輯模式，否則新增模式
	listId?: string;
	defaultValues?: Partial<SpotListInput>;
}

export function SpotListForm({ listId, defaultValues }: SpotListFormProps): ReactElement {
	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<SpotListInput>({
		resolver: zodResolver(spotListSchema),
		defaultValues: { isPublic: false, ...defaultValues },
	});

	const isPublic = watch("isPublic");

	const onSubmit = async (values: SpotListInput): Promise<void> => {
		// 交給 Server Action：驗證 + 寫入都在伺服器跑，成功會自動 redirect
		const result = listId ? await updateSpotList(listId, values) : await createSpotList(values);
		// 有回傳代表失敗（成功時 action 已 redirect，不會走到這）
		if (result?.error) {
			toast.error(result.error);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-4">
			<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
				<Field label="清單標題" error={errors.title?.message}>
					{(fieldProps) => (
						<input type="text" {...register("title")} {...fieldProps} className={inputClass} />
					)}
				</Field>

				<Field label="藝人" error={errors.artist?.message}>
					{(fieldProps) => (
						<input type="text" {...register("artist")} {...fieldProps} className={inputClass} />
					)}
				</Field>

				<Field label="說明（選填）" error={errors.description?.message}>
					{(fieldProps) => (
						<textarea
							rows={3}
							{...register("description")}
							{...fieldProps}
							className={inputClass}
						/>
					)}
				</Field>

				<label className="flex items-center gap-2 text-sm text-foreground has-disabled:text-muted-foreground">
					<Checkbox
						checked={isPublic}
						onCheckedChange={(checked) => setValue("isPublic", checked === true)}
					/>
					公開這個清單（其他人可在追星地圖看到）
				</label>

				<Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
					{isSubmitting && <Spinner />}
					{isSubmitting ? "儲存中…" : listId ? "更新清單" : "建立清單"}
				</Button>
			</fieldset>
		</form>
	);
}
