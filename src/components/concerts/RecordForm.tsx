"use client";

import type { ReactElement } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRecord, updateRecord } from "@/lib/actions/records";
import { recordSchema, type RecordInput } from "@/lib/validation/record";
import { ImageUpload } from "@/components/common/ImageUpload";
import { TagInput } from "@/components/common/TagInput";
import { ReviewEditor } from "@/components/richtext/ReviewEditor";
import { Field, inputClass } from "@/components/ui/Field";
import { FormSection } from "@/components/ui/FormSection";
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
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { TICKET_CURRENCIES, DEFAULT_TICKET_CURRENCY, type TicketCurrency } from "@/lib/currency";
import type { TemplateOption } from "@/lib/data/concerts";

const SPOTIFY_PREVIEW_DEBOUNCE_MS = 500;

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
		defaultValues: { isPublic: false, ticketCurrency: DEFAULT_TICKET_CURRENCY, ...defaultValues },
	});

	const coverImageUrl = watch("coverImageUrl");
	const isPublic = watch("isPublic");
	const ticketCurrency = watch("ticketCurrency");
	const tags = watch("tags");
	const review = watch("review");
	const spotifyPlaylistId = watch("spotifyPlaylistId");
	// 防抖：不然每打一個字元就會重新載入整個 iframe（連帶重新跟 Spotify 交握），
	// 使用者打字途中畫面會一直閃爍/卡頓
	const debouncedSpotifyPlaylistId = useDebouncedValue(
		spotifyPlaylistId?.trim(),
		SPOTIFY_PREVIEW_DEBOUNCE_MS
	);

	// 選範本 → 複製各欄位進表單（仍可再編輯）；templateId 記錄來源。venueLat/
	// venueLng 只在套用範本時靜默帶入（範本本身建立時就有座標），表單不再提供
	// 搜尋定位 UI，使用者也不會手動編輯這兩個值——場館名稱改回純文字輸入，
	// 座標欄位保留只是為了不影響既有的 /routes 資料來源與 concerts 範本管理
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
		<form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-5">
			<fieldset disabled={isSubmitting} className="flex flex-col gap-5">
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

				<FormSection label="基本資訊" noTopBorder>
					<Field label="標題" error={errors.title?.message}>
						{(fieldProps) => (
							<input type="text" {...register("title")} {...fieldProps} className={inputClass} />
						)}
					</Field>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Field label="藝人" error={errors.artist?.message}>
							{(fieldProps) => (
								<input type="text" {...register("artist")} {...fieldProps} className={inputClass} />
							)}
						</Field>

						<Field label="日期" error={errors.date?.message}>
							{(fieldProps) => (
								<input type="date" {...register("date")} {...fieldProps} className={inputClass} />
							)}
						</Field>
					</div>

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

					<Field label="座位區域（選填）" error={errors.seatInfo?.message}>
						{(fieldProps) => (
							<input type="text" {...register("seatInfo")} {...fieldProps} className={inputClass} />
						)}
					</Field>

					{/* 座標不再由表單收集，只有套用範本時靜默帶入（見 applyTemplate），
					    hidden 欄位讓它能進表單並在送出時 round-trip */}
					<input type="hidden" {...register("venueLat")} />
					<input type="hidden" {...register("venueLng")} />
				</FormSection>

				<FormSection label="票務與評分">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<Field label="票價（選填）" error={errors.ticketPrice?.message}>
							{(fieldProps) => (
								<div className="flex gap-2">
									<Select
										value={ticketCurrency}
										onValueChange={(v) => setValue("ticketCurrency", v as TicketCurrency)}
									>
										<SelectTrigger className="w-24 shrink-0">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{TICKET_CURRENCIES.map((c) => (
												<SelectItem key={c} value={c}>
													{c}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<input
										type="number"
										{...register("ticketPrice")}
										{...fieldProps}
										className={inputClass}
									/>
								</div>
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
					</div>

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

					{debouncedSpotifyPlaylistId && (
						<div className="flex flex-col gap-1">
							<iframe
								title="Spotify 歌單預覽"
								src={`https://open.spotify.com/embed/playlist/${debouncedSpotifyPlaylistId}`}
								width="100%"
								height="352"
								loading="lazy"
								allow="encrypted-media"
								className="rounded-xl"
							/>
							<p className="text-xs text-muted-foreground">
								看到歌單正常顯示即代表 ID 正確；若顯示錯誤，確認歌單是否為公開。
							</p>
						</div>
					)}
				</FormSection>

				<FormSection label="心得與標籤">
					<Field label="心得（選填）" error={errors.review?.message}>
						{() => (
							<ReviewEditor
								value={review ?? ""}
								onChange={(html) => setValue("review", html, { shouldValidate: true })}
								disabled={isSubmitting}
							/>
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
				</FormSection>

				<FormSection label="封面與公開設定">
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
						公開（其他人可在心得分享看到）
					</label>
				</FormSection>

				<Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
					{isSubmitting && <Spinner />}
					{isSubmitting ? "儲存中…" : recordId ? "更新紀錄" : "儲存紀錄"}
				</Button>
			</fieldset>
		</form>
	);
}
