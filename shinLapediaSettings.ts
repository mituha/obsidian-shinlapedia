
export interface ShinLapediaPluginSettings {
	geminApiKey: string;

	bookTitle: string;
	bookDescription: string;

	authorName: string;
	authorDescription: string;
}

export const DEFAULT_SETTINGS: ShinLapediaPluginSettings = {
	geminApiKey: 'default',

	bookTitle: '',
	bookDescription: '',

	authorName: '',
	authorDescription: ''
}
