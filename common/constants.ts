// File size and validation constants
export const FILE_SIZE = {
	MAX_SIZE_MB: 25,
	MAX_SIZE_BYTES: 25 * 1024 * 1024,
	TINY_IMAGE_THRESHOLD: 1024, // 1KB - likely tracking pixels
} as const;

// Supported image types
export const IMAGE_TYPES = {
	SUPPORTED_MIME_TYPES: [
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
		"image/bmp",
		"image/tiff",
		"image/svg+xml",
	],
	SUPPORTED_EXTENSIONS: [
		".jpg",
		".jpeg",
		".png",
		".gif",
		".webp",
		".bmp",
		".tiff",
		".svg",
	],
} as const;

// Text content types for parsing
export const TEXT_TYPES = {
	SUPPORTED_MIME_TYPES: [
		"text/plain",
		"text/html",
		"text/css",
		"text/javascript",
		"application/json",
	],
} as const;

// Google Drive URL patterns
export const DRIVE_PATTERNS = [
	/https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/g,
	/https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/g,
	/https:\/\/docs\.google\.com\/.*\/d\/([a-zA-Z0-9_-]+)/g,
] as const;

// Google Cloud Vision API configuration
export const VISION_API = {
	// Non-content image labels to filter out
	NON_CONTENT_LABELS: [
		// UI Elements & Icons
		"icon",
		"logo",
		"symbol",
		"button",
		"interface",
		"menu",
		"toolbar",
		"navigation",
		"cursor",
		"pointer",
		"arrow",
		"chevron",
		"hamburger",

		// Tracking & Analytics
		"pixel",
		"beacon",
		"tracker",
		"analytics",
		"measurement",
		"counter",
		"invisible",
		"transparent",
		"hidden",
		"spacer",
		"separator",

		// Social Media & Platforms
		"facebook",
		"twitter",
		"instagram",
		"linkedin",
		"youtube",
		"tiktok",
		"snapchat",
		"pinterest",
		"reddit",
		"whatsapp",
		"telegram",
		"discord",
		"social",
		"share",
		"follow",
		"like",
		"subscribe",

		// Branding & Marketing (non-content)
		"watermark",
		"stamp",
		"seal",
		"badge",
		"emblem",
		"insignia",
		"trademark",
		"copyright",
		"brand mark",

		// Technical Elements
		"qr code",
		"barcode",
		"code",
		"matrix",
		"pattern",
		"grid",
		"placeholder",
		"loading",
		"spinner",
		"progress",

		// Generic Shapes (often decorative)
		"rectangle",
		"square",
		"circle",
		"triangle",
		"line",
		"dot",
		"shape",
		"geometric",
		"abstract pattern",
	],

	// Filtering strength configurations
	FILTERING_STRENGTH: {
		conservative: {
			confidenceThreshold: 0.8,
			description: "High confidence only - keeps more images",
		},
		balanced: {
			confidenceThreshold: 0.6,
			description: "Balanced filtering - recommended default",
		},
		aggressive: {
			confidenceThreshold: 0.4,
			description:
				"Lower confidence threshold - filters more aggressively",
		},
	},

	// Vision API request configuration
	REQUEST_CONFIG: {
		maxResults: 20,
		features: [
			{ type: "LABEL_DETECTION", maxResults: 20 },
			{ type: "TEXT_DETECTION", maxResults: 5 },
			{ type: "LOGO_DETECTION", maxResults: 10 },
		],
	},
} as const;

// Google Drive API configuration
export const DRIVE_API = {
	FIELDS: "id,name,mimeType,size,createdTime,modifiedTime,permissions",
	FOLDER_MIME_TYPE: "application/vnd.google-apps.folder",
} as const;

// Drive folder and upload settings
export const DRIVE_FOLDER_SETTINGS = {
	DEFAULT_ROOT_FOLDER: "Gmail_Images",
	MAX_FOLDER_NAME_LENGTH: 100,
	INVALID_CHARS_PATTERN: /[<>:"/\\|?*\x00-\x1f]/g,
	REPLACEMENT_CHAR: "_",
} as const;

export const UPLOAD_SETTINGS = {
	MAX_RETRIES: 3,
	RETRY_DELAY_MS: 1000,
	CHUNK_SIZE: 1024 * 1024, // 1MB chunks
	TIMEOUT_MS: 30000, // 30 seconds
} as const;

// Error types for categorization
export const ERROR_TYPES = {
	VALIDATION: "VALIDATION_ERROR",
	NETWORK: "NETWORK_ERROR",
	API: "API_ERROR",
	FILE_SYSTEM: "FILE_SYSTEM_ERROR",
	AUTHENTICATION: "AUTH_ERROR",
	QUOTA: "QUOTA_ERROR",
	PERMISSION: "PERMISSION_ERROR",
} as const;

// Logging emojis for better visual feedback
export const LOG_EMOJIS = {
	start: "🚀",
	detection: "🔍",
	extraction: "📥",
	vision: "👁️",
	folder: "📁",
	upload: "☁️",
	complete: "✅",
	error: "❌",
	warning: "⚠️",
	info: "ℹ️",
	success: "🎉",
	processing: "⚙️",
	retry: "🔄",
	skip: "⏭️",
} as const;

// Type definitions for constants
export type FileSizeConfig = typeof FILE_SIZE;
export type ImageTypesConfig = typeof IMAGE_TYPES;
export type TextTypesConfig = typeof TEXT_TYPES;
export type DrivePattern = (typeof DRIVE_PATTERNS)[number];
export type VisionApiConfig = typeof VISION_API;
export type DriveApiConfig = typeof DRIVE_API;
export type DriveFolderSettings = typeof DRIVE_FOLDER_SETTINGS;
export type UploadSettings = typeof UPLOAD_SETTINGS;
export type ErrorType = (typeof ERROR_TYPES)[keyof typeof ERROR_TYPES];
export type LogEmoji = (typeof LOG_EMOJIS)[keyof typeof LOG_EMOJIS];
