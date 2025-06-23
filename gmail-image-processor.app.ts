import { defineApp } from "@pipedream/types";

export default defineApp({
	type: "app",
	app: "gmail-image-processor",
	propDefinitions: {
		email: {
			type: "object",
			label: "Email Data",
			description:
				"Email data from Gmail trigger (e.g., steps.trigger.event)",
		},
		maxFileSize: {
			type: "integer",
			label: "Max File Size (MB)",
			description: "Maximum file size to download (in MB)",
			default: 25,
			min: 1,
			max: 100,
		},
		enableVisionFiltering: {
			type: "boolean",
			label: "Enable Smart Image Filtering (Optional)",
			description:
				"Use Google Cloud Vision to filter out logos, icons, tracking pixels, and other non-content images",
			default: false,
			optional: true,
		},
		visionFilteringStrength: {
			type: "string",
			label: "Filtering Strength",
			description: "How aggressively to filter non-content images",
			options: [
				{
					label: "Conservative (High confidence only)",
					value: "conservative",
				},
				{ label: "Balanced (Recommended)", value: "balanced" },
				{
					label: "Aggressive (Lower confidence threshold)",
					value: "aggressive",
				},
			],
			default: "balanced",
			optional: true,
		},
		skipTinyImages: {
			type: "boolean",
			label: "Skip Tiny Images",
			description:
				"Automatically skip very small images (likely tracking pixels)",
			default: true,
			optional: true,
		},

		// Drive uploader props
		parentFolderId: {
			type: "string",
			label: "Parent Folder ID (Optional)",
			description:
				"ID of existing Google Drive folder to use as parent. Leave empty to use Drive root.",
			optional: true,
		},
		rootFolderName: {
			type: "string",
			label: "Root Folder Name",
			description:
				"Name of the root folder to create (inside parent folder if specified)",
			default: "Gmail_Images",
			optional: true,
		},
		createRootFolder: {
			type: "boolean",
			label: "Create Root Folder",
			description: "Create a root folder to organize all sender folders",
			default: false,
			optional: true,
		},
	},
	methods: {
		/**
		 * Get email data from steps or props
		 */
		getEmailData(steps: any): any {
			const email = this.email || steps.trigger?.event;
			if (!email) {
				throw new Error("No email data provided from Gmail trigger");
			}
			return email;
		},

		/**
		 * Create standardized error with context
		 */
		createError(message: string, context: Record<string, any> = {}): Error {
			const error = new Error(message);
			(error as any).context = context;
			return error;
		},

		/**
		 * Log processing stage with emoji
		 */
		logStage(stage: string, message: string, data: any = null): void {
			const stageEmojis: Record<string, string> = {
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
			};

			const emoji = stageEmojis[stage] || "📋";
			console.log(`${emoji} ${message}`);

			if (data) {
				console.log("   Data:", JSON.stringify(data, null, 2));
			}
		},
	},
});
