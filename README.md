# J-Harmonix

Generatore di armonie jazz professionale che gira interamente nel browser, senza backend né dipendenze esterne.

Dato un centro tonale, una scala, una forma canzone, uno stile armonico, un livello di complessità e una frequenza di modulazione, genera una progressione di accordi completa suddivisa per sezioni.

## Funzionalità

- Generazione di progressioni jazz basata su regole (turnaround, dominanti secondari, sostituzioni di tritono)
- 15 scale built-in (maggiore, minore, modi, ecc.)
- Stili armonici selezionabili (Bebop, Modal, Post-bop, ecc.)
- Livelli di complessità degli accordi (triadi → accordi alterati a 13esima)
- Modulazioni per il bridge (pivot, ii-V, sostituzione di tritono)
- Generazione deterministica tramite seed — ogni progressione è riproducibile
- Copia in clipboard del risultato in testo semplice

## Tech stack

| Layer | Tecnologia |
|---|---|
| Build / Dev server | Vite 8 (Rolldown) |
| Linguaggio | TypeScript 6 |
| Testing | Vitest |
| UI | Vanilla TypeScript + DOM — nessun framework |
| CSS | CSS puro, nessun preprocessore |

## Prerequisiti

- [Node.js](https://nodejs.org/) ≥ 18

## Installazione

```bash
npm install
```

## Avvio

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia il dev server con hot-reload |
| `npm run build` | Esegue il type-check e produce il bundle in `dist/` |
| `npm run preview` | Serve la build di produzione da `dist/` in locale |
| `npm run test` | Esegue la suite di test una volta |
| `npm run test:watch` | Esegue i test in modalità watch |

Per lo sviluppo:

```bash
npm run dev
```

Apri il browser all'indirizzo mostrato nel terminale (di default `http://localhost:5173`).

## Struttura del progetto

```
src/
├── main.ts          # UI layer: HTML, stato, event delegation
├── style.css        # Design system CSS
└── core/            # Logica di dominio pura (no dipendenze UI)
    ├── index.ts     # Barrel export
    ├── types.ts     # Enum e interfacce
    ├── model/       # Value object immutabili (Note, Scale, Chord, ...)
    ├── engine/      # Pipeline di generazione (HarmonyGeneratorService, ...)
    └── __tests__/   # Unit test e integration test
```

La `core/` è completamente indipendente dalla UI e testabile in isolamento.

## Variabili d'ambiente

Nessuna. L'app non fa chiamate di rete né richiede chiavi API.
