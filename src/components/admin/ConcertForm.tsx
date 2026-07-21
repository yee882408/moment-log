"use client";

import type { ReactElement } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTemplate, updateTemplate } from "@/lib/actions/concerts";
import { concertSchema, type ConcertInput } from "@/lib/validation/concert";
import { VenueSearch } from "@/components/venue/VenueSearch";
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
		setValue,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<z.input<typeof concertSchema>, unknown, ConcertInput>({
		resolver: zodResolver(concertSchema),
		defaultValues,
	});

	const venueLat = watch("venueLat");
	const venueLng = watch("venueLng");

	const handleVenuePick = (label: string, lat: number, lng: number): void => {
		setValue("venueName", label, { shouldValidate: true });
		setValue("venueLat", lat);
		setValue("venueLng", lng);
	};

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

			<VenueSearch onPick={handleVenuePick} />

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

			<input type="hidden" {...register("venueLat")} />
			<input type="hidden" {...register("venueLng")} />
			{venueLat != null && venueLng != null ? (
				<p className="text-xs text-muted-foreground">
					已定位：{Number(venueLat).toFixed(5)}, {Number(venueLng).toFixed(5)}
				</p>
			) : (
				<p className="text-xs text-warning">
					範本需要座標，請先搜尋場館
				</p>
			)}

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
