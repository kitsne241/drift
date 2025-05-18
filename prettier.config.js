/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  trailingComma: 'es5',
  semi: false,
  singleQuote: true,
  jsxSingleQuote: true,
  printWidth: 100,
}

export default config

// とりあえず prettier 公式サイトから引っ張ってきた設定

// 冒頭のコメントは JSDoc コメントというもので、JavaScript のオブジェクトに型注釈を行うもの
// TypeScript では専ら型を定義するための JSDoc は必要ないが、
// 他にもオブジェクトの役割の説明など、コードに注釈をするために依然としてよく使われている
// JSDoc コメントは定義の直前に改行を入れずに書くのが正しい書き方とされる
