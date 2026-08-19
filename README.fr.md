# dsh-multi-lang-ui

**Langues :** [English](README.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md)

Un plugin DSH qui ajoute **plusieurs langues** aux options de langue de l'interface Web de [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) — **繁體中文, 日本語, 한국어, Français, Deutsch, Español**. Les chaînes d'interface connues utilisent des traductions peaufinées à la main (chaque langue est traduite à partir de la version de référence anglaise) ; toute chaîne *nouvelle / mise à jour / tierce* retombe sur l'anglais (ou, pour 繁體中文, sur un convertisseur Simplifié→Traditionnel à l'exécution) — les mises à jour de l'interface en amont et les autres plugins sont ainsi couverts **sans retraduire chaque langue**.

## Fonctionnalités

- Ajoute **6 langues** au menu « Paramètres → Général → Langue » (en plus des 中文 / English intégrés) : 繁體中文, 日本語, 한국어, Français, Deutsch, Español.
- **Traductions peaufinées à la main par langue** : chaque espace de noms de locale officiel est traduit chaîne par chaîne à partir de la **version de référence anglaise** (700+ chaînes par langue).
- **Repli pour les chaînes non traduites** : chaînes ajoutées en amont ou provenant de plugins tiers — 繁體中文 utilise une table de caractères Simplifié→Traditionnel intégrée (720+ caractères) convertie à la volée ; les autres langues retombent sur l'anglais (les dictionnaires officiels `en` sont complets pour chaque espace de noms), donc aucun texte corrompu ou manquant n'apparaît.
- **Conversion de repli au niveau du DOM (zh-TW uniquement)** : le contenu hors dictionnaire (par ex. les descriptions du marché de plugins) est converti du simplifié au traditionnel via MutationObserver en mode zh-TW (les champs de saisie, les blocs de code et autres contenus utilisateur sont toujours exclus).
- **Persistance** : le choix de langue est stocké dans le `localStorage` du navigateur et survit aux rechargements.
- **Non intrusif** : un pur plugin client — aucun paquet amont n'est modifié ; il se dégrade silencieusement si le service de locale est indisponible, sans affecter les autres plugins.

## Installation

**Recommandé : installer depuis GitHub (donnez ce lien à un agent, ou exécutez-le vous-même)**

```bash
dsh plugin --profile web add https://github.com/asd13006/dsh-multi-lang-ui
```

Ou laissez un agent l'installer : collez le lien de ce dépôt dans DSH et demandez à l'agent d'exécuter la commande ci-dessus.

Après l'installation, redémarrez `dsh web`, puis choisissez votre langue dans « Paramètres → Général → Langue ».

**Désinstallation (important)** : utilisez toujours `dsh plugin remove` — cela nettoie la liste des bundles du profil ; supprimer manuellement le paquet peut laisser des références orphelines qui empêchent DSH de démarrer :

```bash
dsh plugin --profile web remove dsh-multi-lang-ui
```

**npm install (une fois publié)** :

```bash
dsh plugin --profile web add dsh-multi-lang-ui
```

## Comment ça fonctionne

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

Au démarrage, le plugin :

1. Enregistre les dictionnaires par langue pour chaque espace de noms de locale ;
2. Enveloppe `locale.translate` (peaufiné → repli) et `locale.setLocale` (accepte nos identifiants de langue, écrit dans `localStorage`) ;
3. Ajoute toutes nos langues à la liste des options de langue (corrige l'instantané de locale et déclenche `locale/change` pour actualiser la ligne des paramètres) ;
4. Enveloppe `locale.adopt` — la préférence d'hôte de la locale intégrée se charge de manière asynchrone et réinitialise `active` sur `locale.preference ?? langue du navigateur` ; si la préférence de l'utilisateur est l'une de nos langues, elle est ré-affirmée ;
5. Démarre la conversion de repli au niveau du DOM (MutationObserver) en mode zh-TW pour le contenu hors dictionnaire, avec restauration au changement de langue.

## Dois-je retraduire après une mise à jour en amont ?

**Non.** Trois niveaux de protection :

1. Chaînes ajoutées en amont → couvertes à la volée par le mécanisme de repli ;
2. Chaînes modifiées en amont → les dictionnaires peaufinés conservent les anciennes valeurs, tandis que les chaînes nouvelles/tierces retombent toujours automatiquement ; régénérez les dictionnaires peaufinés quand vous voulez une synchronisation complète (ci-dessous) ;
3. Pour synchroniser complètement les traductions peaufinées : exécutez une fois le processus de régénération — aucun travail manuel chaîne par chaîne.

### Régénération des dictionnaires peaufinés (facultatif)

```bash
node scripts/extract.mjs <path-to-node_modules/@deepseek-ai>   # 1. extract the latest zh/en dicts into src/zh-src/ and src/en/
# 2. translate src/en/*.json → src/<lang>/*.json (LLM batch OK; keys and placeholders must match)
node scripts/assemble.mjs                                     # 3. regenerate lib/client.js
```

### Vérification des caractères simplifiés non couverts (après mises à jour en amont/tierces)

```bash
node scripts/collect-chars.mjs [third-party-client.js...]   # collect all Simplified characters in use
node scripts/check-missing-chars.mjs                        # list Simplified-only characters missing from the char table
```

Si des caractères sont signalés, ajoutez la correspondance `"简字": "繁字"` dans `src/zh-tw-parts/chars.json`, puis exécutez `node scripts/assemble.mjs`.

## Structure du dépôt

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

## Limitations connues

- Les caractères simplifiés à correspondance multiple (par ex. 复 dans 复制/恢复/复杂 mappé vers différentes formes traditionnelles) utilisent une seule correspondance (復) ; les dictionnaires peaufinés couvrent les chaînes principales, mais quelques nouvelles chaînes peuvent se convertir imparfaitement.
- La préférence de langue vit dans le `localStorage` du navigateur (par navigateur) ; la locale intégrée n'est pas non plus persistante pour les navigateurs distants — c'est un choix de conception cohérent.
- Les caractères simplifiés absents de la table de caractères passent tels quels — exécutez `check-missing-chars.mjs` régulièrement et étendez la table.

## Sécurité et confidentialité

- **Aucun trafic réseau** : le plugin ne fait jamais de requête réseau (pas de fetch / WebSocket / télémétrie) ; la seule URL externe est le lien de documentation de ce README.
- **Aucune collecte de données** : pas de télémétrie, d'analytique ni de rapport d'erreurs ; la seule donnée persistée est `localStorage["dsh-multi-lang-ui.preference"]` (un identifiant de langue tel que `"ja"`).
- **Aucun accès aux données sensibles** : pas d'identifiants / jetons / enregistrements de session / accès au système de fichiers ; le côté hôte (`index.mjs`) est une opération sans effet.
- **Conversion DOM en lecture seule** : seuls les nœuds de texte sont réécrits (pas d'innerHTML, pas d'injection) ; les champs de saisie, textarea, contenteditable et les blocs de code (pre/code) sont toujours exclus, donc la saisie et le code ne sont jamais affectés. Les messages de session affichés sont convertis (effet d'affichage en lecture seule ; les données stockées sont inchangées) et restaurés au retour à la langue précédente.
- **Risque zéro sur la chaîne d'approvisionnement** : `dependencies` est vide — l'installation ne télécharge rien de nouveau ; le bundle client est entièrement autonome (zéro `require`) ; les peer dependencies sont des paquets officiels déjà présents dans DSH.

## FAQ

**Q : Pourquoi dshmarket n'affiche-t-il pas la description de mon plugin ?**
R : La description et la catégorie du marché proviennent du registre peaufiné « awesome-dsh-plugin » (`data/plugins/<owner>__<repo>.yml`), et non du package.json local. Une fois l'entrée fusionnée dans ce registre, elle apparaîtra.

**Q : Dois-je publier sur npm pour obtenir un numéro de version sur le marché ?**
R : Non. La version d'un plugin installé est lue depuis son package.json local dans `node_modules` (une installation GitHub affiche déjà `v0.1.0`). La publication sur npm n'affecte que la recherche npm et les installations npm simples.

**Q : Dois-je mettre à jour le plugin lorsque l'amont ajoute de nouvelles chaînes ?**
R : Non — le repli à l'exécution couvre immédiatement les nouvelles chaînes, y compris les chaînes en chinois simplifié des plugins tiers. Régénérez les dictionnaires peaufinés avec `scripts/` lorsque vous voulez une synchronisation de meilleure qualité.

**Q : DSH ne démarre plus après avoir supprimé le plugin ?**
R : Supprimez toujours via `dsh plugin --profile web remove dsh-multi-lang-ui` (cela nettoie la liste des bundles du profil). Supprimer manuellement le paquet peut laisser des références orphelines qui cassent le démarrage.

## Licence

MIT
