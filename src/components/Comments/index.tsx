import { ReactElement, useEffect, useRef } from 'react';
import utteranceScript from '../../services/utterances';

export function Comments(): ReactElement {
  const commentsDiv = useRef<HTMLDivElement>();

  useEffect(() => {
    const script = utteranceScript();
    if (commentsDiv) {
      commentsDiv.current.appendChild(script);
    }
  }, []);

  return <div ref={commentsDiv} />;
}
