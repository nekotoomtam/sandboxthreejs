import { useEffect, useRef } from 'react'
import { javascript } from '@codemirror/lang-javascript'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { basicSetup, EditorView } from 'codemirror'

type CodeEditorProps = {
  value: string
  onChange: (value: string) => void
}

const editorTheme = EditorView.theme({
  '&': {
    backgroundColor: '#102c27',
    color: '#f1faf7',
    minHeight: '250px',
    fontSize: '13px',
  },
  '.cm-content': {
    caretColor: '#ffbd59',
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
    lineHeight: '1.8',
    padding: '14px 0',
  },
  '.cm-gutters': {
    backgroundColor: '#0d2521',
    color: '#a7bbb4',
    border: 'none',
  },
  '.cm-activeLine, .cm-activeLineGutter': {
    backgroundColor: 'rgba(255,255,255,.07)',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-selectionBackground, ::selection': {
    backgroundColor: 'rgba(243,168,59,.28) !important',
  },
})

const highContrastHighlightStyle = HighlightStyle.define([
  {
    tag: [tags.keyword, tags.modifier, tags.operatorKeyword, tags.controlKeyword],
    color: '#ffd28a',
    fontWeight: '700',
  },
  { tag: [tags.variableName, tags.name], color: '#f1faf7' },
  { tag: tags.propertyName, color: '#9cddff' },
  { tag: [tags.function(tags.variableName), tags.definition(tags.variableName)], color: '#80e1c1' },
  { tag: [tags.string, tags.special(tags.string)], color: '#b9efc9' },
  { tag: [tags.number, tags.bool, tags.null], color: '#ffc0df' },
  { tag: [tags.typeName, tags.className, tags.namespace], color: '#c7bcff' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: '#b6c9c2', fontStyle: 'italic' },
  { tag: [tags.operator, tags.punctuation], color: '#f5faf8' },
  { tag: tags.invalid, color: '#ffffff', backgroundColor: '#a84242' },
])

export function CodeEditor({ value, onChange }: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView>(null)
  const initialValueRef = useRef(value)
  const changeHandlerRef = useRef(onChange)
  changeHandlerRef.current = onChange

  useEffect(() => {
    if (!hostRef.current) return

    const view = new EditorView({
      doc: initialValueRef.current,
      parent: hostRef.current,
      extensions: [
        basicSetup,
        javascript(),
        syntaxHighlighting(highContrastHighlightStyle),
        editorTheme,
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          'aria-label': 'พื้นที่เขียนโค้ด Three.js',
          spellcheck: 'false',
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            changeHandlerRef.current(update.state.doc.toString())
          }
        }),
      ],
    })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view || view.state.doc.toString() === value) return

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    })
  }, [value])

  return <div ref={hostRef} className="overflow-hidden rounded-xl" />
}
