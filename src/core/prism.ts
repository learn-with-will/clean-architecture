// Prism core + the languages the Clean Architecture lessons use. `typescript`
// is the primary language — the readable, statically-typed language the code
// examples are written in (entities, use cases, ports, adapters). Prism's
// TypeScript grammar extends JavaScript, so `prism-javascript` is imported
// first as a required dependency. `bash` covers shell/tooling commands and
// `json` covers small config snippets (package.json, tsconfig). Plain `text`
// fences (folder trees, diagrams, console output) are left unhighlighted.
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';

export default Prism;
