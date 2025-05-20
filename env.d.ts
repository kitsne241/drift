/// <reference types="vite/client" />

// HTML の構造を抽出した構造。ほぼ LaTeX 記法に対応
type Struct = {
  Element: HTMLElement // Scope で複数の要素からなる矩形範囲を得るために HTMLElement そのものを保存
  Children: Struct[]
  Type?: 'Linear' | 'Frac' // Linear は普通に並んでいる記号、Frac は分数
  Character?: string // 最下層のみ文字記号の情報をもつ
}

// 数式がもつ意味上の構造
type Scope = {
  Rect?: DOMRect // 一旦 Rect なしで構築して、あとで対応させる
  Type?: 'Sum' | 'Product' | 'Frac'
  Children: Scope[]
  Character?: string
}

// 1. LaTeX 記法を KaTeX によって数式表示
// 2. 数式の HTML 構造から抽出して Struct を生成。A sin x
// 3. Struct の記号の内容をもとに Scope を生成。A (sin x)
