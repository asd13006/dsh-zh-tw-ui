# dsh-multi-lang-ui

**언어 / Languages:** [English](README.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md)

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web UI의 언어 옵션에 **여러 언어**를 추가하는 DSH 플러그인 — **繁體中文, 日本語, 한국어, Français, Deutsch, Español**. 알려진 UI 문자열에는 정성 번역을 사용하며(각 언어는 영어 기준본에서 번역됨), *새로 추가 / 변경 / 타사* 문자열은 영어로 폴백합니다(繁體中文은 런타임에서 간체→번체 변환기 사용). 따라서 업스트림 UI 업데이트와 다른 플러그인이 **모든 언어를 다시 번역하지 않고도** 처리됩니다.

## 기능

- "Settings → General → Language" 메뉴에 **6개 언어**를 추가합니다(내장 中文 / English와 함께): 繁體中文, 日本語, 한국어, Français, Deutsch, Español.
- **언어별 정성 번역**: 공식 locale 네임스페이스마다 **영어 기준본**에서 문자열 단위로 번역합니다(언어당 700+ 문자열).
- **미번역 문자열 폴백**: 업스트림 추가 또는 타사 플러그인 문자열 — 繁體中文은 내장 간체→번체 문자표(720+자)로 즉시 변환하고, 나머지 언어는 영어로 폴백합니다(공식 `en` 사전은 모든 네임스페이스에 대해 완비), 그래서 깨지거나 누락된 텍스트가 나타나지 않습니다.
- **DOM 수준 폴백 변환(zh-TW 전용)**: 사전에 없는 콘텐츠(예: 플러그인 마켓 설명)는 zh-TW 모드에서 MutationObserver를 통해 간체→번체로 변환됩니다(입력 필드, 코드 블록 등 사용자 콘텐츠는 항상 제외).
- **지속성**: 언어 선택은 브라우저 `localStorage`에 저장되어 새로고침 후에도 유지됩니다.
- **비침투적**: 순수 클라이언트 플러그인 — 업스트림 패키지를 수정하지 않으며, locale 서비스를 사용할 수 없으면 조용히 폴백되어 다른 플러그인에 영향을 주지 않습니다.

## 설치

**권장: GitHub에서 설치(에이전트에 이 링크를 주거나 직접 실행)**

```bash
dsh plugin --profile web add https://github.com/asd13006/dsh-multi-lang-ui
```

또는 에이전트에게 설치를 맡기세요: 이 저장소 링크를 DSH에 붙여넣고 위 명령을 실행하도록 요청하면 됩니다.

설치 후 `dsh web`을 재시작하고 "Settings → General → Language"에서 언어를 선택하세요.

**제거(중요)**: 항상 `dsh plugin remove`를 사용하세요 — 프로필의 bundle 목록을 정리합니다. 패키지를 수동으로 삭제하면 DSH 시작을 막는 잔여 참조(dangling references)가 남을 수 있습니다:

```bash
dsh plugin --profile web remove dsh-multi-lang-ui
```

**npm install(게시 후)**:

```bash
dsh plugin --profile web add dsh-multi-lang-ui
```

## 동작 방식

```
locale translate(ns, key)
        │
        ├─ active가 우리 언어 중 하나인가 ?
        │     ├─ 정성 번역이 존재(DICTS) ?  → 그 값을 반환
        │     └─ 없음(새 문자열 / 타사 플러그인)
        │           ├─ zh-TW  → 문자표를 통해 zh 값을 변환
        │           └─ 기타   → en 값으로 폴백
        └─ 다른 언어 → 평소대로 dsh-client-locale이 처리
```

플러그인은 시작 시 다음을 수행합니다:

1. 모든 locale 네임스페이스에 언어별 사전을 등록합니다.
2. `locale.translate`(정성 번역 → 폴백)와 `locale.setLocale`(우리 언어 id를 받아들이고 `localStorage`에 기록)을 래핑합니다.
3. 언어 옵션 목록에 우리 언어를 모두 추가합니다(locale 스냅샷을 패치하고 `locale/change`를 발생시켜 설정 행을 갱신).
4. `locale.adopt`를 래핑합니다 — 내장 locale의 호스트 기본 설정이 비동기로 로드되어 `active`를 `locale.preference ?? 브라우저 언어`로 재설정하는데, 사용자 기본 설정이 우리 언어 중 하나이면 다시 적용됩니다.
5. zh-TW 모드에서 사전에 없는 콘텐츠에 대한 DOM 수준 폴백 변환(MutationObserver)을 시작하고, 다른 언어로 전환하면 복원합니다.

## 업스트림 업데이트 후 다시 번역해야 하나요?

**아니요.** 3중 보호 장치가 있습니다:

1. 업스트림 추가 문자열 → 폴백 메커니즘이 즉시 처리합니다.
2. 업스트림 변경 문자열 → 정성 사전은 기존 값을 유지하고, 새/타사 문자열은 자동으로 폴백됩니다. 전체 동기화가 필요하면 정성 사전을 재생성하세요(아래).
3. 정성 번역을 완전히 동기화하려면: 재생성 흐름을 한 번 실행하세요 — 문자열별 수동 작업이 필요 없습니다.

### 정성 사전 재생성(선택 사항)

```bash
node scripts/extract.mjs <path-to-node_modules/@deepseek-ai>   # 1. 최신 zh/en 사전을 src/zh-src/와 src/en/로 추출
# 2. src/en/*.json → src/<lang>/*.json 번역(LLM 일괄 처리 가능; 키와 플레이스홀더가 일치해야 함)
node scripts/assemble.mjs                                     # 3. lib/client.js 재생성
```

### 미커버 간체 문자 확인(업스트림/타사 업데이트 후)

```bash
node scripts/collect-chars.mjs [third-party-client.js...]   # 사용 중인 모든 간체 문자 수집
node scripts/check-missing-chars.mjs                        # 문자표에 없는 간체 전용 문자 나열
```

누락이 보고되면 `"简字": "繁字"` 매핑을 `src/zh-tw-parts/chars.json`에 추가한 뒤 `node scripts/assemble.mjs`를 실행하세요.

## 저장소 구조

```
dsh-multi-lang-ui/
├── package.json              # 플러그인 매니페스트 (dsh.client.inject / bundle.patch)
├── index.mjs                 # 호스트 측: no-op 엔트리(순수 클라이언트 플러그인)
├── cordis.patch.yml          # 호스트 플러그인 엔트리
├── lib/client.js             # 생성된 브라우저 번들(수동 편집 금지)
├── src/
│   ├── zh-src/               # 추출된 zh(간체) 사전(생성 데이터)
│   ├── en/                   # 추출된 en 사전(모든 언어의 번역 기준본)
│   ├── zh-tw/ ja/ ko/ fr/ de/ es/   # 언어별 정성 번역(품질 기준본)
│   ├── zh-tw-parts/
│   │   ├── chars.json        # 간체→번체 문자표(zh-TW 런타임 폴백)
│   │   ├── simplified-only.txt  # 간체 전용 문자 체크리스트(유지보수)
│   │   └── collected-chars.txt  # collect-chars 출력
│   └── TERMINOLOGY.md        # 용어 참조(번역 다듬기에 사용)
├── scripts/                  # extract / assemble / verify / collect / check
└── verify/                   # Playwright E2E 검증 스크립트
```

## 알려진 제한 사항

- 일대다 간체 문자(예: 复制/恢复/复杂의 复은 번체로 서로 다른 형태에 매핑됨)는 단일 매핑(復)을 사용합니다. 정성 사전이 주요 문자열을 커버하지만, 일부 새 문자열은 완벽하게 변환되지 않을 수 있습니다.
- 언어 기본 설정은 브라우저 `localStorage`(브라우저별)에 저장됩니다. 내장 locale도 원격 브라우저에서는 비영구적입니다 — 이는 일관된 설계입니다.
- 문자표에 없는 간체 문자는 그대로 통과됩니다 — `check-missing-chars.mjs`를 주기적으로 실행하고 문자표를 확장하세요.

## 보안 및 개인정보

- **네트워크 트래픽 없음**: 플러그인은 어떤 네트워크 요청도 하지 않습니다(fetch / WebSocket / 텔레메트리 없음). 유일한 외부 URL은 이 README의 문서 링크뿐입니다.
- **데이터 수집 없음**: 텔레메트리, 분석, 오류 보고가 없습니다. 유일하게 저장되는 데이터는 `localStorage["dsh-multi-lang-ui.preference"]`(예: `"ja"` 같은 언어 id)뿐입니다.
- **민감 데이터 접근 없음**: 자격 증명 / 토큰 / 세션 기록 / 파일시스템 접근이 없습니다. 호스트 측(`index.mjs`)은 no-op입니다.
- **읽기 전용 DOM 변환**: 텍스트 노드만 다시 작성됩니다(innerHTML 없음, 주입 없음). 입력 필드, textarea, contenteditable, 코드 블록(pre/code)은 항상 제외되므로 타이핑과 코드는 영향을 받지 않습니다. 표시된 세션 메시지는 변환되며(읽기 전용 표시 효과, 저장 데이터는 변경되지 않음) 다시 전환하면 복원됩니다.
- **공급망 위험 제로**: `dependencies`가 비어 있습니다 — 설치 시 새로 다운로드되는 것이 없고, 클라이언트 번들은 완전히 자체 포함(zero `require`)입니다. peer dependencies는 DSH에 이미 있는 공식 패키지입니다.

## FAQ

**Q: dshmarket에 내 플러그인 설명이 표시되지 않는 이유는?**
A: 마켓의 설명과 카테고리는 로컬 package.json이 아니라 큐레이션된 "awesome-dsh-plugin" 레지스트리(`data/plugins/<owner>__<repo>.yml`)에서 가져옵니다. 해당 항목이 레지스트리에 병합되면 표시됩니다.

**Q: 마켓에서 버전 번호를 얻으려면 npm에 게시해야 하나요?**
A: 아니요. 설치된 플러그인의 버전은 로컬 `node_modules`의 package.json에서 읽습니다(GitHub 설치는 이미 `v0.1.0`을 표시). npm 게시는 npm 검색과 일반 npm 설치에만 영향을 줍니다.

**Q: 업스트림이 새 문자열을 추가하면 플러그인을 업데이트해야 하나요?**
A: 아니요 — 런타임 폴백이 타사 플러그인의 간체 중국어 문자열을 포함해 새 문자열을 즉시 처리합니다. 최고 품질의 동기화를 원할 때만 `scripts/`로 정성 사전을 재생성하세요.

**Q: 플러그인 제거 후 DSH가 시작되지 않나요?**
A: 항상 `dsh plugin --profile web remove dsh-multi-lang-ui`로 제거하세요(프로필의 bundle 목록을 정리합니다). 패키지를 수동으로 삭제하면 시작을 깨뜨리는 잔여 참조가 남을 수 있습니다.

## 라이선스

MIT
