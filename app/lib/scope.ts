// 数式のスコープに関する実装
// とりあえず和スコープ・積スコープ・分数まで

import type { Struct } from './struct'

export type ScopeType = 'Single' | 'Sum' | 'Product' | 'Frac'

// 読み書き用
export type ScopeData = {
  type: ScopeType
  children: ScopeData[]
  character?: string
}

// 数式がもつ意味上の構造
export class Scope {
  type: ScopeType
  children: Scope[] = []
  character?: string
  parent: Scope | null = null
  rect?: DOMRect

  // scope を ScopeData から生成
  constructor(data: ScopeData, parent: Scope | null = null) {
    this.type = data.type
    this.character = data.character
    this.parent = parent

    if (data.children) {
      this.children = data.children.map((child) => new Scope(child, this))
    }
  }

  // scope を読み書き用のデータに変換
  toData(): ScopeData {
    return {
      type: this.type,
      character: this.character,
      children: this.children.map((c) => c.toData()),
    }
  }

  // scope から LaTeX 式を生成
  toCode(): string {
    switch (this.type) {
      case 'Sum':
        return this.children.map((child) => child.toCode()).join(' ')

      case 'Product':
        return this.children.map((child) => child.toCode()).join(' ')

      case 'Frac':
        return '\\frac{' + this.children.map((child) => child.toCode()).join('}{') + '}'

      case 'Single':
        if (this.character && ['=', '-', '+'].includes(this.character)) {
          return this.character || ''
        } else {
          return '{' + this.character + '}' || ''
        }
    }
  }

  // scope に child を挿入
  insertChild(child: Scope, index: number) {
    child.parent = this
    this.children.splice(index, 0, child)
    return child // parent を反映させた child を返す
  }

  // scope から child を削除
  removeChild(child: Scope) {
    const index = this.children.indexOf(child)
    if (index !== -1) {
      this.children.splice(index, 1)
      child.parent = null
    }
    return child // parent を反映させた child を返す
  }

  // scope の子要素を全て置き換える
  setChildren(children: Scope[]) {
    for (const child of this.children) {
      child.parent = null
    }

    this.children = children.map((child) => {
      child.parent = this
      return child
    })

    return this.children // parent を反映させた child を返す
  }

  // 子要素を Struct と同様のルールで階層化する
  getLinearChildren(): Scope[] {
    const linear: Scope[] = []

    if (this.type == 'Sum' || this.type == 'Product') {
      // 和スコープ・積スコープの場合は、子要素を均して取得する必要がある
      for (const child of this.children) {
        if (child.type == 'Sum' || child.type == 'Product') {
          // もし子要素が和スコープ・積スコープであれば、さらにその子要素を取得する
          const linearChildren = child.getLinearChildren()
          linear.push(...linearChildren)
        } else {
          linear.push(child)
        }
      }
    } else {
      // それ以外のスコープの場合はそのまま子要素を追加
      for (const child of this.children) {
        linear.push(child)
      }
    }
    return linear
  }

  // struct と scope が同じ構造を持つことを確認し、葉要素だけを対応付ける
  reLink(struct: Struct): void {
    switch (this.type) {
      case 'Sum':
        if (struct.type != 'Linear') {
          console.error('Sum スコープに Linear 以外の構造が対応しています', struct, this)
          throw new Error('Sum スコープに Linear 以外の構造が対応しています')
        }
        break
      case 'Product':
        if (struct.type != 'Linear') {
          console.error('Product スコープに Linear 以外の構造が対応しています', struct, this)
          throw new Error('Product スコープに Linear 以外の構造が対応しています')
        }
        break
      case 'Frac':
        if (struct.type != 'Frac') {
          console.error('Frac スコープに Frac 以外の構造が対応しています', struct, this)
          throw new Error('Frac スコープに Frac 以外の構造が対応しています')
        }
        break
      case 'Single':
        if (struct.type != 'Single') {
          console.error('スコープの葉に葉でない構造が対応しています', struct, this)
          throw new Error('スコープの葉に葉でない構造が対応しています')
        }
        break
    }

    // それぞれが葉である場合、Character を比較して一致するか確認
    if (struct.type == 'Single' && this.type == 'Single') {
      if (struct.character != this.character) {
        console.error('スコープと構造の葉同士の文字が一致しません', struct, this)
        throw new Error('スコープと構造の葉同士の文字が一致しません')
      } else {
        this.rect = struct.element.getBoundingClientRect() // この関数の本質部分
      }
    }

    const scopeChildren = this.getLinearChildren()

    // console.log(scopeChildren)

    if (struct.children.length != scopeChildren.length) {
      console.error('スコープと構造の子要素の数が一致しません', struct, scopeChildren)
      throw new Error('スコープと構造の子要素の数が一致しません')
    }

    for (let i = 0; i < struct.children.length; i++) {
      scopeChildren[i].reLink(struct.children[i])
    }
  }

  // 葉の要素から再帰的に描画領域を取得
  getRect(): DOMRect {
    if (this.rect && this.type == 'Single') return this.rect // 葉要素なのでそのまま Rect を返す

    let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity]
    for (const child of this.children) {
      const childRect = child.getRect()
      minX = Math.min(minX, childRect.left)
      minY = Math.min(minY, childRect.top)
      maxX = Math.max(maxX, childRect.right)
      maxY = Math.max(maxY, childRect.bottom)
    }

    this.rect = new DOMRect(minX, minY, maxX - minX, maxY - minY)
    return this.rect
  }

  // 2 点を包含する最小のスコープを取得
  select(start: DOMPoint, end: DOMPoint): Scope | null {
    const isPointInRect = (p: DOMPoint, rect?: DOMRect) =>
      rect && p.x >= rect.left && p.x <= rect.right && p.y >= rect.top && p.y <= rect.bottom

    for (const child of this.children) {
      if (child.rect && isPointInRect(start, child.rect) && isPointInRect(end, child.rect)) {
        return child.select(start, end)
      }
    }

    return this
  }

  // スコープの編集
  edit(key: string) {
    if (key == 'Backspace') {
      this.parent?.removeChild(this)
      return
    }

    // scope が葉である場合
    if (this.type == 'Single') {
      // key が a ~ z、A ~ Z、0 ~ 9 の文字である場合
      if (/^[a-zA-Z0-9]$/.test(key)) {
        // 親スコープが積スコープである場合
        if (this.parent?.type == 'Product') {
          // 親スコープに子要素を追加
          const newScope = new Scope({ type: 'Single', character: key, children: [] })
          const index = this.parent.children.indexOf(this)
          this.parent.insertChild(newScope, index + 1) // 親スコープに新しい子要素を追加
          return
        } else if (this.parent) {
          // 自身が積スコープとなる
          this.type = 'Product'
          this.setChildren([
            new Scope({ type: 'Single', character: this.character, children: [] }),
            new Scope({ type: 'Single', character: key, children: [] }),
          ])
          this.character = undefined
          return
        }
      }
    }
  }
}
