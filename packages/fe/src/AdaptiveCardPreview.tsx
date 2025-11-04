import { useEffect, useRef } from 'react';
import './AdaptiveCardPreview.css';

const adaptiveCardToolsBaseUrl = 'https://adaptivecards.microsoft.com';
const rendererUrl = `${adaptiveCardToolsBaseUrl}/renderer.html`;

interface AdaptiveCardPreviewProps {
  cardJson: string;
}

interface IMessage {
  type: string;
}

interface IRendererReadyMessage extends IMessage {
  type: 'ac-renderer-ready';
  id: string;
}

interface ICardPayloadMessage extends IMessage {
  type: 'cardPayload';
  id: string;
  payload: string;
}

function isRendererReadyMessage(data: any): data is IRendererReadyMessage {
  return (
    typeof data === 'object' &&
    data.type === 'ac-renderer-ready' &&
    typeof data.id === 'string'
  );
}

let currentCardId = 0;

export function AdaptiveCardPreview({ cardJson }: AdaptiveCardPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const cardIdRef = useRef<string>((currentCardId++).toString());

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== adaptiveCardToolsBaseUrl) {
        return;
      }

      if (
        isRendererReadyMessage(event.data) &&
        event.data.id === cardIdRef.current
      ) {
        // Pass the card payload to the iframe
        const message: ICardPayloadMessage = {
          type: 'cardPayload',
          id: cardIdRef.current,
          payload: cardJson,
        };

        iframeRef.current?.contentWindow?.postMessage(message, rendererUrl);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [cardJson]);

  return (
    <div className="adaptive-card-preview">
      <iframe
        ref={iframeRef}
        className="adaptive-card-iframe"
        src={`${rendererUrl}?id=${cardIdRef.current}`}
        title="Adaptive Card Preview"
      />
    </div>
  );
}
