import { z } from "zod";

// 表單數字欄位來自 <input>（字串）；空字串視為「沒填」(undefined)
export function optionalNumber(schema: z.ZodNumber) {
	return z.preprocess(
		(v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
		schema.optional(),
	);
}
