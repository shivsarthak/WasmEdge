const getLanguageFromFileExtension = (fileExtension) => {
    switch (fileExtension) {
        case "css":
            return "css";
        case "js":
        case "mjs":
        case "jsx":
            return "javascript";
        case "json":
            return "json";
        case "md":
            return "markdown";
        case "ts":
        case "tsx":
            return "typescript";
        case "html":
            return "html";
        case "hbs":
            return "handlebars";
        case "yml":
        case "yaml":
            return "yaml";
        case "xml":
            return "xml";
        case "sql":
            return "sql";
        case "gql":
        case "graphql":
            return "graphql";
        case "scss":
            return "scss";
        case "sass":
            return "sass";
        case "less":
            return "less";
        case "php":
            return "php";
        case "py":
            return "python";
        case "rb":
            return "ruby";
        case "java":
            return "java";
        case "cs":
            return "csharp";
        case "go":
            return "golang";
        case "swift":
            return "swift";
        case "kotlin":
            return "kotlin";
        case "rs":
            return "rust";
        case "sh":
            return "shell";
        case "ps1":
            return "powershell";
        case "bat":
            return "batch";
      default:
        return "plaintext";
    }
  };

  export default getLanguageFromFileExtension;