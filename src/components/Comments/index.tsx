import { ReactElement, useEffect } from 'react';
import utteranceScript from '../../services/utterances';

export function Comments(): ReactElement {
  return (
    <div
      id="commentsComponent"
      ref={elem => {
        if (!elem) {
          return;
        }
        elem.appendChild(utteranceScript());
      }}
    />
  );
}
