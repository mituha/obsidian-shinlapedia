
export interface ShinLapediaPluginSettings {
	geminApiKey: string;

	//辞典用のフォルダーを制限する場合
	bookFolder: string;
	bookTitle: string;
	bookDescription: string;

	authorName: string;
	authorDescription: string;
}

export const DEFAULT_SETTINGS: ShinLapediaPluginSettings = {
	geminApiKey: 'default',

	bookFolder: '',
	bookTitle: '',
	bookDescription: '',

	authorName: '',
	authorDescription: ''
}
