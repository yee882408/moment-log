"use client";

import { useRef } from "react";
import type { ChangeEvent, ReactElement } from "react";
import { useEditor, useEditorState, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import FileHandler from "@tiptap/extension-file-handler";
import type { Editor } from "@tiptap/core";
import { Bold, Italic, List, ListOrdered, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { uploadImageToBucket } from "@/lib/storage/upload";
import { cn } from "@/lib/utils";

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ReviewEditorProps {
	value: string;
	onChange: (html: string) => void;
	disabled?: boolean;
}

const COVERS_BUCKET = "covers";

interface ToolbarButtonProps {
	onClick: () => void;
	active?: boolean;
	disabled?: boolean;
	label: string;
	children: ReactElement;
}

function ToolbarButton({ onClick, active, disabled, label, children }: ToolbarButtonProps): ReactElement {
	return (
		<button
			type="button"
			// mousedown 先於 click 觸發，預設行為會讓編輯器失焦、清空 selection；
			// preventDefault 讓編輯器全程保持 focus 與原本的游標位置/選取範圍，
			// toggleBulletList() 等命令才會套用在使用者原本選取的內容上，而不是
			// 套用在「已經失焦、selection 不明」的狀態
			onMouseDown={(e) => e.preventDefault()}
			onClick={onClick}
			disabled={disabled}
			aria-label={label}
			aria-pressed={active}
			className={cn(
				"flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50",
				active && "bg-primary/10 text-primary",
			)}
		>
			{children}
		</button>
	);
}

// 心得內文的所見即所得編輯器：基礎排版（粗體/斜體/清單）+ 圖片嵌入。
// value/onChange 是純 HTML 字串，跟 react-hook-form 的 setValue 搭配使用
// （比照 TagInput/ImageUpload 用 setValue 手動掛入表單的既有模式，不是
// register 這種原生 input 才能用的雙向綁定）。
//
// 圖片上傳：Tiptap 的 extension-image 預設貼上/拖曳圖片會轉 base64 內嵌進
// HTML，這裡完全不用預設行為。三種插入圖片的路徑（工具列按鈕選檔、貼上、
// 拖曳）都先呼叫既有的 Supabase Storage 上傳流程拿到 public URL，才用
// setImage 把 URL 寫進內容——沒有任何路徑會把圖片二進位資料塞進 HTML 字串本身
async function insertUploadedImage(editor: Editor, file: File): Promise<void> {
	const result = await uploadImageToBucket(COVERS_BUCKET, file);
	if ("error" in result) {
		toast.error(result.error);
		return;
	}
	editor.chain().focus().setImage({ src: result.url }).run();
}

export function ReviewEditor({ value, onChange, disabled }: ReviewEditorProps): ReactElement {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const editor = useEditor({
		extensions: [
			StarterKit,
			TiptapImage,
			// 貼上/拖曳圖片檔案時攔截預設行為（避免轉 base64），改呼叫
			// insertUploadedImage 走 Storage 上傳；非圖片檔案不處理，交回
			// Tiptap 的預設行為（例如貼上純文字仍正常運作）
			FileHandler.configure({
				allowedMimeTypes: IMAGE_MIME_TYPES,
				onDrop: (currentEditor, files) => {
					files.forEach((file) => void insertUploadedImage(currentEditor, file));
				},
				onPaste: (currentEditor, files) => {
					files.forEach((file) => void insertUploadedImage(currentEditor, file));
				},
			}),
		],
		content: value,
		editable: !disabled,
		immediatelyRender: false,
		onUpdate: ({ editor: currentEditor }) => {
			onChange(currentEditor.getHTML());
		},
		editorProps: {
			attributes: {
				class: "rich-text min-h-32 px-3 py-2 text-sm text-foreground focus:outline-none",
			},
		},
	});

	// editor.isActive(...) 只反映「上一次這個元件 render 時」的狀態；單純移動
	// 游標或改變選取範圍（不改變內容）不會觸發 onUpdate，元件不會 re-render，
	// 工具列的 active 狀態就會停在舊的位置。useEditorState 訂閱 editor 的狀態
	// 變化（含 selection 改變），讓這裡回傳的 toolbarState 在游標移動時也會
	// 觸發 re-render，工具列才能即時反映游標當下所在段落的格式
	const toolbarState = useEditorState({
		editor,
		selector: ({ editor: currentEditor }) => ({
			bold: currentEditor?.isActive("bold") ?? false,
			italic: currentEditor?.isActive("italic") ?? false,
			bulletList: currentEditor?.isActive("bulletList") ?? false,
			orderedList: currentEditor?.isActive("orderedList") ?? false,
		}),
	});

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
		const file = e.target.files?.[0];
		e.target.value = ""; // 允許連續選同一個檔案也能觸發 onChange
		if (file && editor) {
			void insertUploadedImage(editor, file);
		}
	};

	if (!editor || !toolbarState) {
		return <div className="h-40 rounded-lg border border-border bg-background" />;
	}

	return (
		<div className={cn("rounded-lg border border-border bg-card", disabled && "opacity-60")}>
			<div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
				<ToolbarButton
					label="粗體"
					active={toolbarState.bold}
					disabled={disabled}
					onClick={() => editor.chain().focus().toggleBold().run()}
				>
					<Bold className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					label="斜體"
					active={toolbarState.italic}
					disabled={disabled}
					onClick={() => editor.chain().focus().toggleItalic().run()}
				>
					<Italic className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					label="項目清單"
					active={toolbarState.bulletList}
					disabled={disabled}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
				>
					<List className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					label="編號清單"
					active={toolbarState.orderedList}
					disabled={disabled}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
				>
					<ListOrdered className="h-4 w-4" />
				</ToolbarButton>
				<ToolbarButton
					label="插入圖片"
					disabled={disabled}
					onClick={() => fileInputRef.current?.click()}
				>
					<ImageIcon className="h-4 w-4" />
				</ToolbarButton>
			</div>
			<EditorContent editor={editor} />
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleFileChange}
				disabled={disabled}
				className="hidden"
			/>
		</div>
	);
}
