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
