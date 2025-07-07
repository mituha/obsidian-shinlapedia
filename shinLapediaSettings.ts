
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
	geminApiKey: '',

	bookFolder: '',
	bookTitle: 'ダンジョン辞典',
	bookDescription: '現代に突如現れたダンジョンに関する情報をまとめた攻略本とも言える辞典。\nダンジョンの構造やモンスター、アイテムなどの情報が網羅されている。\nこの辞典は、ダンジョン探索者や研究者にとって貴重な資料となる。\nダンジョンの発生によりゲームのRPGのような剣と魔法のファンタジーな世界が現実となった。\nこの辞典は、ダンジョンの謎を解明し、探索者たちの安全を確保するための重要なツールである。\n\nこの辞典は、ダンジョンの発生によりゲームのRPGのような剣と魔法のファンタジーな世界が現実となった。\nこの辞典は、ダンジョンの謎を解明し、探索者たちの安全を確保するための重要なツールである。',

	authorName: '猫乃わん太',
	authorDescription: 'ぬいぐるみ系VTuber。\nブラックアンドタンの柴犬のようなぽってりとした二足歩行のぬいぐるみの姿をしている。\n語尾に「わん」をつけるのが特徴。\n一人称は「ボク」',
}
