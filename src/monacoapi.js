import 'monaco-editor/esm/vs/basic-languages/css/css.contribution'
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'


import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'

window.MonacoEnvironment = {
  getWorker (_, label) {
    if (label === 'typescript' || label === 'javascript') return new TsWorker()
    if (label === 'json') return new JsonWorker()
    if (label === 'css') return new CssWorker()
    if (label === 'html') return new HtmlWorker()
    return new EditorWorker()
  }
}

import * as monaco from "monaco-editor";

let editor = null;

const getEditor = () => {
  if (editor) {
    return editor;
  }

  editor = monaco.editor.create(document.getElementById("editor"), {
    value: ["// Hello World"].join("\n"),
    language: "javascript",
    theme: "vs-dark",
    lineNumbers: "on",
    vertical: "auto",
    horizintal: "auto",
    automaticLayout: true,
  });

  return editor;
};

export { getEditor };
