// Shared Utility Functions
// Pure functions extracted from main component for better testability and reusability

import { FILE_SIZE, IMAGE_TYPES, FOLDER_NAME } from "./constants.js";

// === FILE SIZE UTILITIES ===

/**
 * Formats file size in bytes to human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted string like "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes";

	const { UNITS, CONVERSION_FACTOR } = FILE_SIZE;
	const i = Math.floor(Math.log(bytes) / Math.log(CONVERSION_FACTOR));
	const size = parseFloat(
		(bytes / Math.pow(CONVERSION_FACTOR, i)).toFixed(2)
	);

	return `${size} ${UNITS[i]}`;
}

/**
 * Checks if file size exceeds the maximum allowed size
 * @param fileSize - Size in bytes
 * @param maxSizeMB - Maximum size in MB (default: 25)
 * @returns True if file exceeds max size
 */
export function exceedsMaxSize(fileSize: number, maxSizeMB = 25): boolean {
	const maxSizeBytes = maxSizeMB * FILE_SIZE.BYTES_PER_MB;
	return fileSize > maxSizeBytes;
}

// === MIME TYPE UTILITIES ===

/**
 * Checks if a given MIME type is an image type
 * @param mimeType - MIME type string
 * @returns True if it's a supported image type
 */
export function isImageMimeType(mimeType: string): boolean {
	return (IMAGE_TYPES as readonly string[]).includes(mimeType);
}

// === FILENAME UTILITIES ===

/**
 * Generates a filename with timestamp if none provided
 * @param mimeType - MIME type to determine extension
 * @returns Generated filename with timestamp
 */
export function generateFilename(mimeType: string): string {
	const extension = mimeType.split("/")[1] || "jpg";
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	return `image_${timestamp}.${extension}`;
}

/**
 * Creates a temporary file path for processing
 * @param filename - Original filename
 * @param prefix - Optional prefix for the temp file
 * @returns Full temporary file path
 */
export function createTempFilePath(filename: string, prefix = ""): string {
	const timestamp = Date.now();
	const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
	return `/tmp/${timestamp}_${prefix}${sanitizedFilename}`;
}

/**
 * Sanitizes folder name by removing invalid characters and truncating
 * @param name - Raw folder name
 * @returns Sanitized folder name safe for file systems
 */
export function sanitizeFolderName(name: string): string {
	return (
		name
			.replace(FOLDER_NAME.INVALID_CHARS, "_")
			.replace(/_{2,}/g, "_")
			.replace(/^_|_$/g, "")
			.trim()
			.substring(0, FOLDER_NAME.MAX_LENGTH) ||
		FOLDER_NAME.FALLBACK
	);
}