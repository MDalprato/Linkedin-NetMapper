# LinkedIn NetMapper

Mappa le tue connessioni LinkedIn per azienda, esplora il tuo network con una vista ad albero e genera insight con Gemini.

## Funzionalita

- Importa `Connections.csv` e crea un albero interattivo delle aziende.
- Dashboard con totale connessioni e top aziende.
- Dettaglio nodo con ruolo, azienda, data di connessione e link al profilo.
- Insight AI su focus di settore, opportunita e strategie di networking.

## Come ottenere Connections.csv

1. Vai su https://www.linkedin.com/psettings/member-data
2. Seleziona "Get a copy of your data" e spunta "Connections".
3. Richiedi l'archivio e scarica il file quando pronto.

## Avvio locale

**Prerequisiti:** Node.js

1. Installa le dipendenze:
   `npm install`
2. Crea `.env.local` con la tua chiave Gemini:
   `GEMINI_API_KEY=your_key_here`
3. Avvia il progetto:
   `npm run dev`
4. Apri `http://localhost:3000`

## Script utili

- `npm run dev` avvia il server di sviluppo
- `npm run build` crea la build di produzione
- `npm run preview` avvia l'anteprima della build

## Note su privacy e dati

- Il file CSV viene elaborato localmente nel browser e non viene salvato.
- Se usi "Generate AI Insights", vengono inviati a Gemini: top aziende, un campione di ruoli e il totale connessioni.
- Puoi usare l'app anche senza chiave API se non ti servono gli insight AI.

## Limitazioni note

- L'albero mostra le prime 50 aziende per performance.
- Il prompt AI usa un campione iniziale di 50 connessioni.
