"use client";

import type { ReactElement } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTemplate, updateTemplate } from "@/lib/actions/concerts";
import { concertSchema, type ConcertInput } from "@/lib/validation/concert";
import { Field, inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface ConcertFormProps {
	// 有帶 templateId = 編輯模式
	templateId?: string;
	defaultValues?: Partial<ConcertInput>;
}

export function ConcertForm({
	templateId,
	defaultValues,
}: ConcertFormProps): ReactElement {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<z.input<typeof concertSchema>, unknown, ConcertInput>({
		resolver: zodResolver(concertSchema),
		defaultValues,
	});

	const onSubmit = async (values: ConcertInput): Promise<void> => {
		const result = templateId
			? await updateTemplate(templateId, values)
			: await createTemplate(values);
		if (result?.error) {
			toast.error(result.error);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-4">
			<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
			<Field label="標題" error={errors.title?.message}>
				{(fieldProps) => (
					<input type="text" {...register("title")} {...fieldProps} className={inputClass} />
				)}
			</Field>

			<Field label="藝人" error={errors.artist?.message}>
				{(fieldProps) => (
					<input type="text" {...register("artist")} {...fieldProps} className={inputClass} />
				)}
			</Field>

			<Field label="場館名稱" error={errors.venueName?.message}>
				{(fieldProps) => (
					<input
						type="text"
						{...register("venueName")}
						{...fieldProps}
						className={inputClass}
					/>
				)}
			</Field>

			{/* 座標不再由表單收集，只保留 hidden 欄位讓既有資料能 round-trip（見 RecordForm 的同款處理） */}
			<input type="hidden" {...register("venueLat")} />
			<input type="hidden" {...register("venueLng")} />

			<Field label="日期" error={errors.date?.message}>
				{(fieldProps) => (
					<input type="date" {...register("date")} {...fieldProps} className={inputClass} />
				)}
			</Field>

			<Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
				{isSubmitting && <Spinner />}
				{isSubmitting ? "儲存中…" : templateId ? "更新範本" : "建立範本"}
			</Button>
			</fieldset>
		</form>
	);
}
