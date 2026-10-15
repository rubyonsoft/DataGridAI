# AiGrid API 레퍼런스

AiGrid 0.2.2. 기능별 설명은 [FEATURES.md](FEATURES.md), TypeScript 타입은 `dist/react/aigridTypes.d.ts`를 참고하세요.

## 전역 객체 `window.AiGrid`

| 이름 | 설명 |
|---|---|
| `AiGrid.createGrid(options)` | 그리드를 만듭니다. `Promise<grid>`를 반환합니다. |
| `AiGrid.version` | 런타임 버전 문자열 |
| `AiGrid.themes` | 사용 가능한 테마 목록 `[{ value, label }]` |
| `AiGrid.parseExcel(file, options)` | 그리드 없이 Excel 파일을 안전하게 읽습니다. |

## `createGrid(options)` 옵션

| 옵션 | 형식 | 설명 |
|---|---|---|
| `mount` | 문자열 \| Element | 마운트 대상 CSS 선택자 또는 DOM 요소(필수) |
| `columns` | 배열 | 열 정의(아래 "열 속성") |
| `dataSource` | 배열 \| 객체 | 행 배열, `{ url, rowsPath, fallbackUrl, continentPath, nationPath }`, 서버 모드 `{ url, serverMode: true, responseType, transport }` |
| `rowKey` | 문자열 | 고유 키 필드. 키 기반 API를 켭니다. |
| `title`, `toolbarText` | 문자열 | 툴바 제목과 보조 문구 |
| `theme` | `"enterprise"` \| `"original"` \| `"soft-blue"` | 초기 테마(기본 `enterprise`) |
| `themeSelector` | 불리언 | 툴바 테마 선택기 표시(기본 표시, `false`로 숨김) |
| `features` | 객체 | 기능 스위치(아래 표) |
| `toolBar` | 배열 \| `{ left, right }` | 툴바 버튼: `add`, `addTop`, `insert`, `append`, `delete`, `undelete`, `undo`, `redo`, `excelImport`, `excelExport`, `captionFilter`, `rowFilter`, `"|"` |
| `filterMode` | `"and"` \| `"or"` | 다중 필터 결합 |
| `filterUiMode` | `"caption"` \| `"row"` | 필터 UI(툴바 패널 / 행 필터) |
| `paging` | `{ pageSize }` | 페이지 크기(기본 100) |
| `grouping` | `{ fields }` | 초기 그룹 필드 |
| `tree` | `{ idField, parentField, labelField, managed, hasChildrenField, loadChildren }` | 트리 설정 |
| `rowReorder` | `{ managed, beforeMove }` | 행 이동 요청 처리 |
| `headerGroups` | `[{ title, children }]` | 다단 머리글 |
| `stickyRows` | `{ top, bottom, topWhen, bottomWhen }` | 위·아래 고정 행 |
| `summary` | `{ rows }` \| 배열 | 요약 행 |
| `contextMenu` | `{ items }` | 오른쪽 클릭 메뉴 사용자 항목 |
| `history` | `{ max }` | 실행 취소 이력 크기(기본 50) |
| `statePrefix` | 문자열 | 상태 저장 localStorage 키 접두사 |
| `lists` | `{ continentData, nationData }` | 연동 콤보 목록 |
| `excelExport`, `excelImport` | 객체 | Excel 기본 옵션 |
| `onAfterRender(grid)` | 함수 | 그리기 후 호출 |
| `onThemeChange(payload, grid)` | 함수 | 테마 변경 시 호출 |

## 기능 스위치 `features`

| 이름 | 기본값 | 설명 |
|---|---|---|
| `selection` | `true` | 셀·범위 선택 |
| `selectionMode` | `"cell"` | `"cell"`, `"row"`, `"multi-row"` |
| `editing` | `true` | 셀 편집 |
| `copyPaste` | `true` | 복사·잘라내기·붙여넣기(TSV) |
| `rowDrag` | `true` | 행 끌어 옮기기 |
| `sorting` | `false` | 머리글 정렬 |
| `filtering` | `false` | 필터 |
| `rowFilter` | `false` | 행 필터 UI |
| `captionMenu` | `false` | 열 머리글 메뉴 |
| `columnResize` | `false` | 열 너비 조절 |
| `gridResize` | `false` | 화면 폭에 맞춤 |
| `contextMenu` | `false` | 오른쪽 클릭 메뉴 |
| `paging` | `false` | 페이징 |
| `lazyLoading` | `false` | 서버 모드 추가 로드 |
| `stickyHeader` | `false` | 고정 머리글 |
| `stickyFooter` | `false` | 고정 바닥글 |
| `stickyRows` | `false` | 고정 행 |
| `frozenColumns` | `0` | 왼쪽 고정 열 수 |
| `virtualScroll` | `true` | 가상 스크롤 |
| `summary` | `false` | 요약 행 |
| `grouping` | `false` | 그룹 |
| `tree` | `false` | 트리 |
| `undoRedo` | `false` | 실행 취소·다시 실행 |
| `stateManagement` | `false` | 상태 저장 |
| `a11y` | `true` | 접근성 속성 |
| `perfMonitoring` | `true` | 렌더링 시간 측정 |

## 열 속성

| 속성 | 설명 |
|---|---|
| `key` | 행 객체의 필드 이름(필수) |
| `title` | 머리글 |
| `type` | `rowno`, `row-check`, `text`, `multitext`, `number`, `date`, `check`, `radio`, `combo-master`, `combo-detail`, `template`, `button` |
| `width` | 숫자(px) 또는 `"20%"` |
| `align`, `headerAlign`, `valign` | 정렬 |
| `readOnly`, `hidden` | 읽기 전용, 숨김 |
| `pin` | `"left"` \| `"right"` |
| `format(value, row, column, rowIndex, grid)` | 표시 문자열(항상 텍스트로 표시) |
| `cellTemplate(row, column, rowIndex, grid)` | DOM 노드를 반환하는 셀 렌더러 |
| `validation` | `{ required, pattern, min, max, custom, messageRequired, messagePattern, messageCustom }` |
| `validators` | `[{ rule: "required" \| "pattern" \| "type" \| "min" \| "max" \| "between", value, message }]` |
| `style`, `headerStyle`, `cellStyle` | 인라인 스타일(객체, 문자열, 함수) |
| `className`, `colCss` | 클래스(문자열 또는 함수) |
| `tooltip` | `{ caption, cell }` 각각 `{ template }` 또는 `{ renderer }` |
| `mergeRow`, `mergeColumn` | 셀 병합 |
| `trueValue`, `falseValue`, `trueLabel`, `falseLabel` | `check` 열의 저장 값(기본 `"T"`/`"F"`)과 표시 문구 |
| `options` | `radio`·`combo-master`·`combo-detail` 열 선택지 `[{ value, label }]` 또는 `[value]`. 하위 콤보는 `parent`(상위 값) 포함 |
| `parentKey` | `combo-detail` 열이 따르는 `combo-master` 열의 키 |
| `captionMenu` | `false`면 이 열의 머리글 메뉴를 숨김 |

## 인스턴스 메서드

**데이터와 변경**

| 메서드 | 설명 |
|---|---|
| `getDataRows()` | 현재 행 배열 |
| `getRowByDisplayIndex(index)` | 표시 순서의 행 |
| `insertRow(index?, values?)` | 행 추가, 추가된 위치 반환 |
| `deleteRow(index)` | 삭제 표시(다시 호출하면 취소) |
| `getChanges({ includeDeleted, includeOriginal })` | `{ inserted, updated: [{ row, dirtyFields, original? }], deleted }` |
| `acceptChanges()`, `rejectChanges()` | 변경 확정(삭제 표시 행 제거), 취소 |
| `saveChanges(url, { headers, credentials, method, signal, includeOriginal, transport })` | 변경분 POST, 응답이 `{ ok: true }`면 확정 |
| `validateAll()` | `[{ row, col, key, message }]` |
| `findInvalid(afterRow?, afterColKey?)` | 다음 `validators` 오류 셀 |
| `undo()`, `redo()` | 실행 취소, 다시 실행 |

**조회와 표시**

| 메서드 | 설명 |
|---|---|
| `toggleSort(key, multi)` | 정렬 전환 |
| `setFilters(filters)`, `setFilterMode(mode)` | 필터 |
| `setPage(n)`, `setPageSize(n)` | 페이지 |
| `groupBy(fields)`, `clearGrouping()` | 그룹 |
| `expandAll()`, `collapseAll()` | 트리 펼치기·접기 |
| `setColumnHidden(key, hidden)`, `setColumnPin(key, pin)` | 열 숨김, 고정 |
| `setTheme(name)`, `getTheme()` | 테마 |
| `render()`, `setStatus(text)` | 다시 그리기, 상태 표시줄 문구 |

**선택과 포커스**

| 메서드 | 설명 |
|---|---|
| `getSelection()` | `[{ rowIndex, column }]` |
| `getFocus()` | 현재 셀 `{ row, col }` |
| `moveFocusEx(row, column)` | 셀로 이동(열은 인덱스 또는 key) |

**가져오기·내보내기와 상태**

| 메서드 | 설명 |
|---|---|
| `exportToCsv(options)`, `importFromCsv(file, { delimiter, hasHeader, mode })` | CSV. `mode`: `replace`(기본), `append`, `upsert`(`rowKey` 필요) |
| `exportToExcel(options)`, `importFromExcel(fileOrOptions?, { mode, ... })`, `parseExcel(file, options)` | Excel(SheetJS 필요) |
| `saveState(name)`, `loadState(name)`, `clearState(name)` | 상태 저장 |
| `getColumnState()`, `applyColumnState(state)` | 열·정렬·필터 상태 JSON |

**키 기반 API (`rowKey` 필요)**

| 메서드 | 설명 |
|---|---|
| `replaceRows(rows)` | 데이터 교체. 결과 `{ applied, rowCount }` 또는 `{ applied: false, reason }` |
| `updateRows([{ key, values }])` | 서버 기준 일부 행 갱신(미저장 편집이 있으면 거부, 변경 추적 안 함) |
| `editRows([{ key, values }])` | 변경 추적되는 일괄 편집. 결과 `{ applied, rowCount }`, 잘못된 편집이 있으면 아무것도 바꾸지 않고 예외 |
| `getSelectedKeys()`, `setSelectedKeys(keys)` | 선택 행 키 |
| `requestRowMove(key, beforeKey)` | 행 이동 요청 |
| `getExpandedKeys()`, `setExpandedKeys(keys)`, `setTreeExpanded(key, expanded)`, `cancelTreeLoad(key?)`, `focusTreeRow(key)` | 관리형 트리 |

**서버 모드**

| 메서드 | 설명 |
|---|---|
| `getQueryState()` | `{ sort, filters, filterMode, pageIndex, pageSize }` |
| `cancelQuery()`, `reloadQuery()` | 조회 취소, 다시 조회 |

**정리**

| 메서드 | 설명 |
|---|---|
| `on(eventName, handler)` | 이벤트 구독, 해제 함수 반환 |
| `destroy()` | DOM과 이벤트 정리(여러 번 호출해도 안전) |

## 이벤트

| 이벤트 | 데이터 |
|---|---|
| `dataChange` | `{ type, rows }` (`type`: `edit-cell`, `check-toggle`, `radio-change`, `paste`, `edit-rows`, `add-row`, `add-row-top`, `insert-row`, `delete-row`, `row-drag`, `row-move`, `import-csv`, `import-excel`, `replace-rows`, `update-rows`). 가져오기는 `import: { mode, inserted, updated, unchanged, skipped }` 포함 |
| `selectionChange` | `{ activeCell, ranges, selectedKeys?, currentKey? }` |
| `queryChange` | `{ reason, query, generation }` |
| `queryError` | `{ generation, error }` |
| `render` | `{ durationMs, rows }` |
| `themeChange` | `{ theme, previousTheme }` |
| `treeLoad` | `{ status, key, generation, error? }` |
| `treeExpansionChange` | `{ expandedKeys }` |
| `rowMoveRequest` | `{ key, beforeKey, fromIndex, toIndex, requestId, cancel() }` |

## React `AiGridReact`

```tsx
import { AiGridReact, loadAiGridRuntime, type AiGridInstance } from "aigrid/react";
```

| Prop | 설명 |
|---|---|
| `columns` | 열 정의(필수). 값이 바뀌면 다시 생성 |
| `rows` | 로컬 행. 복사해서 전달하고 값이 바뀌면 반영 |
| `dataSource` | URL·서버 모드 소스(`rows`가 없을 때) |
| `rowKey` | 고유 키 필드. 새 `rows`를 `replaceRows`로 제자리 반영 |
| `theme` | 테마. 바뀌면 `setTheme()` |
| `options` | 그 밖의 `createGrid()` 옵션 |
| `runtime` | `window.AiGrid` 대신 쓸 런타임 |
| `className`, `style` | 바깥 컨테이너 |
| `ref` | `AiGridInstance` (생성 전·해제 후 `null`) |
| `onReady(grid)`, `onError(error)` | 생성 완료, 오류 |
| `onRowsSync(result, grid)` | 새 `rows` 반영 결과 |
| `onConfigSync(result, grid)` | `columns`·`options`·`rowKey` 변경 반영 결과. 미저장 편집이 있으면 `{ applied: false, reason: "dirty" }`로 보류하고, 확정·취소 후 적용 |
| `onDataChange` 외 이벤트 prop | `(event, grid)` 형식, 위 이벤트와 같음 |
| `renderError(error)` | 오류 표시 사용자 정의 |

`loadAiGridRuntime({ scriptUrl, styleUrl, nonce })`는 번들러 없이 런타임 파일을 불러옵니다.
