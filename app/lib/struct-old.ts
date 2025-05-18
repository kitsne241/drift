// KaTeX の HTMLElement から構造と座標を抽出する
// 中間層に大量の位置合わせの span が挟まっているので、それらを外してシンプルな階層を得る

const getChildElems = (element: HTMLElement) => {
  const childElems: HTMLElement[] = []
  if (element.className == 'katex-html') {
    // 最上層の要素 katex-html でこれを実行した場合のみ base を飛ばして 2 層下にあるものを得る
    const children = Array.from(element.children) as HTMLElement[]
    for (const child of children) {
      const grandChildren = Array.from(child.children) as HTMLElement[]
      for (const grand of grandChildren) {
        childElems.push(grand)
      }
    }
  } else {
    const children = Array.from(element.children) as HTMLElement[]
    for (const child of children) {
      childElems.push(child)
    }
  }
  return childElems
}

export const getWholeStruct = (display: HTMLElement) => {
  return getStruct(display.children[0].children[0] as HTMLElement)
  // katex-display > katex > katex-html > base
}

// 再帰的にその要素全体の Struct を得る
export const getStruct = (me: HTMLElement) => {
  const childElems = getChildElems(me)

  // その要素が最下層である場合
  if (childElems.length == 0) {
    return {
      Element: me,
      Children: [] as Struct[],
      Character: me.textContent?.trim() || '',
    }
  }

  const children = [] as Struct[]
  for (const child of childElems) {
    if (child.className.split(' ').includes('sqrt')) {
      pushSqrtScope(children, child)
      continue
    }

    if (child.className.split(' ').includes('mtable')) {
      pushTableScope(children, child)
      continue
    }

    let flag = false
    for (const className of ['msupsub', 'op-limits', 'mfrac', 'overline', 'accent']) {
      if (child.className.split(' ').includes(className)) {
        pushVerticalScope(children, child)
        flag = true
        break
      }
    }
    if (flag) {
      continue
    }

    for (const className of [
      'mord',
      'mbin',
      'mrel',
      'mopen',
      'mclose',
      'mop',
      'mpunct',
      'minner',
      'delimsizing',
    ]) {
      // delimsizing は大括弧など
      if (child.className.split(' ').includes(className)) {
        children.push(getStruct(child))
        break
      }
    }
  }
  return {
    Element: me,
    Children: children,
  } as Struct
}

// 根号の Struct を scopes に追加
const pushSqrtScope = (scopes: Struct[], me: HTMLElement) => {
  const inside = me.children[0].children[0].children[0].children[0].children[1] as HTMLElement
  if (!inside.className.split(' ').includes('mord')) {
    console.error('\\sqrt could not be interpreted correctly')
  } // 根号の内側と外側の状態によって階層の深さが変わるとかなら非常に面倒になるが、一応その可能性を考えて合わなければエラーを出す
  scopes.push({ Element: me, Children: [getStruct(inside)] } as Struct)
}

// 行列の Struct を scopes に追加
const pushTableScope = (scopes: Struct[], me: HTMLElement) => {
  const columns: Struct[] = []
  for (const column of getChildElems(me)) {
    if (column.className.includes('col-align')) {
      pushVerticalScope(columns, column)
    }
  }
  scopes.push({ Element: me, Children: columns } as Struct)
}

// 添え字・冪乗・lim・sum・分数・アクセント など、上下構造があるものの Struct を scopes に追加
const pushVerticalScope = (scopes: Struct[], me: HTMLElement) => {
  const child = me.children[0] as HTMLElement
  const column: Struct[] = []
  if (child.className.split(' ').includes('vlist-t')) {
    // この場合、下つき文字のみ or (上つき and 下つき)
    // child の 3 層下に要素が並んでいて、それぞれの 1 層下について
    //     2 番目の要素がそのまま要素である場合と、それが sizing でもう 1 層下がる場合がある

    for (const grand of getChildElems(child.children[0].children[0] as HTMLElement)) {
      const elem = grand.children[1] as HTMLElement
      if (elem.className.split(' ').includes('mord') || elem.className.split(' ').includes('mop')) {
        column.push(getStruct(elem))
      } else if (getChildElems(elem).length > 0) {
        const elam = elem.children[0] as HTMLElement
        if (
          elam.className.split(' ').includes('mord') ||
          elam.className.split(' ').includes('mop')
        ) {
          column.push(getStruct(elam))
        }
      }
    }
    scopes.push({ Element: me, Children: column } as Struct)
  }
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
