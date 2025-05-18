開発中のメモ。

## 初期化とビルド

Vite による Web フロントエンド開発にて板についたセットアップのパターンなど。

### セットアップ

```sh
npm create vite@latest
```

によってプロジェクトをセットアップする。今回は React Router テンプレートを用いた。そのまま React の環境を用いて後から React Router を導入しようとすると少し手間がかかるそう。

### pnpm

デフォルトの npm はプロジェクトのルートの node_modules にパッケージを保存するが、pnpm は node_modules にシンボリックリンクを置いて、各パッケージをデバイス共通で使えるようにしている。本来はそれぞれのプロジェクトでパッケージを保存すべきところなので、デバイスの容量の大幅な節約に役立っている。セットアップ直後に

```sh
npm install -g pnpm
```

によって pnpm をインストールし、`pnpm i` によって依存パッケージをインストールするとよい。

```sh
pnpm store prune
```

は、そのデバイスのパッケージのうちすでに使われていないものをすべて削除するコマンド。これに加えてプロジェクトのルートの node_modules ディレクトリを削除したあと、再度 `pnpm i` を実行するとパッケージをリフレッシュできる。

### ESLint と Prettier

```sh
pnpm install --save-dev eslint prettier eslint-plugin-prettier eslint-config-prettier
```

- ESLint の設定は eslintrc.json, .eslintrc.js, .eslintrc.yaml, .eslintrc.yml, eslint.config.js, .eslintrc.cjs
- Prettier の設定は .prettierrc, .prettierrc.json, prettier.config.js, .prettierrc.yml, .prettierrc.toml

などに書く。それぞれ、どれも出来ることは同じ。ESLint の設定ファイルは以下を実行することで自動生成されるが、Prettier の設定ファイルに関しては自分で作るらしい。

```sh
npx eslint --init
```

とりあえずこのリポジトリには eslint.config.js と prettier.config.js を置いた。

## ファイル群

これまで経験した Web 開発（Vue 3）で見かけなかったものについての補足。

### pnpm-workspace.yaml

本来は、モノリポとして Web アプリを開発する場合に各プロジェクトのディレクトリ（ワークスペース）のパスを書いておくための設定ファイル。典型的には以下のように書くらしい。

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

この Drift は単一のプロジェクトとして開発しているので、複数のプロジェクトを共存させる予定はない。しかし、この pnpm-workspace.yaml は pnpm のセキュリティ設定の記録先としても使われ、単一プロジェクトの開発でも必要になることがあるらしい。

pnpm はセキュリティ対策としてビルドスクリプトをデフォルトで無視するようになっているが、ESBuild はコードのトランスパイル（TSX → JavaScript）を担い、開発環境のホットリロードでも動く不可欠なライブラリなので、常に動かせるように特別に権限設定を書いておきたい。そのために pnpm-workspace.yaml が使われている。

### pnpm-lock.yaml

そのまま npm を使っているときに存在した package-lock.json の pnpm における代替。名目上必要なパッケージを記述した package.json に対して、依存関係も含めた実質的に必要なパッケージをすべて記述したもの。

### react-router.config.ts

名前の通り、React Router の設定を記述する。今のところ SSR を有効にする設定のみ書かれている。

### root.tsx

Vue 構成でいうところの index.html + App.vue + NotFound.vue に相当する設定を一手に引き受ける。

- index.html に相当する部分は、HTML をそのまま書くことなく、TypeScript オブジェクトとして links（favicon やフォントの読み込み）を小分けにするとか小綺麗な書き方ができる。

- Vue では「その他任意のルートは NotFound.vue」という場合分けをしていたが、React Router ではルートが見つからない時に明示的に 404 エラーを起こして ErrorBoundary で処理するような仕組みになっていそう。

### app.css

Web アプリ全体のデフォルトスタイルを規定する CSS ファイル。

Tailwind CSS v4 からは tailwind.config.ts を廃止してこの app.css のようなデフォルト CSS（`@import "tailwindcss"` されていることが必要）に機能を移しているので、ここでカスタム色を規定することもできる。

[Tailwind CSS で用意されている色](https://tailwindcss.com/docs/colors) は `bg-red-500` のように 100 から 900 までの数値で明るさを指定する。カスタム色・white・black は色名のみを用いることができる。

## Vue との対応

### computed → useMemo

```ts
const double = computed(() => count.value * 2)
→ const double = useMemo(() => count * 2, [count])
```

### ref → useState

```ts
const double = ref(0)
→ const [double, setDouble] = useState(0)
```

React では基本的に状態はイミュータブルなオブジェクトを使う。ミュータブルなオブジェクトを使う場合は、全体を再定義してしっかり参照ごと変える必要がある

```ts
setUser(prev => ({ ...prev, age: 31 }));
```

### watch → useEffect

```ts
watch(() => count.value, console.log("Changed!"), { immediate: true })
→ useEffect(() => {console.log("Changed!")}, [count])
```

### onMounted & onBeforeUnmount → useEffect

```ts
onMounted(() => console.log("Mounted!"))
& onBeforeUnmount(() => console.log("Unmounted!"))
→ useEffect(() => {console.log("Mounted!"); return () => {console.log("Unmounted!")}}, [])
```
ちなみに [] がない場合は毎回のレンダリングで実行される関数になる。