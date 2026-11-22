// Umbral Vault hand-in program (Node 22, standard library only): copies the game and its
// screenshots from beside this file into the output directory and writes dossier.json, the
// summary the judge reads, using the vendored make.fun library. The grader's /output is
// replaced by MAKEFUN_OUTPUT_DIR outside the grader:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });

// The game itself: plain static files, served by any static HTTP server, game/index.html
// opens in desktop Chrome and plays offline.
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });

// Screenshots taken of the running game; the first by name is the judge's cover.
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Caps mirror the scorer's gate (reference/gate.json): text_max_bytes shapes the dossier's
// source text, the rest refuse an entry the scorer would refuse anyway.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
