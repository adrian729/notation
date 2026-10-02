# @polyhymnia/notation-react

React SVG renderer for MNX scores laid out by `@polyhymnia/notation-engine`: a `<Notation>` component with interaction, note marks, playback highlighting and a cursor driven by your own clock.

```sh
npm install @polyhymnia/notation-react react react-dom
```

```tsx
import { Notation } from '@polyhymnia/notation-react';
import '@polyhymnia/notation-react/styles.css';

<Notation score={doc} options={{ style: 'modern' }} />;
```

MIT licensed. Source: https://github.com/adrian729/notation
