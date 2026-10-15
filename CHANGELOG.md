# 변경 기록

## 0.2.2

화면에서 바꾼 값이 저장 데이터(`getChanges()`)에서 빠지던 문제를 고치고, 업무 화면 저장에 필요한 기능을 더했습니다.

- `check`·`radio` 셀 클릭과 Ctrl+V 붙여넣기도 변경 추적과 검증을 거칩니다. 읽기 전용 열, 삭제 표시 행, `editing: false` 그리드에는 쓰지 않습니다.
- 값을 원래대로 되돌리면 그 필드의 수정 표시가 풀리고, 남은 변경이 없으면 행도 수정 상태에서 빠집니다.
- `getChanges({ includeOriginal: true })`는 수정 행마다 변경 전 값(`original`)을 함께 돌려줍니다.
- `getChanges({ includeDeleted: false })`가 삭제 표시 행도 제외합니다. `acceptChanges()`는 삭제 표시 행을 목록에서 제거합니다.
- `saveChanges(url, { headers, credentials, transport, ... })`로 인증·위조 방지 헤더를 보내거나 직접 만든 HTTP 클라이언트를 쓸 수 있습니다.
- `editRows([{ key, values }])`: 선택한 행에 값을 일괄 입력하는 등 변경 추적되는 편집 API(`rowKey` 필요, 전부 적용 또는 전부 거부).
- CSV·Excel 가져오기 `mode`: `replace`(기본), `append`, `upsert`(`rowKey`로 기존 행은 수정, 새 행은 추가).
- `check` 열 `trueValue`/`falseValue`/`trueLabel`/`falseLabel`, `radio` 열 `options`로 값과 표시 문구를 지정합니다.
- 연동 콤보 `options`·`parentKey`: 업무 코드(부서·팀 등)로 상위·하위 선택지를 지정합니다. 상위 값을 그대로 다시 선택하면 하위 값이 바뀌지 않습니다.
- 저장하지 않은 편집이 있으면 `rowKey`가 없어도 필터 변경을 거부합니다(이전에는 편집이 사라졌습니다). 필터가 걸린 상태에서 `acceptChanges()`해도 화면에 보이지 않는 행이 유지되고, `rejectChanges()` 후에도 필터·정렬된 화면이 유지됩니다.
- Excel 내보내기는 `window.XLSXStyle`(서식 엔진)이 있으면 그것을 쓰고, 가져오기·파싱은 항상 `window.XLSX`를 씁니다.
- React: 저장하지 않은 편집이 있으면 `columns`·`options` 변경에 따른 재생성을 보류하고 `onConfigSync`로 알립니다.
- 예제의 SheetJS를 0.20.3으로 올렸습니다.

## 0.2.1

첫 무료 배포판입니다.

- 그리드 런타임(`dist/aigrid-core.min.js`, `dist/aigrid-core.min.css`)
- React 컴포넌트 `AiGridReact`와 TypeScript 타입(`dist/react/`)
- `mount` 옵션에 CSS 선택자 외에 DOM 요소를 넘길 수 있습니다.
- 열 `validation` 규칙(`required`, `pattern`, `min`, `max`, `custom`)이 편집 시와 `validateAll()`에서 검사되도록 수정했습니다.
- 예제: JavaScript Sample Explorer, 빠른 시작 페이지, React 예제
