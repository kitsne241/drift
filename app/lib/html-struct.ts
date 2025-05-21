// KaTeX の HTMLElement から構造と座標を抽出する
// 中間層に大量の位置合わせの span が挟まっているので、それらを外してシンプルな階層を得る

// 呼ばれる関数
export const getWholeStruct = (display: HTMLElement) => {
  return getStruct(getDescendants(display, 3)[0] as HTMLElement)
  // katex-display > katex > katex-html > base
}

// HTML 要素の子要素を全て取得
const getChildElems = (element: HTMLElement) => {
  const children = Array.from(element.children) as HTMLElement[]
  const childElems: HTMLElement[] = []

  if (element.classList.contains('katex-html')) {
    // 最上層の要素 katex-html でこれを実行した場合のみ base を飛ばして 2 層下にあるものを得る
    for (const child of children) {
      childElems.push(...getChildElems(child))
    }
  } else {
    for (const child of children) {
      childElems.push(child)
    }
  }
  return childElems
}

// 再帰的にその要素全体の中間構造を得る
const getStruct = (me: HTMLElement): Struct => {
  const childElems = getChildElems(me)

  // その要素が 1 つしか子を含まない場合
  if (childElems.length == 1) {
    return getStruct(childElems[0])
  }

  // その要素が最下層である場合
  if (childElems.length == 0) {
    return {
      element: me,
      children: [] as Struct[],
      character: me.textContent?.trim() || '',
    } as Struct
  }

  // その要素が分数である場合
  if (childElems.length > 2 && childElems[1].className.split(' ').includes('mfrac')) {
    return {
      element: me,
      children: fracStruct(me),
      type: 'Frac',
      Character: me.textContent?.trim() || '',
    } as Struct
  }

  // その要素が単なる記号である場合
  const children = [] as Struct[]
  for (const child of childElems) {
    for (const className of ['mord', 'mbin', 'mrel']) {
      if (child.classList.contains(className)) {
        children.push(getStruct(child))
        break
      }
    }
  }

  return {
    element: me,
    children: children,
    type: 'Linear',
  } as Struct
}

// 分数の Struct を取得
const fracStruct = (me: HTMLElement) => {
  const elements = getDescendants(me.children[1] as HTMLElement, 4)
  if (elements.length != 3) {
    throw new Error('分数の構造が不正です')
  }

  return [
    getStruct(elements[2].children[1] as HTMLElement),
    getStruct(elements[0].children[1] as HTMLElement),
  ]
}

// gens 層だけ下の子要素を取得。そこまでは最初の子を辿る
const getDescendants = (me: HTMLElement, gens: number) => {
  let elem: HTMLElement = me
  for (let i = 0; i < gens - 1; i++) {
    elem = elem.children[0] as HTMLElement
  }
  return getChildElems(elem)
}

// Struct の階層構造を表示
export const structIndent = (scope: Struct, indent: number = 0) => {
  let text =
    '    '.repeat(indent) +
    scope.element.className +
    (scope.character ? ' / ' + scope.character : '')
  for (const child of scope.children) {
    text += '\n' + structIndent(child, indent + 1)
  }
  return text
}
