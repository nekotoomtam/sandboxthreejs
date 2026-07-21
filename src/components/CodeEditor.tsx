import { useEffect, useRef } from 'react'
import { javascript } from '@codemirror/lang-javascript'
import { basicSetup, EditorView } from 'codemirror'

type CodeEditorProps = {
  value: string
  onChange: (value: string) => void
}

const editorTheme = EditorView.theme({
  '&': {
    backgroundColor: '#102c27',
    color: '#e6f4ef',
    minHeight: '250px',
    fontSize: '12px',
  },
  '.cm-content': {
    caretColor: '#ffbd59',
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
    lineHeight: '1.75',
    padding: '14px 0',
  },
  '.cm-gutters': {
    backgroundColor: '#0d2521',
    color: '#68877e',
    border: 'none',
  },
  '.cm-activeLine, .cm-activeLineGutter': {
    backgroundColor: 'rgba(255,255,255,.045)',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-selectionBackground, ::selection': {
    backgroundColor: 'rgba(243,168,59,.28) !important',
  },
})

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
