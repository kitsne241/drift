// 数式のスコープに関する実装
// とりあえず和スコープ・積スコープ・分数まで

// 子要素を Struct と同様のルールで階層化する
const getLinearChildren = (me: Scope): Scope[] => {
  const linear: Scope[] = []

  if (me.type == 'Sum' || me.type == 'Product') {
    for (const child of me.children) {
      if (child.type == 'Sum' || child.type == 'Product') {
        // もし子要素が和スコープ・積スコープであれば、さらにその子要素を取得する
        const linearChildren = getLinearChildren(child)
        linear.push(...linearChildren)
      } else {
        linear.push(child)
      }
    }
  } else {
    for (const child of me.children) {
      linear.push(child)
    }
  }
  return linear
}

// struct と scope が同じ構造を持つことを確認し、葉要素を対応付ける
export const reLink = (struct: Struct, scope: Scope): void => {
  switch (scope.type) {
    case 'Sum':
      if (struct.type != 'Linear') {
        console.error('Sum スコープに Linear 以外の構造が対応しています', struct, scope)
        throw new Error('Sum スコープに Linear 以外の構造が対応しています')
      }
      break
    case 'Product':
      if (struct.type != 'Linear') {
        console.error('Product スコープに Linear 以外の構造が対応しています', struct, scope)
        throw new Error('Product スコープに Linear 以外の構造が対応しています')
      }
      break
    case 'Frac':
      if (struct.type != 'Frac') {
        console.error('Fraac スコープに Frac 以外の構造が対応しています', struct, scope)
        throw new Error('Frac スコープに Frac 以外の構造が対応しています')
      }
      break
    case undefined:
      if (struct.type != undefined) {
        console.error('スコープの葉に葉でない構造が対応しています', struct, scope)
        throw new Error('スコープの葉に葉でない構造が対応しています')
      }
      break
  }

  // それぞれが葉である場合、Character を比較して一致するか確認
  if (!struct.type && !scope.type) {
    if (struct.character != scope.character) {
      console.error('スコープと構造の葉同士の文字が一致しません', struct, scope)
      throw new Error('スコープと構造の葉同士の文字が一致しません')
    } else {
      scope.rect = struct.element.getBoundingClientRect() // この関数の本質部分
    }
  }

  const scopeChildren = getLinearChildren(scope)

  console.log(scopeChildren)

  if (struct.children.length != scopeChildren.length) {
    console.error('スコープと構造の子要素の数が一致しません', struct, scopeChildren)
    throw new Error('スコープと構造の子要素の数が一致しません')
  }

  for (let i = 0; i < struct.children.length; i++) {
    reLink(struct.children[i], scopeChildren[i])
  }
}

// 一番上の要素から再帰的に描画領域を取得
export const getRect = (scope: Scope): DOMRect => {
  if (scope.rect && !scope.type) return scope.rect // 葉要素なのでそのまま Rect を返す

  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const child of scope.children) {
    const childRect = getRect(child)
    minX = Math.min(minX, childRect.left)
    minY = Math.min(minY, childRect.top)
    maxX = Math.max(maxX, childRect.right)
    maxY = Math.max(maxY, childRect.bottom)
  }

  scope.rect = new DOMRect(minX, minY, maxX - minX, maxY - minY)
  return scope.rect
}

// scope から LaTeX 式を生成
export const genCode = (scope: Scope): string => {
  switch (scope.type) {
    case 'Sum':
      return scope.children.map(genCode).join(' ')

    case 'Product':
      return scope.children.map(genCode).join(' ')

    case 'Frac':
      return '\\frac{' + scope.children.map(genCode).join('}{') + '}'

    default:
      return scope.character || ''
  }
}

// rect に p が含まれるかどうか
const isPointInRect = (p: DOMPoint, rect: DOMRect) =>
  p.x >= rect.left && p.x <= rect.right && p.y >= rect.top && p.y <= rect.bottom

// 2 点を包含する最小のスコープを取得
export const selectScope = (start: DOMPoint, end: DOMPoint, scope: Scope): Scope => {
  const selected = scope

  for (const child of scope.children) {
    if (child.rect && isPointInRect(start, child.rect) && isPointInRect(end, child.rect)) {
      return selectScope(start, end, child)
    }
  }

  return selected
}
