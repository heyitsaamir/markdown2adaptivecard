import { useState, useEffect } from 'react';
import { marked } from 'marked';
import { MarkdownToACParser } from 'markdown2ac';
import './App.css';

function JsonViewer({ json }: { json: string }) {
  const highlightJson = (jsonString: string) => {
    return jsonString.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let className = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            className = 'json-key';
          } else {
            className = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          className = 'json-boolean';
        } else if (/null/.test(match)) {
          className = 'json-null';
        }
        return `<span class="${className}">${match}</span>`;
      }
    );
  };

  return (
    <pre
      className="json-output"
      dangerouslySetInnerHTML={{ __html: highlightJson(json) }}
    />
  );
}

const defaultMarkdown = `# Hello!

My name is Aamir Jawaid

List:
- one
- two
- three

\`\`\`typescript
const foo = 'bar';
\`\`\`

| foo | bar |
| --- | --- |
| baz | bim |

> This is a quote

This is **great**! _And just ok_
`;

function App() {
  const [markdown, setMarkdown] = useState(() => {
    const saved = localStorage.getItem('markdown2ac-content');
    return saved || defaultMarkdown;
  });
  const [adaptiveCard, setAdaptiveCard] = useState('');

  const convertMarkdown = (text: string) => {
    try {
      const lexer = new marked.Lexer();
      const tokens = lexer.lex(text);
      const parser = new MarkdownToACParser();
      const result = parser.parse(tokens);
      // Pretty print the JSON
      const formatted = JSON.stringify(JSON.parse(result), null, 2);
      setAdaptiveCard(formatted);
    } catch (error) {
      setAdaptiveCard(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMarkdown = e.target.value;
    setMarkdown(newMarkdown);
    localStorage.setItem('markdown2ac-content', newMarkdown);
    convertMarkdown(newMarkdown);
  };

  // Initialize on mount
  useEffect(() => {
    convertMarkdown(markdown);
  }, []);

  return (
    <div className="app">
      <div className="column">
        <h2>Markdown Input</h2>
        <textarea
          value={markdown}
          onChange={handleMarkdownChange}
          placeholder="Enter your markdown here..."
        />
      </div>
      <div className="column">
        <h2>Adaptive Card Output</h2>
        <JsonViewer json={adaptiveCard} />
      </div>
    </div>
  );
}

export default App;
