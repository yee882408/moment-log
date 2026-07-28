// 票價幣別：新增/編輯表單的下拉選單、驗證、顯示格式化共用同一份定義，
// 避免各處各自硬寫幣別清單/符號對照表不同步
export const TICKET_CURRENCIES = ["TWD", "JPY", "KRW", "USD"] as const;

export type TicketCurrency = (typeof TICKET_CURRENCIES)[number];

const CURRENCY_SYMBOLS: Record<TicketCurrency, string> = {
	TWD: "NT$",
	JPY: "¥",
	KRW: "₩",
	USD: "$",
};

// 舊資料沒有 ticket_currency 欄位時（DB migration 前）一律視為台幣
export const DEFAULT_TICKET_CURRENCY: TicketCurrency = "TWD";

// 格式化票價顯示，例如 formatTicketPrice(6800, "TWD") -> "NT$6,800"
export function formatTicketPrice(price: number, currency: TicketCurrency): string {
	const symbol = CURRENCY_SYMBOLS[currency];
	return `${symbol}${price.toLocaleString()}`;
}
