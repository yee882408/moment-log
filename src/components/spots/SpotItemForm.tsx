"use client";

import { useTransition } from "react";
import type { ReactElement } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addSpotListItem, updateSpotListItem } from "@/lib/actions/spots";
import { spotItemSchema, placeTypeValues, type SpotItemInput } from "@/lib/validation/spot";
import type { SpotListItem } from "@/lib/data/spots";
import { VenueSearch } from "@/components/venue/VenueSearch";
import { ImageUpload } from "@/components/common/ImageUpload";
import { Field, inputClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/Spinner";

const placeTypeLabels: Record<(typeof placeTypeValues)[number], string> = {
	restaurant: "餐廳",
	attraction: "景點",
	other: "其他",
};

// Radix Select 保留空字串當內部「未選擇」訊號，SelectItem 不能用 value=""，
// 這裡用一個佔位值代替「不指定」，選中時再轉換回表單真正要的空字串
const PLACE_TYPE_NONE = "__none__";

interface SpotItemFormProps {
	listId: string;
	// 有帶 editItem = 編輯既有地點，否則新增模式
	editItem?: SpotListItem;
	onSaved: (items: SpotListItem[]) => void;
	onCancel?: () => void; // 編輯模式才需要「取消」回到卡片顯示狀態
	// 搜尋選定地點、或清空表單時通知父層，讓地圖同步顯示/清除暫定 pin
	onPreviewChange: (point: { lat: number; lng: number; label: string } | null) => void;
}

export function SpotItemForm({
	listId,
	editItem,
	onSaved,
	onCancel,
	onPreviewChange,
}: SpotItemFormProps): ReactElement {
	const [isPending, startTransition] = useTransition();
	const isEditing = Boolean(editItem);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors },
	} = useForm<SpotItemInput>({
		resolver: zodResolver(spotItemSchema),
		defaultValues: editItem
			? {
					placeName: editItem.place_name,
					placeLat: editItem.place_lat,
					placeLng: editItem.place_lng,
					// place_type 資料庫用 check constraint 保證只會是這三者之一，
					// Supabase 型別產生器對 check constraint 只推斷成 string，這裡斷言還原
					placeType: (editItem.place_type ?? undefined) as SpotItemInput["placeType"],
					description: editItem.description ?? undefined,
					coverImageUrl: editItem.cover_image_url ?? undefined,
				}
			: undefined,
	});

	const placeLat = watch("placeLat");
	const placeLng = watch("placeLng");
	const placeType = watch("placeType");
	const coverImageUrl = watch("coverImageUrl");

	const handlePlacePick = (label: string, lat: number, lng: number): void => {
		setValue("placeName", label, { shouldValidate: true });
		setValue("placeLat", lat, { shouldValidate: true });
		setValue("placeLng", lng, { shouldValidate: true });
		onPreviewChange({ lat, lng, label });
	};

	const onSubmit = (values: SpotItemInput): void => {
		startTransition(async () => {
			const result = editItem
				? await updateSpotListItem(editItem.id, listId, values)
				: await addSpotListItem(listId, values);
			if ("error" in result) {
				toast.error(result.error);
				return;
			}
			if (!isEditing) {
				// reset() 不帶參數只會還原成 mount 時的 defaultValues；新增模式沒有
				// defaultValues，實際上不會清空欄位（react-hook-form 的常見陷阱），
				// 要明確傳空物件才能真正清掉包含 coverImageUrl 在內的所有欄位
				reset({});
			}
			onPreviewChange(null); // 已送出，清掉暫定 pin
			onSaved(result.items);
		});
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="flex w-full flex-col gap-3">
			<fieldset disabled={isPending} className="flex flex-col gap-3">
				<VenueSearch onPick={handlePlacePick} />

				<Field label="地點名稱" error={errors.placeName?.message}>
					{(fieldProps) => (
						<input
							type="text"
							{...register("placeName")}
							{...fieldProps}
							className={inputClass}
						/>
					)}
				</Field>

				{/* 座標由搜尋帶入，不手動編輯，用 hidden 欄位讓它進表單並能 round-trip */}
				<input type="hidden" {...register("placeLat")} />
				<input type="hidden" {...register("placeLng")} />
				{placeLat != null && placeLng != null ? (
					<p className="text-xs text-muted-foreground">
						已定位：{Number(placeLat).toFixed(5)}, {Number(placeLng).toFixed(5)}
					</p>
				) : (
					<p className="text-xs text-muted-foreground">請先用上方搜尋框定位地點</p>
				)}

				<Field label="地點類型（選填）" error={errors.placeType?.message}>
					{(fieldProps) => (
						<Select
							value={placeType || PLACE_TYPE_NONE}
							onValueChange={(v) =>
								setValue(
									"placeType",
									(v === PLACE_TYPE_NONE ? "" : v) as SpotItemInput["placeType"],
									{ shouldValidate: true },
								)
							}
						>
							<SelectTrigger id={fieldProps.id} className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={PLACE_TYPE_NONE}>— 不指定 —</SelectItem>
								{placeTypeValues.map((v) => (
									<SelectItem key={v} value={v}>
										{placeTypeLabels[v]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
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

				<ImageUpload
					bucket="spot-covers"
					value={coverImageUrl ?? null}
					onUploaded={(url) => setValue("coverImageUrl", url)}
					onRemoved={() => setValue("coverImageUrl", "")}
				/>
				<input type="hidden" {...register("coverImageUrl")} />

				<div className="flex justify-end gap-2">
					{onCancel && (
						<Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
							取消
						</Button>
					)}
					<Button type="submit" disabled={isPending}>
						{isPending && <Spinner />}
						{isPending ? "儲存中…" : isEditing ? "儲存變更" : "新增地點"}
					</Button>
				</div>
			</fieldset>
		</form>
	);
}
