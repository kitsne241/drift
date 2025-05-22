import 'katex/dist/katex.min.css'
import katex from 'katex'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getWholeStruct, structIndent } from '~/lib/struct'
import { Scope } from '~/lib/scope'
import { sampleScopeData } from '~/lib/sample-data'

export function meta() {
  return [{ title: 'Drift' }, { name: 'description', content: 'KaTeX表示' }]
}

export default function Render() {
  const mathRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null) // カーソル表示用のrefを追加

  const [rootScope, setRootScope] = useState(new Scope(sampleScopeData))
  const [selectedScope, setSelectedScope] = useState<Scope | null>(null)
  // 選択されたスコープ。そのまま入力中のスコープとして機能する

  const [inputScope, setInputScope] = useState<Scope | null>(null)
  // 入力をする位置の指標として機能する空の Scope。selectedScope の子供
  // 数式そのものをいじらず、入力する位置を変えるごとに rootScope を更新する

  const [updateCounter, setUpdateCounter] = useState(0) // 再レンダリングのためのカウンター追加

  const [isDragging, setIsDragging] = useState(false)
  const [dragStartPoint, setDragStartPoint] = useState<DOMPoint | null>(null)

  // scope の変更に伴い KaTeX を再描画
  useEffect(() => {
    if (!mathRef.current) return

    const html = katex.renderToString(rootScope.toCode(), {
      output: 'html',
      throwOnError: true,
      displayMode: true,
    })

    mathRef.current.innerHTML = html

    // リサイズ検知のフラグを追加して無限ループを防止
    let isHandlingResize = false
    const resizeObserver = new ResizeObserver(() => {
      if (!isHandlingResize) {
        isHandlingResize = true
        setTimeout(() => {
          reLoad()
          isHandlingResize = false
        }, 10)
      }
    })

    resizeObserver.observe(mathRef.current)
    return () => resizeObserver.disconnect()
  }, [rootScope, updateCounter])

  const updateSelectionHighlight = useCallback(
    (start: DOMPoint, end: DOMPoint) => {
      setSelectedScope(rootScope.select(start, end))
    },
    [rootScope]
  )

  // 枠外のクリックとコンテナ内クリックを統合
  useEffect(() => {
    const handleGlobalMouseDown = (event: MouseEvent) => {
      // コンテナ外のクリック処理
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (selectedScope && inputScope) {
          selectedScope.removeChild(inputScope)
        }
        setSelectedScope(null)
        setIsDragging(false)
        setDragStartPoint(null)
        setInputScope(null)
        return
      }

      if (inputScope !== null) return
      // コンテナ内のクリック処理（handleMouseDownの内容）
      const point = new DOMPoint(event.clientX, event.clientY)
      setIsDragging(true)
      setDragStartPoint(point)
      updateSelectionHighlight(point, point)
    }

    window.addEventListener('mousedown', handleGlobalMouseDown)
    return () => window.removeEventListener('mousedown', handleGlobalMouseDown)
  }, [updateSelectionHighlight, inputScope])

  // 選択中にキー入力があった場合の処理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedScope) {
        console.log('キー入力:', event.key, '選択中のスコープを更新')
        // Shift + - を打つと、Shift → = の入力がある

        // selectedScope.edit(event.key)

        // 選択しただけ（入力モードになっていない）の状態では
        // 左右矢印・BackSpace・Enter・Esc のみを受け付け、いずれも選択しただけの状態を解消する

        if (!inputScope) {
          if (event.key === 'ArrowLeft') {
            const index = selectedScope.parent?.children.indexOf(selectedScope) || 0
            if (selectedScope.parent) {
              setSelectedScope(() => selectedScope.parent)
            }
            setInputScope(() => new Scope({ type: 'Single', character: '', children: [] }))
            selectedScope.insertChild(inputScope!, index)
          }

          if (event.key === 'ArrowRight') {
            const index = selectedScope.parent?.children.indexOf(selectedScope) || 0
            if (selectedScope.parent) {
              setSelectedScope(() => selectedScope.parent)
            }
            setInputScope(() => new Scope({ type: 'Single', character: '', children: [] }))
            selectedScope.insertChild(inputScope!, index + 1)
          }

          if (event.key === 'Enter') {
            setInputScope(() => new Scope({ type: 'Single', character: '', children: [] }))
            selectedScope.insertChild(inputScope!, 0)
          }

          if (event.key === 'Backspace') {
            selectedScope.type = 'Single'
            selectedScope.character = ''
            selectedScope.children = []
            setInputScope(selectedScope)
            setSelectedScope(() => selectedScope.parent)
          }

          if (event.key === 'Escape') {
            setSelectedScope(null)
            setIsDragging(false)
            setDragStartPoint(null)
          }
        } else {
          if (event.key === 'ArrowLeft') {
            const index = selectedScope.children.indexOf(inputScope) || 0
            selectedScope.removeChild(inputScope)
            selectedScope.insertChild(inputScope, Math.max(index - 1, 0))
          }

          if (event.key === 'ArrowRight') {
            const index = selectedScope.children.indexOf(inputScope) || 0
            selectedScope.removeChild(inputScope)
            selectedScope.insertChild(
              inputScope,
              Math.min(index + 1, selectedScope.children.length)
            )
          }

          selectedScope.edit(event.key)
        }

        setUpdateCounter((prev) => prev + 1)
        event.preventDefault() // デフォルトの動作を防ぐ
        event.stopPropagation() // イベントのバブリングを防ぐ
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [inputScope, selectedScope, updateCounter])

  // inputScopeのカーソルスタイルを計算する関数
  const getCursorStyle = (): React.CSSProperties => {
    if (!selectedScope || !inputScope || !inputScope.rect) {
      return { display: 'none' }
    }

    console.log('selectedScope.rect', selectedScope.rect)
    console.log('selectedScope', selectedScope.children)
    console.log('inputScope.rect', inputScope.rect)

    return {
      color: '#fff',
      display: 'block',
      left: `${inputScope.rect.x}px`,
      top: `${inputScope.rect.y}px`,
      height: `${inputScope.rect.height}px`,
      width: '2px',
      backgroundColor: '#000',
      position: 'fixed',
      animation: 'cursorBlink 1s step-end infinite', // グローバルCSSで定義したアニメーションを参照
    }
  }

  // selectedScope と inputIndex からハイライトスタイルを計算する関数
  const getHighlightStyle = (): React.CSSProperties => {
    if (!selectedScope || !selectedScope.rect) {
      return { display: 'none' }
    }

    if (inputScope !== null) {
      return {
        display: 'block',
        left: `${selectedScope.rect.x - 4}px`,
        top: `${selectedScope.rect.y - 2}px`,
        width: `${selectedScope.rect.width + 8}px`,
        height: `${selectedScope.rect.height + 4}px`,
      }
    } else {
      return {
        display: 'block',
        left: `${selectedScope.rect.x}px`,
        top: `${selectedScope.rect.y}px`,
        width: `${selectedScope.rect.width}px`,
        height: `${selectedScope.rect.height}px`,
      }
    }
  }

  // inputScopeの位置情報を更新するための追加のuseEffect
  useEffect(() => {
    if (inputScope) {
      inputScope.getRect() // inputScopeの位置情報を更新
      setUpdateCounter((prev) => prev + 1) // 再レンダリングを強制
    }
  }, [inputScope])

  // rootScope更新後にinputScopeの位置を再計算
  useEffect(() => {
    // updateCounterを依存配列から除外し、代わりに別のトリガーを使用
    if (inputScope && rootScope) {
      // 前回の位置情報を記憶する参照を作成
      const prevRect = inputScope.rect ? { ...inputScope.rect } : null

      setTimeout(() => {
        inputScope.getRect()
        // 位置が実際に変わった場合だけupdateCounterを更新
        if (
          !prevRect ||
          prevRect.x !== inputScope.rect?.x ||
          prevRect.y !== inputScope.rect?.y ||
          prevRect.width !== inputScope.rect?.width ||
          prevRect.height !== inputScope.rect?.height
        ) {
          setUpdateCounter((prev) => prev + 1)
        }
      }, 10)
    }
  }, [rootScope]) // updateCounterを依存配列から削除

  // highlightRefのclassを更新する処理を追加
  useEffect(() => {
    if (!highlightRef.current) return

    // まずクラスをリセット
    highlightRef.current.classList.remove('formula-selection-fill', 'formula-selection-border')

    if (selectedScope) {
      // inputIndexの状態に基づいてクラスを設定
      if (inputScope === null) {
        highlightRef.current.classList.add('formula-selection-fill')
      } else {
        highlightRef.current.classList.add('formula-selection-border')
      }
    }
  }, [selectedScope, inputScope])

  const reLoad = () => {
    if (!mathRef.current) return

    const struct = getWholeStruct(mathRef.current)
    console.log(structIndent(struct)) // 単なるログ

    rootScope.reLink(struct)
    rootScope.getRect()

    // ここでcontainerRefのサイズをscope.rectに合わせる
    if (rootScope.rect && containerRef.current) {
      containerRef.current.style.width = `${rootScope.rect.width + 12}px`
      containerRef.current.style.height = `${rootScope.rect.height + 12}px`
      containerRef.current.style.position = 'relative'
    }
  }

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || !dragStartPoint) return
    const currentPoint = new DOMPoint(event.clientX, event.clientY)
    updateSelectionHighlight(dragStartPoint, currentPoint)
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      className='flex items-center justify-center relative'
    >
      <div ref={highlightRef} style={getHighlightStyle()} />
      <div ref={cursorRef} style={getCursorStyle()} />
      <div ref={mathRef} className='z-[1] select-none text-2xl'></div>
    </div>
  )
}
