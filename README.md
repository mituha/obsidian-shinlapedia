# Obsidian Sample Plugin
# Obsidian サンプルプラグイン

This is a sample plugin for Obsidian (https://obsidian.md).
これは Obsidian (https://obsidian.md) 用のサンプルプラグインです。

This project uses TypeScript to provide type checking and documentation.
このプロジェクトは TypeScript を使用して型チェックとドキュメントを提供します。
The repo depends on the latest plugin API (obsidian.d.ts) in TypeScript Definition format, which contains TSDoc comments describing what it does.
このリポジトリは、最新のプラグインAPI（obsidian.d.ts、TypeScript定義形式）に依存しており、TSDocコメントでその機能が説明されています。

This sample plugin demonstrates some of the basic functionality the plugin API can do.
このサンプルプラグインは、プラグインAPIでできる基本的な機能のいくつかを示しています。
- Adds a ribbon icon, which shows a Notice when clicked.
- リボンアイコンを追加し、クリックすると通知を表示します。
- Adds a command "Open Sample Modal" which opens a Modal.
- 「サンプルモーダルを開く」コマンドを追加し、モーダルを開きます。
- Adds a plugin setting tab to the settings page.
- 設定ページにプラグイン設定タブを追加します。
- Registers a global click event and output 'click' to the console.
- グローバルクリックイベントを登録し、コンソールに「click」と出力します。
- Registers a global interval which logs 'setInterval' to the console.
- グローバルインターバルを登録し、コンソールに「setInterval」と出力します。

## First time developing plugins?
## 初めてプラグインを開発する場合

Quick starting guide for new plugin devs:
新しいプラグイン開発者向けクイックスタートガイド：

- Check if [someone already developed a plugin for what you want](https://obsidian.md/plugins)! There might be an existing plugin similar enough that you can partner up with.
- [既に誰かがあなたの欲しい機能のプラグインを開発していないか](https://obsidian.md/plugins)を確認しましょう！似たプラグインがあれば協力できるかもしれません。
- Make a copy of this repo as a template with the "Use this template" button (login to GitHub if you don't see it).
- このリポジトリを「Use this template」ボタンでテンプレートとしてコピーします（ボタンが見えない場合はGitHubにログインしてください）。
- Clone your repo to a local development folder. For convenience, you can place this folder in your `.obsidian/plugins/your-plugin-name` folder.
- リポジトリをローカルの開発フォルダにクローンします。便利なように、このフォルダを `.obsidian/plugins/your-plugin-name` に置くこともできます。
- Install NodeJS, then run `npm i` in the command line under your repo folder.
- NodeJSをインストールし、リポジトリフォルダでコマンドラインから `npm i` を実行します。
- Run `npm run dev` to compile your plugin from `main.ts` to `main.js`.
- `npm run dev` を実行して、`main.ts` から `main.js` へプラグインをコンパイルします。
- Make changes to `main.ts` (or create new `.ts` files). Those changes should be automatically compiled into `main.js`.
- `main.ts` を編集（または新しい `.ts` ファイルを作成）します。これらの変更は自動的に `main.js` にコンパイルされます。
- Reload Obsidian to load the new version of your plugin.
- Obsidian をリロードして新しいバージョンのプラグインを読み込みます。
- Enable plugin in settings window.
- 設定ウィンドウでプラグインを有効にします。
- For updates to the Obsidian API run `npm update` in the command line under your repo folder.
- Obsidian API の更新には、リポジトリフォルダで `npm update` を実行します。

## Releasing new releases
## 新しいリリースの公開

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- `manifest.json` を新しいバージョン番号（例: `1.0.1`）と、最新リリースに必要な最小Obsidianバージョンで更新します。
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- `versions.json` ファイルに `"新しいプラグインバージョン": "最小Obsidianバージョン"` を追加し、古いObsidianでも互換性のあるプラグインがダウンロードできるようにします。
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- 新しいバージョン番号を「タグバージョン」として使い、新しいGitHubリリースを作成します。バージョン番号は正確に記載し、`v`のプレフィックスは付けません。例: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- `manifest.json`, `main.js`, `styles.css` をバイナリアタッチメントとしてアップロードします。注意: manifest.json はリポジトリのルートとリリースの両方に必要です。
- Publish the release.
- リリースを公開します。

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> `manifest.json` の `minAppVersion` を手動で更新した後、`npm version patch`、`npm version minor`、`npm version major` を実行するとバージョンアップ作業を簡略化できます。
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`
> このコマンドは `manifest.json` と `package.json` のバージョンを上げ、`versions.json` に新しいバージョンのエントリを追加します。

## Adding your plugin to the community plugin list
## プラグインをコミュニティプラグインリストに追加する

- Check the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
- [プラグインガイドライン](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines) を確認します。
- Publish an initial version.
- 最初のバージョンを公開します。
- Make sure you have a `README.md` file in the root of your repo.
- リポジトリのルートに `README.md` ファイルがあることを確認します。
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.
- https://github.com/obsidianmd/obsidian-releases でプルリクエストを作成し、プラグインを追加します。

## How to use
## 使い方

- Clone this repo.
- このリポジトリをクローンします。
- Make sure your NodeJS is at least v16 (`node --version`).
- NodeJSがv16以上であることを確認します（`node --version`）。
- `npm i` or `yarn` to install dependencies.
- 依存関係をインストールするには `npm i` または `yarn` を実行します。
- `npm run dev` to start compilation in watch mode.
- `npm run dev` でウォッチモードでコンパイルを開始します。

## Manually installing the plugin
## プラグインの手動インストール

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.
- `main.js`, `styles.css`, `manifest.json` をあなたのボールトの `VaultFolder/.obsidian/plugins/your-plugin-id/` にコピーします。

## Improve code quality with eslint (optional)
## eslintでコード品質を向上させる（任意）
- [ESLint](https://eslint.org/) is a tool that analyzes your code to quickly find problems. You can run ESLint against your plugin to find common bugs and ways to improve your code. 
- [ESLint](https://eslint.org/) はコードを解析して問題を素早く見つけるツールです。プラグインに対してESLintを実行し、一般的なバグや改善点を見つけることができます。
- To use eslint with this project, make sure to install eslint from terminal:
- このプロジェクトでeslintを使うには、ターミナルからeslintをインストールしてください：
  - `npm install -g eslint`
  - `npm install -g eslint`
- To use eslint to analyze this project use this command:
- このプロジェクトを解析するには次のコマンドを使います：
  - `eslint main.ts`
  - `eslint main.ts`
  - eslint will then create a report with suggestions for code improvement by file and line number.
  - eslintはファイルと行番号ごとに改善提案を含むレポートを作成します。
- If your source code is in a folder, such as `src`, you can use eslint with this command to analyze all files in that folder:
- ソースコードが `src` などのフォルダにある場合、次のコマンドでそのフォルダ内の全ファイルを解析できます：
  - `eslint .\src\`
  - `eslint .\src\`

## Funding URL
## 資金提供URL

You can include funding URLs where people who use your plugin can financially support it.
プラグイン利用者が金銭的に支援できる資金提供URLを含めることができます。

The simple way is to set the `fundingUrl` field to your link in your `manifest.json` file:
簡単な方法は、`manifest.json` の `fundingUrl` フィールドにリンクを設定することです：

```json
{
    "fundingUrl": "https://buymeacoffee.com"
}
```
```json
{
    "fundingUrl": "https://buymeacoffee.com"
}
```

If you have multiple URLs, you can also do:
複数のURLがある場合は、次のようにもできます：

```json
{
    "fundingUrl": {
        "Buy Me a Coffee": "https://buymeacoffee.com",
        "GitHub Sponsor": "https://github.com/sponsors",
        "Patreon": "https://www.patreon.com/"
    }
}
```
```json
{
    "fundingUrl": {
        "Buy Me a Coffee": "https://buymeacoffee.com",
        "GitHub Sponsor": "https://github.com/sponsors",
        "Patreon": "https://www.patreon.com/"
    }
}
```

## API Documentation
## APIドキュメント

See https://github.com/obsidianmd/obsidian-api
https://github.com/obsidianmd/obsidian-api を参照してください。
