/// <reference types="vite/client" />

// HTML の構造を抽出したスコープ。ほぼ LaTeX 記法に対応
type Struct = {
  Element: HTMLElement // Scope で複数の要素からなる矩形範囲を得るために HTMLElement そのものを保存
  Children: Struct[]
  Type?: 'Linear' | 'Frac' // Linear は普通に並んでいる記号、Frac は分数
  Character?: string // 最下層のみ文字記号の情報をもつ
}

// // Struct より細かい
// type Scope = {
//   Rect: DOMRect
//   Type: 'Sum' | 'Product' | 'SupSub'
//   Children: Scope[]
//   Character?: string
// }

// 1. LaTeX 記法を KaTeX によって数式表示
// 2. 数式の HTML 構造から抽出して Struct を生成。A sin x
// 3. Struct の記号の内容をもとに Scope を生成。A (sin x)
