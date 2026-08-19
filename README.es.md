# dsh-multi-lang-ui

**Idiomas:** [English](README.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md)

Un plugin de DSH que añade **múltiples idiomas** a las opciones de idioma de la interfaz web del [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): **繁體中文, 日本語, 한국어, Français, Deutsch, Español**. Las cadenas de interfaz conocidas usan traducciones pulidas a mano (cada idioma se traduce a partir de la línea base en inglés); cualquier cadena *nueva / actualizada / de terceros* recurre al inglés (o, en el caso de 繁體中文, a un conversor de Simplificado→Tradicional en tiempo de ejecución) — de modo que las actualizaciones de la interfaz de upstream y otros plugins quedan cubiertos **sin retraducir cada idioma**.

## Características

- Añade **6 idiomas** al menú «Configuración → General → Idioma» (junto a los integrados 中文 / English): 繁體中文, 日本語, 한국어, Français, Deutsch, Español.
- **Traducciones pulidas a mano por idioma**: cada espacio de nombres de locale oficial se traduce cadena por cadena a partir de la **línea base en inglés** (más de 700 cadenas por idioma).
- **Respaldo para cadenas sin traducir**: cadenas añadidas por upstream o por plugins de terceros — 繁體中文 usa una tabla de caracteres Simplificado→Tradicional integrada (más de 720 caracteres) convertida sobre la marcha; los demás idiomas recurren al inglés (los diccionarios oficiales `en` están completos para cada espacio de nombres), de modo que no aparece texto corrupto ni faltante.
- **Conversión de respaldo a nivel de DOM (solo zh-TW)**: el contenido que no está en el diccionario (p. ej., descripciones del mercado de plugins) se convierte de chino simplificado a tradicional mediante MutationObserver en modo zh-TW (los campos de entrada, los bloques de código y otro contenido del usuario quedan siempre excluidos).
- **Persistencia**: la elección de idioma se guarda en el `localStorage` del navegador y sobrevive a las recargas.
- **Cero intrusión**: un plugin puramente de cliente — no se modifica ningún paquete de upstream; degrada silenciosamente si el servicio de locale no está disponible, sin afectar a otros plugins.

## Instalación

**Recomendado: instalar desde GitHub (dale este enlace a un agente, o ejecútalo tú mismo)**

```bash
dsh plugin --profile web add https://github.com/asd13006/dsh-multi-lang-ui
```

O deja que un agente lo instale: pega el enlace de este repositorio en DSH y pídele al agente que ejecute el comando anterior.

Tras la instalación, reinicia `dsh web` y elige tu idioma en «Configuración → General → Idioma».

**Desinstalación (importante)**: usa siempre `dsh plugin remove` — limpia la lista de bundles del perfil; eliminar el paquete manualmente puede dejar referencias colgantes que impiden que DSH arranque:

```bash
dsh plugin --profile web remove dsh-multi-lang-ui
```

**npm install (una vez publicado)**:

```bash
dsh plugin --profile web add dsh-multi-lang-ui
```

## Cómo funciona

```
locale translate(ns, key)
        │
        ├─ active is one of our languages ?
        │     ├─ curated translation exists (DICTS) ?  → return it
        │     └─ missing (new strings / third-party plugins)
        │           ├─ zh-TW  → convert the zh value via the char table
        │           └─ others → fall back to the en value
        └─ other languages → handled by dsh-client-locale as usual
```

Al iniciar, el plugin:

1. Registra los diccionarios por idioma para cada espacio de nombres de locale;
2. Envuelve `locale.translate` (curado → respaldo) y `locale.setLocale` (acepta nuestros ids de idioma y escribe en `localStorage`);
3. Añade todos nuestros idiomas a la lista de opciones de idioma (parchea la instantánea del locale y dispara `locale/change` para actualizar la fila de configuración);
4. Envuelve `locale.adopt` — la preferencia de host del locale integrado se carga de forma asíncrona y restablece `active` a `locale.preference ?? browser language`; si la preferencia del usuario es uno de nuestros idiomas, se reafirma;
5. Inicia la conversión de respaldo a nivel de DOM (MutationObserver) en modo zh-TW para el contenido que no está en el diccionario, y la restaura al cambiar a otro idioma.

## ¿Necesito retraducir tras las actualizaciones de upstream?

**No.** Tres capas de protección:

1. Cadenas añadidas por upstream → cubiertas sobre la marcha por el mecanismo de respaldo;
2. Cadenas modificadas por upstream → los diccionarios curados conservan los valores antiguos, mientras que las cadenas nuevas/de terceros siguen recurriendo automáticamente al respaldo; regenera los diccionarios curados cuando quieras una sincronización completa (más abajo);
3. Para sincronizar por completo las traducciones curadas: ejecuta el flujo de regeneración una vez — sin trabajo manual cadena por cadena.

### Regenerar los diccionarios curados (opcional)

```bash
node scripts/extract.mjs <path-to-node_modules/@deepseek-ai>   # 1. extract the latest zh/en dicts into src/zh-src/ and src/en/
# 2. translate src/en/*.json → src/<lang>/*.json (LLM batch OK; keys and placeholders must match)
node scripts/assemble.mjs                                     # 3. regenerate lib/client.js
```

### Comprobar los caracteres simplificados no cubiertos (tras actualizaciones de upstream/de terceros)

```bash
node scripts/collect-chars.mjs [third-party-client.js...]   # collect all Simplified characters in use
node scripts/check-missing-chars.mjs                        # list Simplified-only characters missing from the char table
```

Si se informa de alguno, añade el mapeo `"简字": "繁字"` a `src/zh-tw-parts/chars.json` y ejecuta `node scripts/assemble.mjs`.

## Estructura del repositorio

```
dsh-multi-lang-ui/
├── package.json              # plugin manifest (dsh.client.inject / bundle.patch)
├── index.mjs                 # Host side: no-op entry (pure client plugin)
├── cordis.patch.yml          # Host plugin entry
├── lib/client.js             # generated browser bundle (do not edit by hand)
├── src/
│   ├── zh-src/               # extracted zh (Simplified Chinese) dicts (generated data)
│   ├── en/                   # extracted en dicts (translation baseline for all languages)
│   ├── zh-tw/ ja/ ko/ fr/ de/ es/   # per-language curated translations (quality baseline)
│   ├── zh-tw-parts/
│   │   ├── chars.json        # Simplified→Traditional char table (zh-TW runtime fallback)
│   │   ├── simplified-only.txt  # Simplified-only character checklist (maintenance)
│   │   └── collected-chars.txt  # collect-chars output
│   └── TERMINOLOGY.md        # terminology reference (used when polishing translations)
├── scripts/                  # extract / assemble / verify / collect / check
└── verify/                   # Playwright end-to-end verification scripts
```

## Limitaciones conocidas

- Los caracteres simplificados uno-a-muchos (p. ej., 复 en 复制/恢复/复杂 se corresponde con distintas formas tradicionales) usan un único mapeo (復); los diccionarios curados cubren las cadenas principales, pero algunas cadenas nuevas pueden convertirse de forma imperfecta.
- La preferencia de idioma vive en el `localStorage` del navegador (por navegador); el locale integrado tampoco es persistente para los navegadores remotos — es un diseño coherente.
- Los caracteres simplificados que no están en la tabla de caracteres pasan sin cambios — ejecuta `check-missing-chars.mjs` periódicamente y amplía la tabla.

## Seguridad y privacidad

- **Sin tráfico de red**: el plugin nunca realiza ninguna petición de red (sin fetch / WebSocket / telemetría); la única URL externa es el enlace de documentación de este README.
- **Sin recopilación de datos**: sin telemetría, analíticas ni informes de errores; el único dato persistido es `localStorage["dsh-multi-lang-ui.preference"]` (un id de idioma como `"ja"`).
- **Sin acceso a datos sensibles**: sin credenciales / tokens / registros de sesión / acceso al sistema de archivos; el lado del host (`index.mjs`) es un no-op.
- **Conversión de DOM de solo lectura**: solo se reescriben los nodos de texto (sin innerHTML, sin inyección); los campos de entrada, textarea, contenteditable y los bloques de código (pre/code) quedan siempre excluidos, de modo que escribir y el código nunca se ven afectados. Los mensajes de sesión mostrados se convierten (efecto de visualización de solo lectura; los datos almacenados no cambian) y se restauran al volver a cambiar de idioma.
- **Riesgo cero en la cadena de suministro**: `dependencies` está vacío — instalar no descarga nada nuevo; el bundle de cliente es totalmente autocontenido (cero `require`); las dependencias peer son paquetes oficiales ya presentes en DSH.

## Preguntas frecuentes

**P: ¿Por qué dshmarket no muestra la descripción de mi plugin?**
R: La descripción y la categoría del mercado proceden del registro curado «awesome-dsh-plugin» (`data/plugins/<owner>__<repo>.yml`), no del package.json local. Una vez que la entrada se fusiona en ese registro, aparecerá.

**P: ¿Necesito publicar en npm para obtener un número de versión en el mercado?**
R: No. La versión de un plugin instalado se lee del package.json local en `node_modules` (una instalación desde GitHub ya muestra `v0.1.0`). Publicar en npm solo afecta a la búsqueda en npm y a las instalaciones directas desde npm.

**P: ¿Necesito actualizar el plugin cuando upstream añade cadenas nuevas?**
R: No — el respaldo en tiempo de ejecución cubre las cadenas nuevas de inmediato, incluidas las cadenas en chino simplificado de plugins de terceros. Regenera los diccionarios curados con `scripts/` cuando quieras una sincronización de máxima calidad.

**P: ¿DSH no arranca después de eliminar el plugin?**
R: Elimínalo siempre mediante `dsh plugin --profile web remove dsh-multi-lang-ui` (limpia la lista de bundles del perfil). Borrar el paquete manualmente puede dejar referencias colgantes que rompen el arranque.

## Licencia

MIT
