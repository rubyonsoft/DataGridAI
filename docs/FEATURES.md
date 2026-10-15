# AiGrid 기능 설명 (Features)

AiGrid 0.2.2은 브라우저에서 동작하는 JavaScript 데이터 그리드입니다. 프레임워크 없이 `<script>` 태그로 쓰거나 React 컴포넌트 `AiGridReact`로 씁니다.
이 문서는 기능별로 무엇을 할 수 있는지와 해당 옵션·메서드 이름을 정리합니다. 전체 시그니처는 [API.md](API.md)를 보세요.

> **English summary.** AiGrid is a browser JavaScript data grid (data table / spreadsheet-like editable grid) for plain JavaScript and React. Features: cell editing with 12 column types, change tracking (inserted/updated/deleted), validation, undo/redo, Excel-compatible copy & paste, range selection, multi-column sorting, filtering with 20+ operators and AND/OR, caption (column header) menu, row filter, column resize/hide/pin, frozen columns, sticky header/footer/rows, header groups, cell merge, grouping with drag & drop, tree grid with lazy loading, summary rows, client and server paging, server mode with sort/filter query and NDJSON, virtual scrolling for 500,000+ rows, CSV import/export, Excel import/export (SheetJS), state save/restore, themes, keyboard navigation and accessibility, and safe (text-only) cell rendering.

실행 예제: https://rubyon.azurewebsites.net/sample/example.html (JavaScript) · https://rubyon.azurewebsites.net/sample/react/index.html (React)

## 목차

1. [데이터 연결](#1-데이터-연결)
2. [열 타입](#2-열-타입)
3. [편집과 변경 추적](#3-편집과-변경-추적)
4. [입력 검증](#4-입력-검증)
5. [선택, 복사·붙여넣기](#5-선택-복사붙여넣기)
6. [정렬과 필터](#6-정렬과-필터)
7. [열 머리글 메뉴와 열 관리](#7-열-머리글-메뉴와-열-관리)
8. [레이아웃과 스타일](#8-레이아웃과-스타일)
9. [그룹, 트리, 요약 행](#9-그룹-트리-요약-행)
10. [페이징과 서버 모드](#10-페이징과-서버-모드)
11. [대량 데이터](#11-대량-데이터)
12. [가져오기·내보내기 (CSV, Excel)](#12-가져오기내보내기-csv-excel)
13. [상태 저장과 키 기반 API](#13-상태-저장과-키-기반-api)
14. [이벤트](#14-이벤트)
15. [키보드와 접근성](#15-키보드와-접근성)
16. [보안](#16-보안)
17. [React](#17-react)
18. [제한 사항](#18-제한-사항)

## 1. 데이터 연결

| 방식 | 설정 | 설명 |
|---|---|---|
| 로컬 배열 | `dataSource: rows` | 행 객체 배열을 바로 표시합니다. |
| JSON 파일·API | `dataSource: { url, rowsPath, fallbackUrl }` | `{ rows: [...] }`, 지정 경로(`rowsPath`), 열 이름+값 배열의 columnar 응답(`{ columns, data }`)을 읽습니다. 실패하면 `fallbackUrl`을 씁니다. |
| 서버 모드 | `dataSource: { url, serverMode: true }` | 정렬·필터·페이지를 서버에 맡깁니다(10절). |
| NDJSON 스트림 | `responseType: "ndjson"` | 줄 단위 JSON 응답을 읽습니다. |
| 사용자 전송 함수 | `dataSource: { serverMode: true, transport }` | `transport({ query, offset, limit, signal })`가 `{ rows, total }`을 반환합니다. 인증 헤더나 POST 요청을 직접 구현할 때 씁니다. |

- `mount`에는 CSS 선택자나 DOM 요소를 넘깁니다.
- `createGrid()`는 Promise를 반환합니다. 화면에서 그리드를 없앨 때는 `destroy()`를 호출합니다.

## 2. 열 타입

열은 `columns: [{ key, title, type, width, ... }]`로 정의합니다.

| `type` | 용도 |
|---|---|
| `rowno` | 행 번호(서버 페이징 시 전체 기준 번호) |
| `row-check` | 행 선택 체크박스(머리글 전체 선택 포함) |
| `text` | 한 줄 텍스트 |
| `multitext` | 여러 줄 텍스트 |
| `number` | 숫자. `format`으로 표시 형식 지정 |
| `date` | 날짜 |
| `check` | 체크 값(기본 `"T"` / `"F"`). `trueValue`, `falseValue`, `trueLabel`, `falseLabel`로 값과 표시 문구 지정 |
| `radio` | 라디오 선택. `options: [{ value, label }]`로 선택지 지정 |
| `combo-master` / `combo-detail` | 상위 값에 따라 하위 목록이 바뀌는 연동 콤보. 상위 열에 `options: [{ value, label }]`, 하위 열에 `parentKey`와 `options: [{ value, label, parent }]`를 지정합니다. 상위 값이 바뀌면 하위 값은 첫 선택지로 바뀝니다 |
| `template` | `cellTemplate`가 반환하는 DOM 노드로 그리는 셀(이미지, 배지 등) |
| `button` | 셀 안의 편집·삭제 버튼 |

공통 열 속성: `key`, `title`, `type`, `width`(숫자 또는 `%`), `align`, `readOnly`, `hidden`, `pin`(`"left"`/`"right"`), `format`, `cellTemplate`, `validation`, `validators`, `headerStyle`, `cellStyle`, `className`, `colCss`, `tooltip`, `mergeRow`, `mergeColumn`, `captionMenu`.

## 3. 편집과 변경 추적

- 셀을 더블클릭하거나 Enter로 편집합니다. Enter로 저장(멀티텍스트 제외)하고 Esc로 취소하며, 편집기 밖을 누르면 저장합니다.
- 툴바 버튼: `toolBar: { left: ["add", "addTop", "insert", "delete", "undelete", "undo", "redo", "excelImport", "excelExport", "captionFilter", "rowFilter"] }`
- 행 추가·삭제 API: `insertRow(index, values)`, `deleteRow(index)`(삭제 표시, 한 번 더 호출하면 취소)
- **변경 추적:** 행마다 추가(I)·수정(U)·삭제(D) 상태와 바뀐 필드를 기록합니다. 편집기 입력, `check`·`radio` 셀 클릭, Ctrl+V 붙여넣기가 모두 추적됩니다(`row-check` 행 선택은 제외).
  - `getChanges({ includeDeleted: true })` → `{ inserted, updated: [{ row, dirtyFields }], deleted }`
  - `getChanges({ includeOriginal: true })`는 수정 행에 변경 전 값 `original: { 필드: 값 }`을 더합니다. 서버의 동시성 검사나 감사 기록에 씁니다.
  - 값을 원래대로 되돌리면 그 필드의 수정 표시가 풀리고, 남은 변경이 없으면 행도 수정 상태에서 빠집니다.
  - `acceptChanges()`로 확정하고(삭제 표시 행은 목록에서 제거) `rejectChanges()`로 원래대로 되돌립니다.
  - `saveChanges(url, options)`는 변경분을 POST하고 서버가 `{ ok: true }`를 돌려주면 확정합니다. `options`: `headers`(인증·위조 방지 토큰), `credentials`, `method`, `signal`, `includeOriginal`, `transport(changes, { url })`(직접 만든 HTTP 클라이언트 사용).
- **일괄 편집:** `editRows([{ key, values }])`는 사용자가 입력한 것과 같이 변경 추적되는 편집입니다(`rowKey` 필요). 선택한 행에 같은 값을 넣을 때 씁니다.
  ```js
  grid.editRows(grid.getSelectedKeys().map(key => ({ key, values: { apptDate: "2026-11-01" } })));
  ```
  편집 가능한 표시 열만 바꿀 수 있고, 하나라도 잘못되면(없는 키, 읽기 전용 열, 삭제 표시 행) 아무것도 바꾸지 않고 예외를 던집니다. 편집이 꺼진 그리드는 `{ applied: false, reason: "readonly" }`를 돌려줍니다.
- **실행 취소·다시 실행:** `features.undoRedo`, `undo()`, `redo()`, Ctrl+Z / Ctrl+Y, `history: { max }`
- 권장 저장 흐름: `validateAll()` → `getChanges()`를 서버로 전송 → 성공하면 `acceptChanges()` → 서버가 돌려준 행으로 다시 표시

## 4. 입력 검증

```js
{ key: "score", type: "number", validation: { required: true, min: 0, max: 100, messageRequired: "점수는 필수입니다." } }
```

- `validation` 규칙: `required`, `pattern`, `min`, `max`, `custom(value, row, column, grid)`. 편집할 때와 `validateAll()`에서 검사하고, 오류 셀을 표시합니다.
- `validateAll()`은 `[{ row, col, key, message }]`를 반환합니다. `moveFocusEx(row, key)`로 첫 오류로 이동할 수 있습니다.
- `validators: [{ rule, value, message }]`(`required`, `pattern`, `type`, `min`, `max`, `between`)는 셀 표시용 규칙이며 `findInvalid()`로 다음 오류 셀을 찾습니다.

## 5. 선택, 복사·붙여넣기

- 셀 범위 선택: 드래그, Shift+클릭, Ctrl+클릭으로 여러 범위 선택
- 행 선택: `features.selectionMode`에 `"cell"`, `"row"`, `"multi-row"`, `row-check` 열
- 복사·잘라내기·붙여넣기: Ctrl+C / Ctrl+X / Ctrl+V. **탭 구분 텍스트(TSV)**를 써서 Excel·Google Sheets와 주고받습니다(`features.copyPaste`).
- 오른쪽 클릭 메뉴(`features.contextMenu`): 복사, 위·아래에 행 추가, 행 삭제, 사용자 항목(`contextMenu: { items }`)
- `getSelection()`, `getFocus()`, `moveFocusEx(row, columnKey)`

## 6. 정렬과 필터

- 머리글 클릭 정렬, **Shift+클릭 다중 정렬**(`features.sorting`), API `toggleSort(key, multi)`
- 필터(`features.filtering`): `setFilters([{ key, op, value }])`, 결합 방식 `filterMode: "and" | "or"`
- 필터 연산자: `contains`, `notContains`, `equals`, `notEquals`, `startsWith`, `notStartsWith`, `endsWith`, `notEndsWith`, `includes`, `notIncludes`, `gt`, `gte`, `lt`, `lte`, `between`, `notBetween`, `empty`, `notEmpty`, `null`, `notNull`, 날짜용 `before`, `after`
- 필터 UI 두 가지: 툴바 필터 패널(`filterUiMode: "caption"`)과 머리글 아래 행 필터(`filterUiMode: "row"`, `features.rowFilter`)

## 7. 열 머리글 메뉴와 열 관리

- 열 머리글 메뉴(`features.captionMenu`): 정렬, 열 숨기기·보이기, 왼쪽·오른쪽 고정, 열 선택기. 열마다 `captionMenu: false`로 끌 수 있습니다.
- 열 너비 조절(`features.columnResize`), 화면 폭에 맞춤(`features.gridResize`)
- API: `setColumnHidden(key, hidden)`, `setColumnPin(key, "left" | "right" | "")`, `getColumnState()`, `applyColumnState(state)`

## 8. 레이아웃과 스타일

- 고정 열: `features.frozenColumns`, 열 `pin`
- 고정 머리글·바닥글: `features.stickyHeader`, `features.stickyFooter`
- 고정 행: `features.stickyRows`, `stickyRows: { top, bottom, topWhen, bottomWhen }`
- 다단 머리글: `headerGroups: [{ title, children: ["colKey", ...] }]`
- 셀 병합: 열 `mergeRow`(같은 값 세로 병합), `mergeColumn`(가로 병합)
- 조건부 스타일: `colCss(row, ...)`, `cellStyle`·`headerStyle`(객체·문자열·함수), `className`
- 툴팁: 열 `tooltip: { caption, cell }`(텍스트 템플릿 또는 DOM 노드를 반환하는 `renderer`)
- 테마: `theme: "enterprise" | "original" | "soft-blue"`, 툴바 테마 선택기(`themeSelector`), `setTheme()`

## 9. 그룹, 트리, 요약 행

- **그룹:** `features.grouping`. 열 머리글을 그룹 영역으로 끌어 놓거나 `groupBy(["dept"])`, `grouping: { fields }`로 묶습니다. 그룹별 펼치기·접기와 그룹 요약을 표시합니다.
- **트리:** `features.tree`, `tree: { idField, parentField, labelField }`. 펼치기·접기, `expandAll()`, `collapseAll()`.
  - 관리형 트리(`tree: { managed: true, loadChildren }`, `rowKey` 필요)는 자식 행을 필요할 때 불러옵니다(`setTreeExpanded`, `getExpandedKeys`).
- **요약 행:** `features.summary`, `summary: { rows: [...] }`로 바닥글에 `sum`, `avg`, `min`, `max`, `count`를 표시합니다.

## 10. 페이징과 서버 모드

- 페이징: `features.paging`, `paging: { pageSize }`, `setPage(n)`, `setPageSize(n)`
- 서버 모드(`dataSource.serverMode: true`)는 서버에 GET 쿼리를 보냅니다.
  - `offset`, `limit`
  - `sort=field:asc,field2:desc`
  - `filters=field:operator:value;...`
  - `filterMode=and|or`
- 무한 스크롤 방식 추가 로드: `features.lazyLoading`
- 쿼리 상태와 제어: `getQueryState()`, `cancelQuery()`, `reloadQuery()`, 이벤트 `queryChange`, `queryError`

## 11. 대량 데이터

- 가상 스크롤(`features.virtualScroll`, 기본 켜짐)로 보이는 행만 그립니다.
- 로컬 500,000행 예제: https://rubyon.azurewebsites.net/sample/react/index.html#large-data
- 렌더링 시간은 `render` 이벤트의 `durationMs`로 측정합니다.

## 12. 가져오기·내보내기 (CSV, Excel)

- CSV: `exportToCsv({ filename, delimiter, includeHeader, includeBom, quoteAll })`, `importFromCsv(file, { delimiter, hasHeader, mode })`
- Excel 내보내기·가져오기: `exportToExcel({ fileName, sheetName, ... })`, `importFromExcel(file, { mode, ... })`. SheetJS(`window.XLSX`)가 필요합니다.
- 셀 서식이 있는 내보내기 엔진(예: xlsx-js-style)은 `window.XLSXStyle`로 두면 내보내기에만 쓰고, 가져오기와 파싱은 항상 `window.XLSX`를 씁니다. 오래된 포크로 사용자 파일을 읽지 않도록 `window.XLSX`에는 최신 SheetJS를 두세요.
- 가져오기 `mode`: `"replace"`(기본, 가져온 행으로 목록을 바꾸고 모두 추가 상태), `"append"`(뒤에 추가), `"upsert"`(`rowKey` 필요. 키가 같은 행은 편집 가능한 열만 수정으로 기록하고, 새 키는 추가하며, 키가 없거나 삭제 표시된 행은 건너뜀). 결과 요약은 `dataChange` 이벤트의 `import: { mode, inserted, updated, unchanged, skipped }`로 받습니다.
- 안전한 Excel 읽기: `AiGrid.parseExcel(file, { columns, formulaPolicy, limits })`는 열 타입별로 값을 변환하고 행·셀 수 제한과 수식 정책(`reject`, `cached-value`)을 적용합니다.

## 13. 상태 저장과 키 기반 API

- 상태 저장: `features.stateManagement`, `saveState(name)`, `loadState(name)`, `clearState(name)`(브라우저 localStorage, `statePrefix`)
- 열 상태 JSON: `getColumnState()` / `applyColumnState(state)`(열 순서·너비·숨김·고정, 정렬, 필터)
- `rowKey`를 지정하면 쓸 수 있는 API
  - `replaceRows(rows)`, `updateRows([{ key, values }])`: 선택·스크롤을 유지한 채 데이터를 바꿉니다. 저장하지 않은 편집이 있으면 거부합니다.
  - `getSelectedKeys()`, `setSelectedKeys(keys)`
  - `requestRowMove(key, beforeKey)`: 행 이동 요청. `rowReorder`로 이동 전 확인할 수 있습니다.

## 14. 이벤트

`grid.on(eventName, handler)`는 구독 해제 함수를 반환합니다.

| 이벤트 | 발생 시점 |
|---|---|
| `dataChange` | 편집, 붙여넣기, 행 추가·삭제·이동, 가져오기, 데이터 교체 |
| `selectionChange` | 현재 셀·선택 범위 변경 |
| `queryChange`, `queryError` | 정렬·필터·페이지 변경과 서버 조회 오류 |
| `render` | 그리기 완료(`durationMs`, `rows`) |
| `themeChange` | 테마 변경 |
| `treeLoad`, `treeExpansionChange` | 트리 자식 로드와 펼침 상태 변경 |
| `rowMoveRequest` | 행 이동 요청 |

## 15. 키보드와 접근성

- 방향키와 Tab으로 이동하고 Enter로 편집·저장, Esc로 취소합니다. 한글 등 IME 조합 중의 Enter·Esc는 편집 명령으로 처리하지 않습니다.
- Ctrl+C/X/V 복사·잘라내기·붙여넣기, Ctrl+Z/Y 실행 취소·다시 실행
- 한 화면에 그리드가 여러 개 있어도 키 입력은 사용 중인 그리드에만 전달됩니다.
- `features.a11y`: 표에 `role="grid"`와 `aria-label`을 붙이고, 상태 메시지는 `aria-live`로 알립니다.

## 16. 보안

- 셀 값과 `format` 반환값은 항상 텍스트로 표시합니다. HTML 문자열은 해석하지 않으므로 사용자 입력이 스크립트로 실행되지 않습니다.
- 구조가 필요한 셀은 `cellTemplate`이 DOM 노드를 반환하게 하고, 값은 `textContent`로 넣습니다.
- 브라우저 그리드는 보안 경계가 아닙니다. 권한과 데이터 범위는 서버에서 검증하세요.

## 17. React

```tsx
import "aigrid/core.css";
import "aigrid/core";
import { AiGridReact } from "aigrid/react";

<AiGridReact columns={columns} rows={rows} rowKey="id" options={{ features: { editing: true, sorting: true } }}
  onDataChange={(event, grid) => console.log(grid.getChanges())} />
```

- `ref`로 그리드 인스턴스를 받아 위의 모든 메서드를 씁니다.
- `rows`는 복사해서 전달하므로 React 상태가 변경되지 않습니다. 값이 다른 새 `rows`는 그리드에 반영하고(`rowKey`가 있으면 `replaceRows`), 저장하지 않은 편집이 있으면 반영하지 않고 `onRowsSync`로 알립니다.
- `columns`·`options`는 값이 바뀔 때만 그리드를 다시 만듭니다. 렌더러 같은 함수 참조 변경으로는 다시 만들지 않습니다. 저장하지 않은 편집이 있으면 다시 만들지 않고 `onConfigSync`로 알린 뒤, `acceptChanges()`나 `rejectChanges()` 후에 적용합니다.
- StrictMode에서도 그리드가 하나만 생성되고, 컴포넌트가 사라질 때 자동으로 정리됩니다.
- 이벤트 prop: `onDataChange`, `onSelectionChange`, `onQueryChange`, `onQueryError`, `onRender`, `onThemeChange`, `onTreeLoad`, `onTreeExpansionChange`, `onRowMoveRequest`
- TypeScript 타입이 포함되어 있습니다(`AiGridColumn`, `AiGridInstance`, `AiGridOptions` 등).

## 18. 제한 사항

- Excel 기능은 SheetJS(`window.XLSX`)를 따로 불러와야 합니다.
- 붙여넣기는 텍스트를 그대로 저장합니다(`1,234`를 숫자로 바꾸지 않음). 서버에서 형식을 검증하세요.
- 저장하지 않은 편집이 있으면 필터 변경이 거부됩니다(`{ status: "rejected", reason: "dirty" }`). 저장하거나 취소한 뒤 필터를 바꾸세요. 필터가 걸린 상태에서 확정·취소해도 화면에 보이지 않는 행은 유지됩니다.
- 연동 콤보에 `options`를 지정하지 않으면 예제용 `grid.lists = { continentData, nationData }` 형식을 씁니다.
- 가져오기 `replace` 모드는 기존 행을 삭제로 기록하지 않습니다. 기존 데이터에 반영하려면 `upsert`를 쓰세요.
- 차트, 스프레드시트 수식, AI 페이지 빌더는 이 무료 배포판에 포함되지 않습니다.
