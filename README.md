# Sivivi — Local Desktop CV Generator

A fully-offline Electron + Vue 3 application that turns structured form data
(or an Excel import) into a Microsoft Word `.docx` using your own `.docx`
templates. Templates are never modified — Sivivi injects data into a fresh copy
via Docxtemplater + PizZip and writes the result to a local folder.

## Stack

- Electron · Vue 3 · Vite · Pinia · Vue Router
- TailwindCSS · vuedraggable
- docxtemplater · pizzip · xlsx · electron-store

## Quick start

```bash
npm install
npm run dev      # starts Vite + Electron in dev mode
npm run dist     # bundles a production app via electron-builder
```

## Project layout

```
electron/             Electron main process (CommonJS)
  main.cjs            Window + lifecycle
  preload.cjs         Whitelisted contextBridge API
  ipc/                IPC handlers (templates, excel, docx, storage, generated)
  paths.cjs           Resolves templates/ and generated/ in dev + prod
src/
  pages/              Route-level views
  components/         UI + form components
  stores/             Pinia stores (cv, template, ui)
  services/           Renderer-side facades over the preload bridge
  utils/              Pure helpers (normalize, filename)
templates/            Drop your .docx + preview images here
  templates.json      Metadata registered with the app
generated/            Output folder (dev). In packaged builds: userData/generated
```

## Adding a template

1. Design your CV in Microsoft Word.
2. Insert placeholders (see `templates/PLACEHOLDERS.txt`):
   - Simple: `{{full_name}}`, `{{summary}}`
   - Loops: `{{#experiences}} {{role}} — {{company}} {{/experiences}}`
3. Save as `templates/<id>.docx` (e.g. `modern.docx`).
4. Register it in `templates/templates.json`:
   ```json
   {
     "id": "modern",
     "name": "Modern CV",
     "file": "modern.docx",
     "preview": "modern.png"
   }
   ```
5. Restart the app or click **Refresh** on the Templates page.

## Excel import

A workbook with any subset of the sheets below will auto-fill the form:

| Sheet         | Columns (case-insensitive)                                        |
| ------------- | ----------------------------------------------------------------- |
| biodata       | full_name, job_title, email, phone, address, linkedin, summary    |
| experiences   | role, company, duration, location, description                    |
| education     | institution, degree, year, description                            |
| skills        | name, level                                                       |
| certifications| name, issuer, year                                                |
| projects      | name, role, year, description, link                               |

## Why placeholders, not HTML

The brief explicitly forbids rebuilding layouts from HTML. Sivivi keeps the
exact `.docx` provided by the template author — fonts, columns, headers,
images, colors — and only swaps the placeholder runs. That guarantees
pixel-perfect fidelity in Word.

## Offline guarantee

- No network calls. No analytics. No cloud SDKs.
- `templates/` is a local folder.
- `generated/` is a local folder.
- Draft state lives in `electron-store` on disk.
