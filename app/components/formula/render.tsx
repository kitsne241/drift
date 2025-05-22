import 'katex/dist/katex.min.css'
import katex from 'katex'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getWholeStruct, structIndent } from '~/lib/struct'
import { Scope } from '~/lib/scope'
import { sampleScopeData } from '~/lib/sample-data'
import { useDeepCompareEffect, useDeepCompareMemo } from 'use-deep-compare'

export function meta() {
  return [{ title: 'Drift' }, { name: 'description', content: 'KaTeX表示' }]
}

export default function Render() {
  // 数式表示のための Ref
  const containerRef = useRef<HTMLDivElement>(null)
  const mathRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)

  // 数式の Scope を管理する状態
  const rootScope = useRef(new Scope(sampleScopeData))
  const [selectedScope, setSelectedScope] = useState<Scope | null>(null)
  const [inputScope, setInputScope] = useState<Scope | null>(null)

  // ひとまず選択するスコープは単一のものとする。将来的に和スコープの中の複数要素なども考えてはいる
  // 入力中、inputScope は常に空の葉スコープ。selectedScope の子供

  const [dragStartPoint, setDragStartPoint] = useState<DOMPoint | null>(null)
  // null のとき、ドラッグ中ではない

  const [updateCounter, setUpdateCounter] = useState(0) // 再レンダリングのためのカウンター

  // rootScope の変更に伴い KaTeX を再描画
  useEffect(() => {
    if (!mathRef.current) return

    const html = katex.renderToString(rootScope.current.toCode(), {
      output: 'html',
      throwOnError: true,
      displayMode: true,
    })

    mathRef.current.innerHTML = html

    // HTML の安定を待ってから mathRef を rootScope にリンク
    setTimeout(() => {
      if (!mathRef.current) return
      rootScope.current.reLink(getWholeStruct(mathRef.current))
      rootScope.current.getRect()

      // 位置計算が終わった後でカーソル位置を更新する
      if (cursorRef.current && inputScope && inputScope.rect) {
        cursorRef.current.style.display = 'block'
        cursorRef.current.style.position = 'fixed'
        cursorRef.current.style.left = `${inputScope.rect.x}px`
        cursorRef.current.style.top = `${inputScope.rect.y}px`
        cursorRef.current.style.height = `${inputScope.rect.height}px`
        cursorRef.current.style.width = '1px'
        cursorRef.current.style.backgroundColor = 'rgba(255, 127, 0, 1)'

        // カーソル点滅のためのクラスを追加
        cursorRef.current.classList.add('cursor-blink')
      } else if (cursorRef.current) {
        // 入力モードでない場合はカーソルを非表示
        cursorRef.current.style.display = 'none'
        cursorRef.current.classList.remove('cursor-blink')
      }
    }, 30)
  }, [updateCounter])

  const deSelect = () => {
    if (selectedScope && inputScope) selectedScope.removeChild(inputScope)
    setSelectedScope(null)
    setInputScope(null)
    setDragStartPoint(null)
    if (cursorRef.current) {
      cursorRef.current.style.display = 'none'
      cursorRef.current.classList.remove('cursor-blink')
    }
  }

  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (containerRef.current === null) return

      if (containerRef.current.contains(event.target as Node)) {
        if (inputScope !== null) return // 入力中はクリックを無視
        // コンテナ内のクリック
        const point = new DOMPoint(event.clientX, event.clientY)
        setSelectedScope(rootScope.current.select(point, point))
        setDragStartPoint(point)
        return
      } else deSelect() // コンテナ外をクリックした場合、すべての選択を解除
    },
    [selectedScope, inputScope, rootScope]
  )

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!dragStartPoint) return
      const currentPoint = new DOMPoint(event.clientX, event.clientY)
      setSelectedScope(rootScope.current.select(dragStartPoint, currentPoint))
    },
    [dragStartPoint, rootScope]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (selectedScope === null) return // 選択されていない場合は何もしない
      console.log(event.key)

      if (inputScope === null) {
        // 選択しただけ（入力モードになっていない）の状態では
        // 左右矢印・BackSpace・Enter・Esc のみを受け付け、いずれも選択しただけの状態を解消する
        const input = new Scope()

        switch (event.key) {
          case 'ArrowLeft': {
            setInputScope(input)
            if (selectedScope.parent === null) {
              // ルートスコープの左矢印の場合は、左端にカーソルを挿入
              selectedScope.insertChild(input, 0)
            } else {
              // 通常スコープの左矢印では、親スコープに移動して左隣にカーソルを挿入
              const parent = selectedScope.parent
              // parent.type === 'Frac' である場合、こうすると壊れる
              // ので、parent の下に Product を挿入して移動する必要がある
              // でも、まだ何も入力していない段階で不可逆的に rootScope を壊すのはまずい
              // 編集手前の段階では rootScope のコピーを取って仮で入れていくべきなのか…？
              const index = parent.children.indexOf(selectedScope)
              parent.insertChild(input, index)
              setSelectedScope(parent)
            }
            break
          }
          case 'ArrowRight': {
            setInputScope(input)
            if (selectedScope.parent === null) {
              // ルートスコープの右矢印の場合は、右端にカーソルを挿入
              selectedScope.insertChild(input, -1)
            } else {
              // 通常スコープの左矢印では、親スコープに移動して右隣にカーソルを挿入
              const parent = selectedScope.parent
              const index = parent.children.indexOf(selectedScope)
              parent.insertChild(input, index + 1)
              setSelectedScope(parent)
            }
            break
          }
          case 'Enter': {
            setInputScope(input)
            selectedScope.insertChild(input, 0)
            break
          }
          case 'Backspace': {
            setInputScope(input)
            if (selectedScope.parent === null) {
              // ルートスコープの BackSpace の場合は、一旦すべてリセットしてカーソルを挿入
              selectedScope.setChildren([input])
            } else {
              // 通常スコープの BackSpace の場合は、現在のスコープをカーソルに置き換える
              const parent = selectedScope.parent
              const index = parent.children.indexOf(selectedScope)
              parent.removeChild(selectedScope)
              parent.insertChild(input, index)
              setSelectedScope(parent)
            }
            break
          }
          case 'Escape': {
            deSelect()
            break
          }
        }
      } else {
        switch (event.key) {
          case 'ArrowLeft': {
            const index = selectedScope.children.indexOf(inputScope)
            if (index > 0) {
              selectedScope.removeChild(inputScope)
              selectedScope.insertChild(inputScope, index - 1)
            }
            break
          }

          case 'ArrowRight': {
            const index = selectedScope.children.indexOf(inputScope)
            if (index < selectedScope.children.length - 1) {
              selectedScope.removeChild(inputScope)
              selectedScope.insertChild(inputScope, index + 1)
            }
            break
          }

          case 'Backspace': {
            const index = selectedScope.children.indexOf(inputScope)
            if (index > 0) {
              selectedScope.removeChild(selectedScope.children[index - 1])
            }
            break
          }
        }

        selectedScope.edit(event.key)
      }

      setUpdateCounter((prev) => prev + 1)
      event.preventDefault() // デフォルトの動作を防ぐ
      event.stopPropagation() // イベントのバブリングを防ぐ
      console.log(selectedScope)
    },
    [selectedScope, inputScope, rootScope, setSelectedScope, setInputScope, setUpdateCounter]
  )

  // 入力の管理
  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleMouseDown, handleKeyDown])

  // 数式を囲むコンテナのサイズを計算
  const containerStyle = useDeepCompareMemo((): React.CSSProperties => {
    if (rootScope.current.rect) {
      return {
        width: `${rootScope.current.rect.width + 12}px`,
        height: `${rootScope.current.rect.height + 12}px`,
        position: 'relative',
      }
    } else {
      return {
        width: '0px',
        height: '0px',
        position: 'relative',
      }
    }
  }, [rootScope.current.rect])

  // highlightRef の位置とスタイルを更新
  useDeepCompareEffect(() => {
    if (!highlightRef.current) return

    highlightRef.current.classList.remove('formula-selection-fill', 'formula-selection-border')
    const style = highlightRef.current.style
    if (!selectedScope || !selectedScope.rect) {
      style.display = 'none'
      return
    }

    style.display = 'block'

    if (inputScope === null) {
      // 選択のみの場合（inputScope なし）
      highlightRef.current.classList.add('formula-selection-fill')
      style.left = `${selectedScope.rect.x}px`
      style.top = `${selectedScope.rect.y}px`
      style.width = `${selectedScope.rect.width}px`
      style.height = `${selectedScope.rect.height}px`
    } else {
      // 入力中の場合（inputScope あり）
      highlightRef.current.classList.add('formula-selection-border')
      style.left = `${selectedScope.rect.x - 4}px`
      style.top = `${selectedScope.rect.y - 2}px`
      style.width = `${selectedScope.rect.width + 8}px`
      style.height = `${selectedScope.rect.height + 4}px`
    }
  }, [selectedScope, inputScope])
  // ドラッグ中に selectedScope の参照が変わるたびに走る
  // 選択範囲に操作が加えられて inputScope が新しく生成されても走る

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setDragStartPoint(null)}
      className='flex items-center justify-center relative'
      style={containerStyle}
    >
      <div ref={highlightRef} />
      <div ref={cursorRef} className='z-[2]' />
      <div ref={mathRef} className='z-[1] select-none text-2xl'></div>
    </div>
  )
}
