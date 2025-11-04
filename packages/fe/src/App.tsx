import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { MarkdownToACParser } from 'markdown2ac';
import { AdaptiveCardPreview } from './AdaptiveCardPreview';
import { defaultMarkdown } from './defaultMarkdown';
import './App.css';

type ViewMode = 'json' | 'preview';
type StreamStatus = 'idle' | 'streaming' | 'paused';

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
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('idle');
  const [fullMarkdownToStream, setFullMarkdownToStream] = useState('');
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0);
  const streamIntervalRef = useRef<number | null>(null);

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

  const startStream = () => {
    setFullMarkdownToStream(markdown);
    setCurrentStreamIndex(0);
    setMarkdown('');
    setStreamStatus('streaming');
  };

  const pauseStream = () => {
    setStreamStatus('paused');
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
  };

  const resumeStream = () => {
    setStreamStatus('streaming');
  };

  const stopStream = () => {
    setStreamStatus('idle');
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    setFullMarkdownToStream('');
    setCurrentStreamIndex(0);
  };

  // Streaming effect
  useEffect(() => {
    if (streamStatus === 'streaming' && currentStreamIndex < fullMarkdownToStream.length) {
      streamIntervalRef.current = window.setInterval(() => {
        setCurrentStreamIndex((prevIndex) => {
          // Variable chunk size between 1 and 10 characters
          const chunkSize = Math.floor(Math.random() * 10) + 1;
          const nextIndex = Math.min(prevIndex + chunkSize, fullMarkdownToStream.length);

          const newMarkdown = fullMarkdownToStream.slice(0, nextIndex);
          setMarkdown(newMarkdown);
          convertMarkdown(newMarkdown);

          if (nextIndex >= fullMarkdownToStream.length) {
            setStreamStatus('idle');
            if (streamIntervalRef.current) {
              clearInterval(streamIntervalRef.current);
              streamIntervalRef.current = null;
            }
          }

          return nextIndex;
        });
      }, 50); // Stream every 50ms

      return () => {
        if (streamIntervalRef.current) {
          clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = null;
        }
      };
    }
  }, [streamStatus, currentStreamIndex, fullMarkdownToStream]);

  // Initialize on mount
  useEffect(() => {
    convertMarkdown(markdown);
  }, []);

  return (
    <div className="app">
      <div className="column">
        <div className="input-header">
          <h2>Markdown Input</h2>
          <div className="stream-controls">
            {streamStatus === 'idle' && (
              <button
                className="stream-button"
                onClick={startStream}
                disabled={!markdown}
                title="Stream markdown"
              >
                ▶ Stream
              </button>
            )}
            {streamStatus === 'streaming' && (
              <>
                <button
                  className="stream-button pause"
                  onClick={pauseStream}
                  title="Pause stream"
                >
                  ⏸ Pause
                </button>
                <button
                  className="stream-button stop"
                  onClick={stopStream}
                  title="Stop stream"
                >
                  ⏹ Stop
                </button>
              </>
            )}
            {streamStatus === 'paused' && (
              <>
                <button
                  className="stream-button"
                  onClick={resumeStream}
                  title="Resume stream"
                >
                  ▶ Resume
                </button>
                <button
                  className="stream-button stop"
                  onClick={stopStream}
                  title="Stop stream"
                >
                  ⏹ Stop
                </button>
              </>
            )}
          </div>
        </div>
        <textarea
          value={markdown}
          onChange={handleMarkdownChange}
          placeholder="Enter your markdown here..."
          readOnly={streamStatus !== 'idle'}
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
