// KaTeX の HTMLElement から構造と座標を抽出する
// 中間層に大量の位置合わせの span が挟まっているので、それらを外してシンプルな階層を得る

const getChildElems = (element: HTMLElement) => {
  const children = Array.from(element.children) as HTMLElement[]
  const childElems: HTMLElement[] = []

  if (element.className == 'katex-html') {
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

export const getWholeStruct = (display: HTMLElement) => {
  return getStruct(getDescendants(display, 3)[0] as HTMLElement)
  // katex-display > katex > katex-html > base
}

// 再帰的にその要素全体の中間構造を得る
export const getStruct = (me: HTMLElement) => {
  const childElems = getChildElems(me)

  // その要素が最下層である場合
  if (childElems.length == 0) {
    return {
      Element: me,
      Children: [] as Struct[],
      Character: me.textContent?.trim() || '',
    } as Struct
  }

  // その要素が分数である場合
  if (childElems.length > 2 && childElems[1].className.split(' ').includes('mfrac')) {
    return {
      Element: me,
      Children: fracScope(me),
      Type: 'Frac',
      Character: me.textContent?.trim() || '',
    } as Struct
  }

  // その要素が単なる記号である場合
  const children = [] as Struct[]
  for (const child of childElems) {
    for (const className of ['mord', 'mbin', 'mrel']) {
      if (child.className.split(' ').includes(className)) {
        children.push(getStruct(child))
        break
      }
    }
  }

  return {
    Element: me,
    Children: children,
    Type: 'Linear',
  } as Struct
}

// 分数の Struct を scopes に追加
const fracScope = (me: HTMLElement) => {
  const column: Struct[] = []

  for (const grand of getDescendants(me.children[1] as HTMLElement, 4)) {
    const elem = grand.children[1] as HTMLElement
    if (elem.className.split(' ').includes('mord')) {
      column.push(getStruct(elem))
    }
  }
  return column
}
// この状態だと a^2 と a_2 の区別がつかないが、あとでクラス vlist-t2 の存在・不在から区別をつけるように

// Struct の階層構造を表示
export const structIndent = (scope: Struct, indent: number = 0) => {
  let text =
    '    '.repeat(indent) +
    scope.Element.className +
    (scope.Character ? ' / ' + scope.Character : '')
  for (const child of scope.Children) {
    text += '\n' + structIndent(child, indent + 1)
  }
  return text
}

export const getDescendants = (me: HTMLElement, gens: number) => {
  let elem: HTMLElement = me
  for (let i = 0; i < gens - 1; i++) {
    elem = elem.children[0] as HTMLElement
  }
  return getChildElems(elem)
}
