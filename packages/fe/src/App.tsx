import { useState, useEffect } from 'react';
import { marked } from 'marked';
import { MarkdownToACParser } from 'markdown2ac';
import { AdaptiveCardPreview } from './AdaptiveCardPreview';
import { defaultMarkdown } from './defaultMarkdown';
import './App.css';

type ViewMode = 'json' | 'preview';

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

function App() {
  const [markdown, setMarkdown] = useState(() => {
    const saved = localStorage.getItem('markdown2ac-content');
    return saved || defaultMarkdown;
  });
  const [adaptiveCard, setAdaptiveCard] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [previewKey, setPreviewKey] = useState(0);

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
        <div className="output-header">
          <h2>Adaptive Card Output</h2>
          <div className="header-controls">
            <div className="tabs">
              <button
                className={`tab ${viewMode === 'preview' ? 'active' : ''}`}
                onClick={() => setViewMode('preview')}
              >
                Preview
              </button>
              <button
                className={`tab ${viewMode === 'json' ? 'active' : ''}`}
                onClick={() => setViewMode('json')}
              >
                JSON
              </button>
            </div>
            {viewMode === 'preview' && (
              <button
                className="refresh-button"
                onClick={() => setPreviewKey(prev => prev + 1)}
                title="Refresh preview"
              >
                ↻
              </button>
            )}
          </div>
        </div>
        <div className="output-content">
          {viewMode === 'json' ? (
            <JsonViewer json={adaptiveCard} />
          ) : (
            <AdaptiveCardPreview key={previewKey} cardJson={adaptiveCard} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
