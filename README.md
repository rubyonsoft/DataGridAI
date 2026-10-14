# AiGrid

브라우저에서 동작하는 데이터 그리드입니다. 편집, 변경 추적, 검증, 정렬·필터·그룹, 대량 데이터 가상 스크롤, CSV/Excel 내보내기를 제공합니다.
프레임워크 없이 `<script>` 태그로 쓰거나, 포함된 React 컴포넌트로 쓸 수 있습니다.

- 버전: 0.2.1
- 라이선스: [AiGrid 무료 배포 라이선스](LICENSE.md). 상업적 이용을 포함해 무료로 쓸 수 있으며, AiGrid 자체를 유료로 판매하는 것은 금지됩니다.

> **English summary.** AiGrid is a browser data grid with editing, change tracking, validation, sorting, filtering, grouping, virtual scrolling, and CSV/Excel export. Use it with plain `<script>` tags or the bundled React component. Free for personal and commercial use under the [AiGrid Freeware License](LICENSE.md); selling AiGrid itself is not permitted. Live examples: https://rubyon.azurewebsites.net/software/aigrid

## 실행 예제 사이트

설치 없이 브라우저에서 바로 실행해 볼 수 있습니다.

| 페이지 | 주소 |
|---|---|
| AiGrid 소개 | https://rubyon.azurewebsites.net/software/aigrid |
| JavaScript 예제 모음(Sample Explorer) | https://rubyon.azurewebsites.net/sample/example.html |
| React 예제 | https://rubyon.azurewebsites.net/sample/react/index.html |
| Sample Code Kit | https://rubyon.azurewebsites.net/sample-kit/index.html |

사이트에는 이 배포판에 포함되지 않은 기능(차트, 스프레드시트, AI 페이지 빌더, 서버 연동)의 예제도 함께 있습니다.

## 주요 기능

| 분류 | 기능 |
|---|---|
| 데이터 연결 | 로컬 배열, JSON URL, 서버 모드(정렬·필터·페이지를 GET 쿼리로 전달), NDJSON, 사용자 정의 비동기 `transport` |
| 열 타입 (12종) | 행 번호, 행 선택 체크박스, 텍스트, 멀티텍스트, 숫자, 날짜, 체크, 라디오, 마스터·디테일 연동 콤보, 템플릿(DOM 렌더러), 버튼 |
| 편집 | 더블클릭·Enter 편집, 행 추가·삭제, 실행 취소·다시 실행(Ctrl+Z/Y), 툴바 버튼 |
| 변경 추적 | 행별 추가·수정·삭제 상태와 바뀐 필드, `getChanges()` / `acceptChanges()` / `rejectChanges()` |
| 입력 검증 | `required`, `pattern`, `min`, `max`, 사용자 정의 규칙, `validateAll()`, 오류 셀 표시 |
| 선택·클립보드 | 셀 범위·다중 범위 선택, 행 선택 모드, Excel과 호환되는 복사·잘라내기·붙여넣기(TSV), 오른쪽 클릭 메뉴 |
| 정렬·필터 | 머리글 정렬, Shift+클릭 다중 정렬, 20여 가지 필터 연산자, AND/OR, 툴바 필터와 행 필터 |
| 열 관리 | 열 머리글 메뉴(숨기기·보이기·고정), 열 너비 조절, 화면 폭 맞춤, 고정 열, 다단 머리글 |
| 레이아웃 | 고정 머리글·바닥글·행, 셀 병합, 조건부 스타일, 툴팁, 테마 3종 |
| 그룹·트리·요약 | 끌어 놓기 그룹, 그룹 요약, 트리 그리드와 자식 지연 로드, 합계·평균·최소·최대·개수 요약 행 |
| 대량 데이터 | 가상 스크롤, 클라이언트·서버 페이징, 50만 행 예제 |
| 가져오기·내보내기 | CSV 가져오기·내보내기, Excel 가져오기·내보내기(SheetJS), 행·셀 수 제한과 수식 정책을 둔 안전한 Excel 읽기 |
| 상태 | 상태 저장·복원(localStorage), 열·정렬·필터 상태 JSON, 키 기반 데이터 교체와 선택 |
| 키보드·접근성 | 방향키·Tab 이동, 한글 IME 입력 안전, 그리드별 키 입력 분리, `role="grid"`와 ARIA 속성 |
| 보안 | 셀 값을 항상 텍스트로 표시(HTML 주입 방지), DOM 노드 기반 사용자 렌더러 |
| React | `AiGridReact` 컴포넌트, TypeScript 타입, StrictMode 안전, `rows` 동기화, 이벤트 prop |

기능별 옵션·메서드 이름은 [docs/FEATURES.md](docs/FEATURES.md), 전체 API는 [docs/API.md](docs/API.md)에 있습니다.

## Features (English)

- **Data binding:** local arrays, JSON URLs, server-side mode (sort, filter and paging sent as GET query), NDJSON streams, custom async transport
- **12 column types:** row number, row checkbox, text, multiline text, number, date, checkbox, radio, cascading master/detail combo, template (DOM node renderer), button
- **Editing:** in-cell editing, insert/delete rows, undo/redo, toolbar actions, **change tracking** (inserted/updated/deleted with dirty fields), **validation** (required, pattern, min, max, custom)
- **Selection and clipboard:** cell ranges, multi-range, row selection, Excel-compatible copy/cut/paste (TSV), context menu
- **Sorting and filtering:** multi-column sort, 20+ filter operators, AND/OR, filter panel and filter row
- **Columns and layout:** column menu (hide/show/pin), resize, fit to width, frozen columns, header groups, sticky header/footer/rows, cell merge, conditional styling, tooltips, 3 themes
- **Grouping, tree, summary:** drag-and-drop grouping with group summaries, tree grid with lazy-loaded children, sum/avg/min/max/count summary rows
- **Performance:** virtual scrolling, client and server paging, 500,000-row example
- **Import/export:** CSV, Excel (SheetJS), safe Excel parsing with limits and formula policy
- **State:** save/restore grid state, column/sort/filter state as JSON, key-based row replace and selection APIs
- **Accessibility and security:** keyboard navigation, IME-safe editing, ARIA roles, text-only cell rendering (no HTML injection)
- **React:** `AiGridReact` component with TypeScript types, StrictMode-safe lifecycle, controlled `rows` sync and event props

See [docs/FEATURES.md](docs/FEATURES.md) and [docs/API.md](docs/API.md). An LLM-friendly summary is in [llms.txt](llms.txt).

## 구성

| 경로 | 내용 |
|---|---|
| `dist/aigrid-core.min.js`, `dist/aigrid-core.min.css` | 그리드 런타임(`window.AiGrid`) |
| `dist/react/` | React 컴포넌트 `AiGridReact`(ES 모듈)와 TypeScript 타입 |
| `examples/javascript/` | 프레임워크 없이 쓰는 예제 모음(Sample Explorer)과 빠른 시작 페이지 |
| `examples/react/` | React 예제(직원 관리, Column Types, Sort & Filter, Caption Menu, Grid Resize, Large Data Grid) |
| `docs/FEATURES.md`, `docs/API.md` | 기능 설명서와 API 레퍼런스 |
| `llms.txt` | AI 도구용 요약 |
| `THIRD-PARTY-NOTICES.md` | 포함된 오픈소스 구성 요소의 고지 |

## 예제 실행

예제는 정적 파일입니다. 저장소 폴더에서 정적 서버를 띄운 뒤 `index.html`을 엽니다.

```bash
python -m http.server 8080
# http://localhost:8080/
```

- `examples/javascript/quick-start.html`은 파일을 더블클릭해서 열어도 동작합니다.
- React 예제는 ES 모듈을 쓰므로 `file://`로 열면 동작하지 않습니다. 정적 서버나 GitHub Pages로 여세요.
- 직접 공개하려면 이 폴더를 정적 웹 서버나 GitHub Pages(저장소 루트)로 올리면 됩니다.

## 빠른 시작: JavaScript

```html
<link rel="stylesheet" href="dist/aigrid-core.min.css">
<div id="gridMount" style="height: 480px"></div>

<script src="dist/aigrid-core.min.js"></script>
<script>
  (async function () {
    const grid = await AiGrid.createGrid({
      mount: "#gridMount",
      title: "프로젝트 현황",
      rowKey: "id",
      dataSource: [
        { id: 1, team: "Platform", owner: "Kim", progress: 72, startDate: "2026-04-01" },
        { id: 2, team: "AI", owner: "Lee", progress: 48, startDate: "2026-04-03" }
      ],
      features: { editing: true, sorting: true, filtering: true, columnResize: true, undoRedo: true },
      columns: [
        { key: "rowno", title: "#", type: "rowno", width: 60, readOnly: true },
        { key: "id", title: "ID", type: "number", width: 80, readOnly: true },
        { key: "team", title: "팀", type: "text", width: 150, validation: { required: true } },
        { key: "owner", title: "담당자", type: "text", width: 120 },
        { key: "progress", title: "진행률", type: "number", width: 110, align: "right", validation: { min: 0, max: 100 } },
        { key: "startDate", title: "시작일", type: "date", width: 130 }
      ]
    });

    grid.on("dataChange", function (event) {
      console.log(event.type, grid.getChanges({ includeDeleted: true }));
    });
  })();
</script>
```

- `createGrid()`는 Promise를 반환합니다.
- `mount`에는 CSS 선택자나 DOM 요소를 넘깁니다. 마운트 영역에는 높이를 지정합니다.
- 화면에서 그리드를 없앨 때는 `grid.destroy()`를 호출합니다.

## 빠른 시작: React

GitHub 저장소를 의존성으로 설치합니다(React 18 이상).

```bash
npm install github:rubyonsoft/DataGridAI#v0.2.1
```

```tsx
import "aigrid/core.css";
import "aigrid/core"; // window.AiGrid 등록
import { useRef, useState } from "react";
import { AiGridReact, type AiGridColumn, type AiGridInstance } from "aigrid/react";

const columns: AiGridColumn[] = [
  { key: "id", title: "ID", type: "number", readOnly: true },
  { key: "name", title: "이름", type: "text", validation: { required: true } }
];

export function EmployeeGrid() {
  const gridRef = useRef<AiGridInstance>(null);
  const [rows, setRows] = useState([{ id: 1, name: "Kim" }, { id: 2, name: "Lee" }]);

  async function save() {
    const grid = gridRef.current;
    if (!grid || grid.validateAll().length) return;
    const saved = await saveToServer(grid.getChanges({ includeDeleted: true })); // 화면에서 구현하는 저장 API
    grid.acceptChanges();
    setRows(saved);
  }

  return (
    <>
      <button onClick={save}>저장</button>
      <AiGridReact ref={gridRef} columns={columns} rows={rows} rowKey="id"
        options={{ title: "직원", features: { editing: true, sorting: true } }} />
    </>
  );
}
```

- `rows`는 복사되어 그리드에 전달되므로 React 상태가 변경되지 않습니다.
- 값이 다른 새 `rows`를 넘기면 그리드에 반영됩니다. `rowKey`가 있으면 선택과 스크롤을 유지한 채 바꿉니다. 저장하지 않은 편집이 있으면 반영하지 않고 `onRowsSync`로 알립니다.
- `columns`, `options`의 값이 바뀌면 그리드를 다시 만듭니다. 함수(렌더러 등) 참조가 바뀌는 것만으로는 다시 만들지 않습니다.
- 컴포넌트가 사라지면 그리드를 자동으로 정리합니다(StrictMode 포함).
- 번들러 없이 런타임을 불러오려면 `loadAiGridRuntime({ scriptUrl, styleUrl })`를 사용합니다.

| Prop | 설명 |
|---|---|
| `columns` | 열 정의(필수) |
| `rows` | 로컬 행 |
| `dataSource` | URL 또는 서버 모드 소스(`rows`가 없을 때) |
| `rowKey` | 고유 키 필드 |
| `theme` | `enterprise`, `original`, `soft-blue` |
| `options` | 그 밖의 `createGrid()` 옵션 |
| `runtime` | `window.AiGrid` 대신 쓸 런타임 |
| `onReady`, `onError`, `onRowsSync` | 생성 완료, 오류, 행 반영 결과 |
| `onDataChange`, `onSelectionChange`, `onQueryChange`, `onThemeChange` 등 | 그리드 이벤트 |

## 주요 옵션

| 옵션 | 설명 |
|---|---|
| `mount` | CSS 선택자 또는 DOM 요소 |
| `columns` | 열 정의 배열 |
| `dataSource` | 행 배열, `{ url, rowsPath }`, 또는 서버 모드 `{ url, serverMode: true }` |
| `rowKey` | 고유 키 필드. `replaceRows`, `updateRows`, `getSelectedKeys` 등을 쓸 수 있습니다 |
| `title`, `toolbarText` | 툴바 제목과 보조 문구 |
| `theme`, `themeSelector` | 초기 테마와 툴바 테마 선택기 표시 |
| `features` | `editing`, `sorting`, `filtering`, `paging`, `grouping`, `tree`, `columnResize`, `stickyHeader`, `undoRedo`, `virtualScroll`, `frozenColumns`, `summary`, `contextMenu` 등 |
| `paging`, `grouping`, `tree` | 페이지 크기, 초기 그룹 필드, 트리 필드 |

열 속성: `key`, `title`, `type`, `width`, `align`, `readOnly`, `hidden`, `pin`, `format`, `cellTemplate`, `validation`, `headerStyle`, `cellStyle`, `className`.
열 타입: `rowno`, `text`, `multitext`, `number`, `date`, `check`, `radio`, `combo-master`, `combo-detail`, `template`, `button`.
검증 규칙(`validation`): `required`, `pattern`, `min`, `max`, `custom`.

## 주요 메서드와 이벤트

| 메서드 | 설명 |
|---|---|
| `getDataRows()` | 현재 행 |
| `insertRow(index, values)`, `deleteRow(index)` | 행 추가, 삭제 표시 |
| `getChanges({ includeDeleted: true })` | 추가·수정·삭제 변경분 |
| `acceptChanges()`, `rejectChanges()` | 변경 확정, 취소 |
| `validateAll()` | 검증 오류 목록 |
| `toggleSort()`, `setFilters()`, `setPage()`, `groupBy()` | 정렬, 필터, 페이지, 그룹 |
| `replaceRows(rows)`, `updateRows(patches)` | 키 기반 데이터 교체·갱신(`rowKey` 필요) |
| `exportToCsv(options)`, `exportToExcel(options)` | 내보내기. Excel은 SheetJS(`window.XLSX`)가 필요합니다 |
| `setTheme(name)`, `getTheme()` | 테마 |
| `on(eventName, handler)` | 이벤트 구독. 구독 해제 함수를 반환합니다 |
| `destroy()` | 정리. 여러 번 호출해도 안전합니다 |

이벤트: `dataChange`, `selectionChange`, `queryChange`, `queryError`, `render`, `themeChange`, `treeLoad`, `treeExpansionChange`, `rowMoveRequest`.

권장 저장 흐름: `validateAll()` → `getChanges()`를 서버로 전송 → 성공하면 `acceptChanges()` → 서버가 돌려준 행으로 다시 표시.

## 보안

- 셀 값과 `format` 반환값은 항상 텍스트로 표시됩니다. HTML 문자열은 해석되지 않습니다.
- 구조가 필요한 셀은 `cellTemplate`에서 DOM `Node`를 만들어 반환하고, 값은 `textContent`로 넣습니다.
- 브라우저 그리드는 보안 경계가 아닙니다. 권한과 데이터 범위는 서버에서 검증하세요.

## 요구 사항

- ES2017 이상을 지원하는 최신 브라우저
- React 컴포넌트: React 18 이상, ES 모듈을 처리하는 번들러(Vite, webpack 등)

## 라이선스

AiGrid는 [AiGrid 무료 배포 라이선스](LICENSE.md)로 배포됩니다. 요약하면 다음과 같습니다. 정확한 조건은 라이선스 전문을 따릅니다.

- 개인·사내·상업적 사용, 자신의 제품과 고객 납품 시스템에 포함하는 것, 수정은 무료로 허용됩니다.
- AiGrid 자체나 AiGrid가 주된 가치인 제품을 유료로 판매·대여·재라이선스하는 것은 금지됩니다.
- 저작권 표시와 라이선스, 제3자 고지는 유지해야 합니다.

포함된 오픈소스 구성 요소는 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)를 참고하세요.

문의: ksgi99@naver.com
