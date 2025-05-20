// 数式のスコープに関する実装
// とりあえず和スコープ・積スコープ・分数まで

// 子要素を Struct と同様のルールで階層化する
const getLinearChildren = (me: Scope) => {
  const linear: Scope[] = []

  if (me.Type == 'Sum' || me.Type == 'Product') {
    for (const child of me.Children) {
      if (child.Type == 'Sum' || child.Type == 'Product') {
        // もし子要素が和スコープ・積スコープであれば、さらにその子要素を取得する
        const linearChildren = getLinearChildren(child)
        linear.push(...linearChildren)
      } else {
        linear.push(child)
      }
    }
  } else {
    for (const child of me.Children) {
      linear.push(child)
    }
  }
  return linear
}

// struct と scope が対応する構造を持つか確認する
export const isConsistent = (struct: Struct, scope: Scope): boolean => {
  switch (scope.Type) {
    case 'Sum':
      if (struct.Type != 'Linear') {
        console.error('Sum スコープに Linear 以外の構造が対応しています', struct, scope)
        return false
      }
      break
    case 'Product':
      if (struct.Type != 'Linear') {
        console.error('Product スコープに Linear 以外の構造が対応しています', struct, scope)
        return false
      }
      break
    case 'Frac':
      if (struct.Type != 'Frac') {
        console.error('Fraac スコープに Frac 以外の構造が対応しています', struct, scope)
        return false
      }
      break
    case undefined:
      if (struct.Type != undefined) {
        console.error('スコープの葉に葉でない構造が対応しています', struct, scope)
        return false
      }
      break
  }

  // それぞれが葉である場合、Character を比較して一致するか確認
  if (!struct.Type && !scope.Type) {
    if (struct.Character != scope.Character) {
      console.error('スコープと構造の葉同士の文字が一致しません', struct, scope)
      return false
    } else {
      return true
    }
  }

  const scopeChildren = getLinearChildren(scope)

  console.log(scopeChildren)

  if (struct.Children.length != scopeChildren.length) {
    console.error('スコープと構造の子要素の数が一致しません', struct, scopeChildren)
    return false // 子要素の数が異なる場合、構造が異なる
  }

  let isAllCons = true
  for (let i = 0; i < scopeChildren.length; i++) {
    isAllCons = isAllCons && isConsistent(struct.Children[i], scopeChildren[i])
  }

  return isAllCons
}

// scope から LaTeX 式を生成
export const makeLaTeX = (scope: Scope): string => {
  switch (scope.Type) {
    case 'Sum':
      return scope.Children.map(makeLaTeX).join(' ')

    case 'Product':
      return scope.Children.map(makeLaTeX).join(' ')

    case 'Frac':
      return '\\frac{' + scope.Children.map(makeLaTeX).join('}{') + '}'

    default:
      return scope.Character || ''
  }
}
