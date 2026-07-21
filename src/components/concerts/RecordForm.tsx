"use client";

import type { ReactElement } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRecord, updateRecord } from "@/lib/actions/records";
import { recordSchema, type RecordInput } from "@/lib/validation/record";
import { VenueSearch } from "@/components/venue/VenueSearch";
import { ImageUpload } from "@/components/common/ImageUpload";
import { TagInput } from "@/components/common/TagInput";
import { Field, inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/Spinner";
import type { TemplateOption } from "@/lib/data/concerts";

interface RecordFormProps {
	// 有帶 recordId = 編輯模式，否則新增模式
	recordId?: string;
	defaultValues?: Partial<RecordInput>;
	templates?: TemplateOption[]; // 有值時顯示範本下拉（新增模式）
}

export function RecordForm({ recordId, defaultValues, templates }: RecordFormProps): ReactElement {
	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<z.input<typeof recordSchema>, unknown, RecordInput>({
		resolver: zodResolver(recordSchema),
		defaultValues: { isPublic: false, ...defaultValues },
	});

	const venueLat = watch("venueLat");
	const venueLng = watch("venueLng");
	const coverImageUrl = watch("coverImageUrl");
	const isPublic = watch("isPublic");
	const tags = watch("tags");

	const handleVenuePick = (label: string, lat: number, lng: number): void => {
		setValue("venueName", label, { shouldValidate: true });
		setValue("venueLat", lat);
		setValue("venueLng", lng);
	};

	// 選範本 → 複製各欄位進表單（仍可再編輯）；templateId 記錄來源
	const applyTemplate = (templateId: string): void => {
		const t = templates?.find((x) => x.id === templateId);
		if (!t) {
			return;
		}
		setValue("title", t.title, { shouldValidate: true });
		setValue("artist", t.artist, { shouldValidate: true });
		setValue("venueName", t.venue_name, { shouldValidate: true });
		setValue("venueLat", t.venue_lat);
		setValue("venueLng", t.venue_lng);
		setValue("date", t.date, { shouldValidate: true });
		setValue("templateId", t.id);
	};

	const onSubmit = async (values: RecordInput): Promise<void> => {
		// 交給 Server Action：驗證 + 寫入都在伺服器跑，成功會自動 redirect
		const result = recordId ? await updateRecord(recordId, values) : await createRecord(values);
		// 有回傳代表失敗（成功時 action 已 redirect，不會走到這）
		if (result?.error) {
			toast.error(result.error);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-4">
			<fieldset disabled={isSubmitting} className="flex flex-col gap-4">
				{templates && templates.length > 0 && (
					<Field label="套用範本（選填）">
						{(fieldProps) => (
							<Select onValueChange={applyTemplate}>
								<SelectTrigger id={fieldProps.id} className="w-full">
									<SelectValue placeholder="— 不套用，手動輸入 —" />
								</SelectTrigger>
								<SelectContent>
									{templates.map((t) => (
										<SelectItem key={t.id} value={t.id}>
											{t.title}（{t.artist} · {t.date}）
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</Field>
				)}
				<input type="hidden" {...register("templateId")} />

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
						<input type="text" {...register("venueName")} {...fieldProps} className={inputClass} />
					)}
				</Field>

				{/* 座標由搜尋帶入，不手動編輯，用 hidden 欄位讓它進表單並能 round-trip */}
				<input type="hidden" {...register("venueLat")} />
				<input type="hidden" {...register("venueLng")} />
				{venueLat != null && venueLng != null && (
					<p className="text-xs text-muted-foreground">
						已定位：{Number(venueLat).toFixed(5)}, {Number(venueLng).toFixed(5)}
					</p>
				)}

				<Field label="日期" error={errors.date?.message}>
					{(fieldProps) => (
						<input type="date" {...register("date")} {...fieldProps} className={inputClass} />
					)}
				</Field>

				<hr className="border-border" />

				<Field label="票價（選填）" error={errors.ticketPrice?.message}>
					{(fieldProps) => (
						<input
							type="number"
							{...register("ticketPrice")}
							{...fieldProps}
							className={inputClass}
						/>
					)}
				</Field>

				<Field label="評分 1-5（選填）" error={errors.rating?.message}>
					{(fieldProps) => (
						<input
							type="number"
							min={1}
							max={5}
							{...register("rating")}
							{...fieldProps}
							className={inputClass}
						/>
					)}
				</Field>

				<Field
					label="Spotify 歌單 ID（選填，需為公開歌單，否則他人在公開頁看不到）"
					error={errors.spotifyPlaylistId?.message}
				>
					{(fieldProps) => (
						<input
							type="text"
							{...register("spotifyPlaylistId")}
							{...fieldProps}
							className={inputClass}
						/>
					)}
				</Field>

				<hr className="border-border" />

				<Field label="心得（選填）" error={errors.review?.message}>
					{(fieldProps) => (
						<textarea rows={4} {...register("review")} {...fieldProps} className={inputClass} />
					)}
				</Field>

				<Field label="標籤（選填，最多 10 個）" error={errors.tags?.message}>
					{(fieldProps) => (
						<TagInput
							id={fieldProps.id}
							value={tags ?? []}
							onChange={(next) => setValue("tags", next, { shouldValidate: true })}
						/>
					)}
				</Field>

				<ImageUpload
					bucket="covers"
					value={coverImageUrl ?? null}
					onUploaded={(url) => setValue("coverImageUrl", url)}
					onRemoved={() => setValue("coverImageUrl", "")}
				/>
				<input type="hidden" {...register("coverImageUrl")} />

				<label className="flex items-center gap-2 text-sm text-foreground has-disabled:text-muted-foreground">
					<Checkbox
						checked={isPublic}
						onCheckedChange={(checked) => setValue("isPublic", checked === true)}
					/>
					公開這篇紀錄（其他人可在心得分享看到）
				</label>

				<Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
					{isSubmitting && <Spinner />}
					{isSubmitting ? "儲存中…" : recordId ? "更新紀錄" : "儲存紀錄"}
				</Button>
			</fieldset>
		</form>
	);
}
