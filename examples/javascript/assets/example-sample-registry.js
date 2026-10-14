(function () {
    "use strict";

    function exampleRows() {
        var base = [
            { id: 101, team: "Platform", owner: "Kim", progress: 72, active: "T", startDate: "2026-04-01" },
            { id: 102, team: "AI", owner: "Lee", progress: 48, active: "T", startDate: "2026-04-03" },
            { id: 103, team: "QA", owner: "Park", progress: 91, active: "F", startDate: "2026-03-28" },
            { id: 104, team: "Ops", owner: "Choi", progress: 33, active: "T", startDate: "2026-04-10" },
            { id: 105, team: "Design", owner: "Yoon", progress: 67, active: "F", startDate: "2026-04-06" }
        ];
        var rows = [];
        for (var i = 0; i < 20; i++) {
            var seed = base[i % base.length];
            rows.push({
                id: 101 + i,
                team: seed.team,
                owner: seed.owner + " " + (Math.floor(i / base.length) + 1),
                progress: Math.max(10, Math.min(99, (seed.progress + (i * 7)) % 100)),
                active: seed.active,
                startDate: "2026-04-" + String((i % 28) + 1).padStart(2, "0")
            });
        }
        return rows;
    }

    function exampleColumns() {
        return [
            { key: "rowno", title: "#", type: "rowno", width: 60, readOnly: true },
            { key: "id", title: "ID", type: "number", width: 90, readOnly: true },
            { key: "team", title: "Team", type: "text", width: 140 },
            { key: "owner", title: "Owner", type: "text", width: 120 },
            { key: "progress", title: "Progress(%)", type: "number", width: 130, align: "right" },
            { key: "active", title: "Active", type: "check", width: 100 },
            { key: "startDate", title: "Start Date", type: "date", width: 150 }
        ];
    }

    function createHostConfig() {
        var rows = exampleRows();
        var cols = exampleColumns();
        return {
            defaultSampleId: "example-local-starter",
            appendSamples: [
                {
                    id: "example-local-starter",
                    group: "Example",
                    name: "Example Local Starter",
                    title: "Example Local Starter",
                    subtitle: "New sample onboarding template (local data)",
                    notes: [
                        "Use this as the starter template for adding new samples.",
                        "Runs immediately with local array data (no API required).",
                        "Clone this object, then update id/group/name/build.",
                        "id = URL hash, group/name = left menu label, build() = real grid options."
                    ],
                    code: [
                        "const newSample = {",
                        "  id: 'example-my-sample',",
                        "  group: 'Example',",
                        "  name: 'My Sample',",
                        "  build: function () { return { mount: '#gridMount', dataSource: rows, columns: columns }; }",
                        "};"
                    ],
                    defaultJs: [
                        "const rows = " + JSON.stringify(rows, null, 2) + ";",
                        "const columns = " + JSON.stringify(cols, null, 2) + ";",
                        "",
                        "return AiGrid.createGrid({",
                        "  mount: '#gridMount',",
                        "  title: 'Example - Local Starter',",
                        "  toolbarText: 'Custom sample registry demo',",
                        "  dataSource: rows,",
                        "  features: {",
                        "    selection: true,",
                        "    editing: true,",
                        "    sorting: true,",
                        "    filtering: true,",
                        "    stickyHeader: true,",
                        "    columnResize: true",
                        "  },",
                        "  columns: columns",
                        "});"
                    ],
                    build: function () {
                        return {
                            mount: "#gridMount",
                            title: "Example - Local Starter",
                            toolbarText: "Custom sample registry demo",
                            dataSource: exampleRows(),
                            features: {
                                selection: true,
                                editing: true,
                                sorting: true,
                                filtering: true,
                                stickyHeader: true,
                                columnResize: true
                            },
                            columns: exampleColumns()
                        };
                    }
                },
                {
                    id: "example-server-transform",
                    group: "Example",
                    name: "Example Server Transform",
                    title: "Example Server Transform",
                    subtitle: "Fetch demo API and transform rows before bind",
                    notes: [
                        "Fetch from /api/v1/demo/column-types and reshape fields before binding.",
                        "Shows async loading + transform + bind workflow.",
                        "Useful when validating API contract changes."
                    ],
                    code: [
                        "const payload = await fetch('/api/v1/demo/column-types').then(r => r.json());",
                        "const rows = payload.calcData1.map(...);",
                        "return AiGrid.createGrid({ dataSource: rows, columns: [...] });"
                    ],
                    defaultJs: [
                        "async function loadRows() {",
                        "  const res = await fetch('/api/v1/demo/column-types');",
                        "  if (!res.ok) throw new Error('Failed to load demo data');",
                        "  const payload = await res.json();",
                        "  const source = Array.isArray(payload.calcData1) ? payload.calcData1 : [];",
                        "  return source.slice(0, 40).map((row, index) => ({",
                        "    id: index + 1,",
                        "    text: row.text || '',",
                        "    number: Number(row.number || 0),",
                        "    nation: row.nation || '',",
                        "    date: row.date || ''",
                        "  }));",
                        "}",
                        "",
                        "const rows = await loadRows();",
                        "",
                        "return AiGrid.createGrid({",
                        "  mount: '#gridMount',",
                        "  title: 'Example - Server Transform',",
                        "  toolbarText: 'Fetch and reshape API rows',",
                        "  dataSource: rows,",
                        "  features: { selection: true, sorting: true, filtering: true, stickyHeader: true, columnResize: true },",
                        "  columns: [",
                        "    { key: 'rowno', title: '#', type: 'rowno', width: 60, readOnly: true },",
                        "    { key: 'id', title: 'ID', type: 'number', width: 80, readOnly: true },",
                        "    { key: 'text', title: 'Text', type: 'text', width: 140 },",
                        "    { key: 'number', title: 'Number', type: 'number', width: 120, align: 'right' },",
                        "    { key: 'nation', title: 'Nation', type: 'text', width: 140 },",
                        "    { key: 'date', title: 'Date', type: 'date', width: 140 }",
                        "  ]",
                        "});"
                    ],
                    build: function () {
                        return {
                            mount: "#gridMount",
                            title: "Example - Server Transform",
                            toolbarText: "Fetch and reshape API rows",
                            dataSource: exampleRows(),
                            features: {
                                selection: true,
                                sorting: true,
                                filtering: true,
                                stickyHeader: true,
                                columnResize: true
                            },
                            columns: [
                                { key: "rowno", title: "#", type: "rowno", width: 60, readOnly: true },
                                { key: "id", title: "ID", type: "number", width: 80, readOnly: true },
                                { key: "team", title: "Team", type: "text", width: 140 },
                                { key: "owner", title: "Owner", type: "text", width: 120 },
                                { key: "progress", title: "Progress(%)", type: "number", width: 130, align: "right" },
                                { key: "startDate", title: "Start Date", type: "date", width: 150 }
                            ]
                        };
                    }
                },
                {
                    id: "example-quick-clone",
                    group: "Example",
                    name: "Example Quick Clone",
                    title: "Example Quick Clone",
                    subtitle: "Minimal clone pattern for adding a new sample",
                    notes: [
                        "This is a ready-to-copy clone pattern.",
                        "Change id/group/name/build and refresh page.",
                        "id = hash route, group/name = menu text, build() = rendered grid config.",
                        "You will immediately get a new menu sample."
                    ],
                    code: [
                        "/* 1) Copy this object */",
                        "/* 2) Update id/group/name/build */",
                        "/* 3) Refresh and run */"
                    ],
                    defaultJs: [
                        "const rows = Array.from({ length: 20 }, (_, index) => ({",
                        "  id: 201 + index,",
                        "  topic: ['Clone', 'Patch', 'Verify'][index % 3] + ' ' + (index + 1),",
                        "  owner: ['Kim', 'Lee', 'Park', 'Choi'][index % 4],",
                        "  score: 70 + ((index * 7) % 25),",
                        "  active: index % 2 === 0 ? 'T' : 'F'",
                        "}));",
                        "",
                        "return AiGrid.createGrid({",
                        "  mount: '#gridMount',",
                        "  title: 'Example - Quick Clone',",
                        "  toolbarText: 'Clone object and rename',",
                        "  dataSource: rows,",
                        "  features: { selection: true, editing: true, sorting: true, filtering: true, stickyHeader: true, columnResize: true },",
                        "  columns: [",
                        "    { key: 'rowno', title: '#', type: 'rowno', width: 60, readOnly: true },",
                        "    { key: 'id', title: 'ID', type: 'number', width: 80, readOnly: true },",
                        "    { key: 'topic', title: 'Topic', type: 'text', width: 160 },",
                        "    { key: 'owner', title: 'Owner', type: 'text', width: 120 },",
                        "    { key: 'score', title: 'Score', type: 'number', width: 120, align: 'right' },",
                        "    { key: 'active', title: 'Active', type: 'check', width: 100 }",
                        "  ]",
                        "});"
                    ],
                    build: function () {
                        return {
                            mount: "#gridMount",
                            title: "Example - Quick Clone",
                            toolbarText: "Clone object and rename",
                            dataSource: Array.from({ length: 20 }, function (_, index) {
                                return {
                                    id: 201 + index,
                                    topic: ["Clone", "Patch", "Verify"][index % 3] + " " + (index + 1),
                                    owner: ["Kim", "Lee", "Park", "Choi"][index % 4],
                                    score: 70 + ((index * 7) % 25),
                                    active: index % 2 === 0 ? "T" : "F"
                                };
                            }),
                            features: {
                                selection: true,
                                editing: true,
                                sorting: true,
                                filtering: true,
                                stickyHeader: true,
                                columnResize: true
                            },
                            columns: [
                                { key: "rowno", title: "#", type: "rowno", width: 60, readOnly: true },
                                { key: "id", title: "ID", type: "number", width: 80, readOnly: true },
                                { key: "topic", title: "Topic", type: "text", width: 160 },
                                { key: "owner", title: "Owner", type: "text", width: 120 },
                                { key: "score", title: "Score", type: "number", width: 120, align: "right" },
                                { key: "active", title: "Active", type: "check", width: 100 }
                            ]
                        };
                    }
                },
                {
                    id: "example-chart-line-grid",
                    group: "차트",
                    name: "Line + Grid",
                    title: "Apache ECharts Line + Grid",
                    subtitle: "Monthly line chart linked with an AiGrid source table",
                    notes: [
                        "Based on the official Apache ECharts line chart example direction.",
                        "Grid selection emphasizes the matching line point.",
                        "Chart click filters the grid back by month."
                    ],
                    code: [
                        "return null;",
                        "// This explorer entry embeds the standalone line chart + grid sample in an iframe.",
                        "// Open /sample/echarts-grid-line.html?v=20260421r3 directly for isolated testing."
                    ],
                    defaultHtml: [
                        "<div style=\"display:grid;grid-template-rows:auto 1fr;gap:10px;height:100%;min-height:520px;\">",
                        "  <div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border:1px solid #d7deea;border-radius:12px;background:#f8fbff;\">",
                        "    <div>",
                        "      <div style=\"font-weight:700;color:#17324d;\">Apache ECharts Line + Grid</div>",
                        "      <div style=\"font-size:12px;color:#60758f;margin-top:4px;\">Line chart sample with month filtering between chart and grid</div>",
                        "    </div>",
                        "    <a href=\"/sample/echarts-grid-line.html?v=20260421r3\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;\">Open Full Page</a>",
                        "  </div>",
                        "  <iframe src=\"/sample/echarts-grid-line.html?v=20260421r3\" title=\"Apache ECharts Line + Grid\" style=\"width:100%;height:100%;min-height:440px;border:1px solid #d7deea;border-radius:12px;background:#fff;\"></iframe>",
                        "</div>"
                    ].join("\n"),
                    defaultJs: [
                        "return null;"
                    ]
                },
                {
                    id: "example-chart-bar-grid",
                    group: "차트",
                    name: "Bar + Grid",
                    title: "Apache ECharts Bar + Grid",
                    subtitle: "Department bar chart linked with an AiGrid source table",
                    notes: [
                        "Based on the official Apache ECharts bar chart example direction.",
                        "Grid selection emphasizes the matching category.",
                        "Chart click filters the grid back by team."
                    ],
                    code: [
                        "return null;",
                        "// This explorer entry embeds the standalone bar chart + grid sample in an iframe.",
                        "// Open /sample/echarts-grid-bar.html?v=20260421r3 directly for isolated testing."
                    ],
                    defaultHtml: [
                        "<div style=\"display:grid;grid-template-rows:auto 1fr;gap:10px;height:100%;min-height:520px;\">",
                        "  <div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border:1px solid #d7deea;border-radius:12px;background:#f8fbff;\">",
                        "    <div>",
                        "      <div style=\"font-weight:700;color:#17324d;\">Apache ECharts Bar + Grid</div>",
                        "      <div style=\"font-size:12px;color:#60758f;margin-top:4px;\">Bar chart sample with team filtering between chart and grid</div>",
                        "    </div>",
                        "    <a href=\"/sample/echarts-grid-bar.html?v=20260421r3\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:10px;background:#0f766e;color:#fff;text-decoration:none;font-weight:600;\">Open Full Page</a>",
                        "  </div>",
                        "  <iframe src=\"/sample/echarts-grid-bar.html?v=20260421r3\" title=\"Apache ECharts Bar + Grid\" style=\"width:100%;height:100%;min-height:440px;border:1px solid #d7deea;border-radius:12px;background:#fff;\"></iframe>",
                        "</div>"
                    ].join("\n"),
                    defaultJs: [
                        "return null;"
                    ]
                },
                {
                    id: "example-chart-radar-grid",
                    group: "차트",
                    name: "Radar + Grid",
                    title: "Apache ECharts Radar + Grid",
                    subtitle: "Radar profile chart linked with an AiGrid source table",
                    notes: [
                        "Based on the official Apache ECharts radar chart example direction.",
                        "Grid selection updates the radar profile immediately.",
                        "Chart compares the selected row with the visible-row average."
                    ],
                    code: [
                        "return null;",
                        "// This explorer entry embeds the standalone radar chart + grid sample in an iframe.",
                        "// Open /sample/echarts-grid-radar.html?v=20260421r3 directly for isolated testing."
                    ],
                    defaultHtml: [
                        "<div style=\"display:grid;grid-template-rows:auto 1fr;gap:10px;height:100%;min-height:520px;\">",
                        "  <div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border:1px solid #d7deea;border-radius:12px;background:#f8fbff;\">",
                        "    <div>",
                        "      <div style=\"font-weight:700;color:#17324d;\">Apache ECharts Radar + Grid</div>",
                        "      <div style=\"font-size:12px;color:#60758f;margin-top:4px;\">Radar sample driven by the selected grid row and visible-row average</div>",
                        "    </div>",
                        "    <a href=\"/sample/echarts-grid-radar.html?v=20260421r3\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:10px;background:#7c3aed;color:#fff;text-decoration:none;font-weight:600;\">Open Full Page</a>",
                        "  </div>",
                        "  <iframe src=\"/sample/echarts-grid-radar.html?v=20260421r3\" title=\"Apache ECharts Radar + Grid\" style=\"width:100%;height:100%;min-height:440px;border:1px solid #d7deea;border-radius:12px;background:#fff;\"></iframe>",
                        "</div>"
                    ].join("\n"),
                    defaultJs: [
                        "return null;"
                    ]
                },
                {
                    id: "example-chart-candlestick-grid",
                    group: "차트",
                    name: "Candlestick + Grid",
                    title: "Apache ECharts Candlestick + Grid",
                    subtitle: "Daily OHLC candlestick chart linked with an AiGrid source table",
                    notes: [
                        "Based on the official Apache ECharts candlestick chart direction.",
                        "Grid selection emphasizes the matching candle.",
                        "Chart click filters the grid back by trading date."
                    ],
                    code: [
                        "return null;",
                        "// This explorer entry embeds the standalone candlestick chart + grid sample in an iframe.",
                        "// Open /sample/echarts-grid-candlestick.html?v=20260421r2 directly for isolated testing."
                    ],
                    defaultHtml: [
                        "<div style=\"display:grid;grid-template-rows:auto 1fr;gap:10px;height:100%;min-height:520px;\">",
                        "  <div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border:1px solid #d7deea;border-radius:12px;background:#f8fbff;\">",
                        "    <div>",
                        "      <div style=\"font-weight:700;color:#17324d;\">Apache ECharts Candlestick + Grid</div>",
                        "      <div style=\"font-size:12px;color:#60758f;margin-top:4px;\">OHLC candlestick sample with date filtering between chart and grid</div>",
                        "    </div>",
                        "    <a href=\"/sample/echarts-grid-candlestick.html?v=20260421r2\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:10px;background:#b45309;color:#fff;text-decoration:none;font-weight:600;\">Open Full Page</a>",
                        "  </div>",
                        "  <iframe src=\"/sample/echarts-grid-candlestick.html?v=20260421r2\" title=\"Apache ECharts Candlestick + Grid\" style=\"width:100%;height:100%;min-height:440px;border:1px solid #d7deea;border-radius:12px;background:#fff;\"></iframe>",
                        "</div>"
                    ].join("\n"),
                    defaultJs: [
                        "return null;"
                    ]
                },
                {
                    id: "example-chart-intraday-breaks-grid",
                    group: "차트",
                    name: "Intraday Breaks + Grid",
                    title: "Apache ECharts Intraday Breaks + Grid",
                    subtitle: "Intraday chart with a market break linked with an AiGrid source table",
                    notes: [
                        "Based on the official Apache ECharts intraday-breaks example direction.",
                        "Morning and afternoon sessions are shown while the break itself is skipped from the axis sequence.",
                        "Chart click filters the grid back by trading time."
                    ],
                    code: [
                        "return null;",
                        "// This explorer entry embeds the standalone intraday-breaks chart + grid sample in an iframe.",
                        "// Open /sample/echarts-grid-intraday-breaks.html?v=20260510r2 directly for isolated testing."
                    ],
                    defaultHtml: [
                        "<div style=\"display:grid;grid-template-rows:auto 1fr;gap:10px;height:100%;min-height:380px;\">",
                        "  <div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border:1px solid #d7deea;border-radius:12px;background:#f8fbff;\">",
                        "    <div>",
                        "      <div style=\"font-weight:700;color:#17324d;\">Apache ECharts Intraday Breaks + Grid</div>",
                        "      <div style=\"font-size:12px;color:#60758f;margin-top:4px;\">Intraday line and volume sample with a visible afternoon reopen point</div>",
                        "    </div>",
                        "    <a href=\"/sample/echarts-grid-intraday-breaks.html?v=20260510r2\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;\">Open Full Page</a>",
                        "  </div>",
                        "  <iframe src=\"/sample/echarts-grid-intraday-breaks.html?v=20260510r2&embed=1\" title=\"Apache ECharts Intraday Breaks + Grid\" style=\"width:100%;height:100%;min-height:300px;border:1px solid #d7deea;border-radius:12px;background:#fff;\"></iframe>",
                        "</div>"
                    ].join("\n"),
                    defaultJs: [
                        "return null;"
                    ]
                },
                {
                    id: "example-jspreadsheet-create-from-table",
                    group: "Jspreadsheet",
                    name: "Create From Table",
                    title: "Jspreadsheet Create From Table",
                    subtitle: "Convert a normal HTML table into a spreadsheet surface",
                    notes: [
                        "Based on the official create-from-table example pattern.",
                        "Useful when converting existing markup into a spreadsheet editing surface.",
                        "Opens a dedicated standalone sample page in the result panel."
                    ],
                    code: [
                        "return null;",
                        "// This explorer entry embeds the standalone create-from-table sample in an iframe.",
                        "// Open /sample/jspreadsheet-create-from-table.html?v=20260423r2 directly for isolated testing."
                    ],
                    defaultHtml: [
                        "<div style=\"display:grid;grid-template-rows:auto 1fr;gap:10px;height:100%;min-height:520px;\">",
                        "  <div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border:1px solid #d7deea;border-radius:12px;background:#f8fbff;\">",
                        "    <div>",
                        "      <div style=\"font-weight:700;color:#17324d;\">Jspreadsheet Create From Table</div>",
                        "      <div style=\"font-size:12px;color:#60758f;margin-top:4px;\">Convert existing HTML table markup into a spreadsheet surface</div>",
                        "    </div>",
                        "    <a href=\"/sample/jspreadsheet-create-from-table.html?v=20260423r2\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:10px;background:#0f766e;color:#fff;text-decoration:none;font-weight:600;\">Open Full Page</a>",
                        "  </div>",
                        "  <iframe src=\"/sample/jspreadsheet-create-from-table.html?v=20260423r2\" title=\"Jspreadsheet Create From Table\" style=\"width:100%;height:100%;min-height:440px;border:1px solid #d7deea;border-radius:12px;background:#fff;\"></iframe>",
                        "</div>"
                    ].join("\n"),
                    defaultJs: [
                        "return null;"
                    ]
                },
                {
                    id: "example-jspreadsheet-toolbar",
                    group: "Jspreadsheet",
                    name: "Toolbar Controls",
                    title: "Jspreadsheet Toolbar Controls",
                    subtitle: "Enable, disable, and extend toolbar behavior in a focused sample",
                    notes: [
                        "Based on the official toolbar example direction.",
                        "Shows toolbar on/off controls plus a simple custom action pattern.",
                        "Useful when shaping spreadsheet mode into a more guided UX."
                    ],
                    code: [
                        "return null;",
                        "// This explorer entry embeds the standalone toolbar sample in an iframe.",
                        "// Open /sample/jspreadsheet-toolbar.html?v=20260421r4 directly for isolated testing."
                    ],
                    defaultHtml: [
                        "<div style=\"display:grid;grid-template-rows:auto 1fr;gap:10px;height:100%;min-height:520px;\">",
                        "  <div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border:1px solid #d7deea;border-radius:12px;background:#f8fbff;\">",
                        "    <div>",
                        "      <div style=\"font-weight:700;color:#17324d;\">Jspreadsheet Toolbar Controls</div>",
                        "      <div style=\"font-size:12px;color:#60758f;margin-top:4px;\">Reference sample for toolbar toggling and lightweight custom actions</div>",
                        "    </div>",
                        "    <a href=\"/sample/jspreadsheet-toolbar.html?v=20260421r4\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;\">Open Full Page</a>",
                        "  </div>",
                        "  <iframe src=\"/sample/jspreadsheet-toolbar.html?v=20260421r4\" title=\"Jspreadsheet Toolbar Controls\" style=\"width:100%;height:100%;min-height:440px;border:1px solid #d7deea;border-radius:12px;background:#fff;\"></iframe>",
                        "</div>"
                    ].join("\n"),
                    defaultJs: [
                        "return null;"
                    ]
                },
                {
                    id: "example-jspreadsheet-formulas",
                    group: "Jspreadsheet",
                    name: "Formulas",
                    title: "Jspreadsheet Excel-Like Formulas",
                    subtitle: "Spreadsheet calculations with row totals and summary formulas",
                    notes: [
                        "Based on the official formulas documentation example.",
                        "Shows formula cells, summary rows, auto recalculation, and number masks together.",
                        "Opens a dedicated standalone sample page in the result panel."
                    ],
                    code: [
                        "return null;",
                        "// This explorer entry embeds the standalone formulas sample in an iframe.",
                        "// Open /sample/jspreadsheet-formulas.html?v=20260421r4 directly for isolated testing."
                    ],
                    defaultHtml: [
                        "<div style=\"display:grid;grid-template-rows:auto 1fr;gap:10px;height:100%;min-height:520px;\">",
                        "  <div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border:1px solid #d7deea;border-radius:12px;background:#f8fbff;\">",
                        "    <div>",
                        "      <div style=\"font-weight:700;color:#17324d;\">Jspreadsheet Excel-Like Formulas</div>",
                        "      <div style=\"font-size:12px;color:#60758f;margin-top:4px;\">Row totals, summary formulas, and masked values in one spreadsheet sample</div>",
                        "    </div>",
                        "    <a href=\"/sample/jspreadsheet-formulas.html?v=20260421r4\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:10px;background:#0f766e;color:#fff;text-decoration:none;font-weight:600;\">Open Full Page</a>",
                        "  </div>",
                        "  <iframe src=\"/sample/jspreadsheet-formulas.html?v=20260421r4\" title=\"Jspreadsheet Formulas\" style=\"width:100%;height:100%;min-height:440px;border:1px solid #d7deea;border-radius:12px;background:#fff;\"></iframe>",
                        "</div>"
                    ].join("\n"),
                    defaultJs: [
                        "return null;"
                    ]
                },
                {
                    id: "example-jspreadsheet-richtext-editor",
                    group: "Jspreadsheet",
                    name: "Rich Text Editor",
                    title: "Jspreadsheet Rich Text / HTML Editor",
                    subtitle: "Edit formatted HTML content inside spreadsheet cells",
                    notes: [
                        "Based on the official rich text / HTML editor example direction.",
                        "Uses an HTML column type so spreadsheet users can edit formatted cell content inline.",
                        "Opens a dedicated standalone sample page in the result panel."
                    ],
                    code: [
                        "return null;",
                        "// This explorer entry embeds the standalone rich text / HTML editor sample in an iframe.",
                        "// Open /sample/jspreadsheet-richtext-editor.html?v=20260421r4 directly for isolated testing."
                    ],
                    defaultHtml: [
                        "<div style=\"display:grid;grid-template-rows:auto 1fr;gap:10px;height:100%;min-height:520px;\">",
                        "  <div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border:1px solid #d7deea;border-radius:12px;background:#f8fbff;\">",
                        "    <div>",
                        "      <div style=\"font-weight:700;color:#17324d;\">Jspreadsheet Rich Text / HTML Editor</div>",
                        "      <div style=\"font-size:12px;color:#60758f;margin-top:4px;\">Inline HTML cell editing sample for spreadsheet-style content authoring</div>",
                        "    </div>",
                        "    <a href=\"/sample/jspreadsheet-richtext-editor.html?v=20260421r4\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:10px;background:#8b5cf6;color:#fff;text-decoration:none;font-weight:600;\">Open Full Page</a>",
                        "  </div>",
                        "  <iframe src=\"/sample/jspreadsheet-richtext-editor.html?v=20260421r4\" title=\"Jspreadsheet Rich Text Editor\" style=\"width:100%;height:100%;min-height:440px;border:1px solid #d7deea;border-radius:12px;background:#fff;\"></iframe>",
                        "</div>"
                    ].join("\n"),
                    defaultJs: [
                        "return null;"
                    ]
                },
                {
                    id: "example-jspreadsheet-poc",
                    group: "Jspreadsheet",
                    name: "Jspreadsheet POC",
                    title: "Jspreadsheet CE POC",
                    subtitle: "Standalone spike for spreadsheet refinement beside AiGrid",
                    notes: [
                        "Opens the dedicated standalone POC page inside the result panel.",
                        "Shows the recommended bridge path: current grid Excel import first, spreadsheet refinement second.",
                        "Use the full page tab or open the standalone page directly for focused validation."
                    ],
                    code: [
                        "return null;",
                        "// This explorer entry embeds the standalone jspreadsheet POC page in an iframe.",
                        "// Open /sample/jspreadsheet-poc.html?v=20260421r4 directly when you want to validate the full flow."
                    ],
                    defaultHtml: [
                        "<div style=\"display:grid;grid-template-rows:auto 1fr;gap:10px;height:100%;min-height:520px;\">",
                        "  <div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border:1px solid #d7deea;border-radius:12px;background:#f8fbff;\">",
                        "    <div>",
                        "      <div style=\"font-weight:700;color:#17324d;\">Jspreadsheet CE standalone POC</div>",
                        "      <div style=\"font-size:12px;color:#60758f;margin-top:4px;\">AiGrid source surface + TabularDocument + spreadsheet refinement flow</div>",
                        "    </div>",
                        "    <a href=\"/sample/jspreadsheet-poc.html?v=20260421r4\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:10px;background:#0f766e;color:#fff;text-decoration:none;font-weight:600;\">Open Full Page</a>",
                        "  </div>",
                        "  <iframe src=\"/sample/jspreadsheet-poc.html?v=20260421r4\" title=\"Jspreadsheet POC\" style=\"width:100%;height:100%;min-height:440px;border:1px solid #d7deea;border-radius:12px;background:#fff;\"></iframe>",
                        "</div>"
                    ].join("\n"),
                    defaultJs: [
                        "return null;"
                    ]
                },
                {
                    id: "example-ai-page-builder",
                    group: "AI",
                    name: "AI Page Builder",
                    title: "AI Page Builder",
                    subtitle: "Generate and refine safe grid pages from natural language PageSpec drafts",
                    notes: [
                        "Embeds the dedicated AI Page Builder sample page.",
                        "Use Generate Page Draft for the first PageSpec, then Refine Current Draft for follow-up instructions.",
                        "The preview renders only allowlisted PageSpec parts: search form, grid columns, chart, actions, warnings, and JSON.",
                        "Saved templates can be loaded back without asking the LLM again."
                    ],
                    code: [
                        "return null;",
                        "// This explorer entry embeds the AI Page Builder sample page.",
                        "// Open /sample/ai-page-builder.html?v=20260510r1 directly for focused validation."
                    ],
                    defaultHtml: [
                        "<div style=\"display:grid;grid-template-rows:auto 1fr;gap:10px;height:100%;min-height:620px;\">",
                        "  <div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border:1px solid #d7deea;border-radius:12px;background:#f8fbff;\">",
                        "    <div>",
                        "      <div style=\"font-weight:700;color:#17324d;\">AI Page Builder</div>",
                        "      <div style=\"font-size:12px;color:#60758f;margin-top:4px;\">Natural language → validated PageSpec → safe preview → reusable template</div>",
                        "    </div>",
                        "    <a href=\"/sample/ai-page-builder.html?v=20260510r1\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:10px;background:#315f42;color:#fff;text-decoration:none;font-weight:600;\">Open Full Page</a>",
                        "  </div>",
                        "  <iframe src=\"/sample/ai-page-builder.html?v=20260510r1\" title=\"AI Page Builder\" style=\"width:100%;height:100%;min-height:540px;border:1px solid #d7deea;border-radius:12px;background:#fff;\"></iframe>",
                        "</div>"
                    ].join("\n"),
                    defaultJs: [
                        "return null;"
                    ]
                },
                {
                    id: "example-ai-page-runtime-sample",
                    group: "AI",
                    name: "AI Page Runtime - Sample Data",
                    title: "AI Page Runtime - Sample Data",
                    subtitle: "Render a PageSpec as a real page with bundled rows",
                    notes: [
                        "Embeds the PageSpec runtime page in sample-data mode.",
                        "Leave templateId empty to render the built-in employee operations demo spec.",
                        "When a template is saved in AI Page Builder, open it with data=sample to verify the generated page without a live API query.",
                        "The runtime renderer escapes text and renders only allowlisted PageSpec pieces."
                    ],
                    code: [
                        "return null;",
                        "// Open /sample/ai-page-runtime.html?v=20260510r1&data=sample directly for focused validation."
                    ],
                    defaultHtml: [
                        "<div style=\"display:grid;grid-template-rows:auto 1fr;gap:10px;height:100%;min-height:620px;\">",
                        "  <div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border:1px solid #d7deea;border-radius:12px;background:#f8fbff;\">",
                        "    <div>",
                        "      <div style=\"font-weight:700;color:#17324d;\">AI Page Runtime - Sample Data</div>",
                        "      <div style=\"font-size:12px;color:#60758f;margin-top:4px;\">Saved PageSpec template → real page URL → bundled sample rows</div>",
                        "    </div>",
                        "    <a href=\"/sample/ai-page-runtime.html?v=20260510r1&data=sample\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:10px;background:#315f42;color:#fff;text-decoration:none;font-weight:600;\">Open Full Page</a>",
                        "  </div>",
                        "  <iframe src=\"/sample/ai-page-runtime.html?v=20260510r1&data=sample\" title=\"AI Page Runtime Sample Data\" style=\"width:100%;height:100%;min-height:540px;border:1px solid #d7deea;border-radius:12px;background:#fff;\"></iframe>",
                        "</div>"
                    ].join("\n"),
                    defaultJs: [
                        "return null;"
                    ]
                },
                {
                    id: "example-ai-page-runtime-api",
                    group: "AI",
                    name: "AI Page Runtime - API Data",
                    title: "AI Page Runtime - API Data",
                    subtitle: "Render a PageSpec as a real page with Query API rows",
                    notes: [
                        "Embeds the PageSpec runtime page in API-data mode.",
                        "The runtime maps search form values into QuerySpec filters and calls /api/v1/query/execute.",
                        "Use this after saving a template in AI Page Builder to validate how the generated page behaves with server rows.",
                        "If the API is unavailable, switch the data mode dropdown back to Sample data."
                    ],
                    code: [
                        "return null;",
                        "// Open /sample/ai-page-runtime.html?v=20260510r1&data=api directly for focused validation."
                    ],
                    defaultHtml: [
                        "<div style=\"display:grid;grid-template-rows:auto 1fr;gap:10px;height:100%;min-height:620px;\">",
                        "  <div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border:1px solid #d7deea;border-radius:12px;background:#f8fbff;\">",
                        "    <div>",
                        "      <div style=\"font-weight:700;color:#17324d;\">AI Page Runtime - API Data</div>",
                        "      <div style=\"font-size:12px;color:#60758f;margin-top:4px;\">Saved PageSpec template → real page URL → /api/v1/query/execute rows</div>",
                        "    </div>",
                        "    <a href=\"/sample/ai-page-runtime.html?v=20260510r1&data=api\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:10px;background:#0f766e;color:#fff;text-decoration:none;font-weight:600;\">Open Full Page</a>",
                        "  </div>",
                        "  <iframe src=\"/sample/ai-page-runtime.html?v=20260510r1&data=api\" title=\"AI Page Runtime API Data\" style=\"width:100%;height:100%;min-height:540px;border:1px solid #d7deea;border-radius:12px;background:#fff;\"></iframe>",
                        "</div>"
                    ].join("\n"),
                    defaultJs: [
                        "return null;"
                    ]
                },
                {
                    id: "example-ai-production-binding",
                    group: "AI",
                    name: "AI Production Binding",
                    title: "AI Production Binding Draft",
                    subtitle: "Turn a handoff package into route, menu, data, and security binding JSON",
                    notes: [
                        "Embeds the developer-facing production binding draft screen.",
                        "Paste a JSON handoff package from AI Page Builder, or open this screen directly from the builder.",
                        "Developers use this output as a draft artifact before wiring the page into real app routing.",
                        "This sample prepares a binding JSON; it does not publish the page automatically."
                    ],
                    code: [
                        "return null;",
                        "// Open /sample/ai-production-binding.html?v=20260501r11 directly for focused validation."
                    ],
                    defaultHtml: [
                        "<div style=\"display:grid;grid-template-rows:auto 1fr;gap:10px;height:100%;min-height:620px;\">",
                        "  <div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border:1px solid #d7deea;border-radius:12px;background:#f8fbff;\">",
                        "    <div>",
                        "      <div style=\"font-weight:700;color:#17324d;\">AI Production Binding Draft</div>",
                        "      <div style=\"font-size:12px;color:#60758f;margin-top:4px;\">Handoff package → route/menu/data/security binding draft</div>",
                        "    </div>",
                        "    <a href=\"/sample/ai-production-binding.html?v=20260501r11\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:10px;background:#315f42;color:#fff;text-decoration:none;font-weight:600;\">Open Full Page</a>",
                        "  </div>",
                        "  <iframe src=\"/sample/ai-production-binding.html?v=20260501r11\" title=\"AI Production Binding Draft\" style=\"width:100%;height:100%;min-height:540px;border:1px solid #d7deea;border-radius:12px;background:#fff;\"></iframe>",
                        "</div>"
                    ].join("\n"),
                    defaultJs: [
                        "return null;"
                    ]
                },
                {
                    id: "example-ai-published-page",
                    group: "AI",
                    name: "AI Published Page Sample",
                    title: "AI Published Page Sample",
                    subtitle: "Render a production binding draft as an end-user sample page",
                    notes: [
                        "Embeds the final sample step for the AI page creation flow.",
                        "Shows how Production Binding + PageSpec + sample/API data can appear inside an app shell.",
                        "Open this page from AI Production Binding to pass the current binding draft automatically.",
                        "This is still a sample route; production publishing needs a server-side binding store and routing integration."
                    ],
                    code: [
                        "return null;",
                        "// Open /sample/ai-published-page.html?v=20260501r12 directly for focused validation."
                    ],
                    defaultHtml: [
                        "<div style=\"display:grid;grid-template-rows:auto 1fr;gap:10px;height:100%;min-height:620px;\">",
                        "  <div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border:1px solid #d7deea;border-radius:12px;background:#f8fbff;\">",
                        "    <div>",
                        "      <div style=\"font-weight:700;color:#17324d;\">AI Published Page Sample</div>",
                        "      <div style=\"font-size:12px;color:#60758f;margin-top:4px;\">Production Binding + PageSpec rendered in an app-like shell</div>",
                        "    </div>",
                        "    <a href=\"/sample/ai-published-page.html?v=20260501r12\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:10px;background:#315f42;color:#fff;text-decoration:none;font-weight:600;\">Open Full Page</a>",
                        "  </div>",
                        "  <iframe src=\"/sample/ai-published-page.html?v=20260501r12\" title=\"AI Published Page Sample\" style=\"width:100%;height:100%;min-height:540px;border:1px solid #d7deea;border-radius:12px;background:#fff;\"></iframe>",
                        "</div>"
                    ].join("\n"),
                    defaultJs: [
                        "return null;"
                    ]
                },
                {
                    id: "example-ai-provider-settings",
                    group: "AI",
                    name: "AI Provider Settings",
                    title: "AI Provider Settings",
                    subtitle: "Select LLM provider values and validate API key readiness without storing secrets",
                    notes: [
                        "Shows the runtime AI mode, provider, endpoint, model, and API key environment status.",
                        "API key input is temporary and is cleared after validation; it is not saved in the browser, templates, or provider settings file.",
                        "Non-secret provider settings can be saved to the server-side provider settings store.",
                        "Run Health Check performs a minimal provider call when ExternalApi is selected.",
                        "Template Migration can preview, execute, review history, export hash/signed audit reports, and verify the last export.",
                        "Use ExternalApi + OpenAICompatible to validate endpoint/model/key readiness before enabling real LLM drafts.",
                        "Production keys should be configured on the server through the documented environment variable."
                    ],
                    code: [
                        "return null;",
                        "// This explorer entry embeds the AI Provider Settings page.",
                        "// Open /sample/ai-provider-settings.html directly for focused validation."
                    ],
                    defaultHtml: [
                        "<div style=\"display:grid;grid-template-rows:auto 1fr;gap:10px;height:100%;min-height:620px;\">",
                        "  <div style=\"display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border:1px solid #d7deea;border-radius:12px;background:#f8fbff;\">",
                        "    <div>",
                        "      <div style=\"font-weight:700;color:#17324d;\">AI Provider Settings</div>",
                        "      <div style=\"font-size:12px;color:#60758f;margin-top:4px;\">LLM provider settings plus JSON-to-SQLite template import tools</div>",
                        "    </div>",
                        "    <a href=\"/sample/ai-provider-settings.html?v=20260501r9\" target=\"_blank\" rel=\"noopener\" style=\"display:inline-flex;align-items:center;justify-content:center;padding:9px 12px;border-radius:10px;background:#0f766e;color:#fff;text-decoration:none;font-weight:600;\">Open Full Page</a>",
                        "  </div>",
                        "  <iframe src=\"/sample/ai-provider-settings.html?v=20260501r9\" title=\"AI Provider Settings\" style=\"width:100%;height:100%;min-height:540px;border:1px solid #d7deea;border-radius:12px;background:#fff;\"></iframe>",
                        "</div>"
                    ].join("\n"),
                    defaultJs: [
                        "return null;"
                    ]
                }
            ]
        };
    }

    var base = window.AiGridSampleHostConfig || {};
    var mergedAppend = Array.isArray(base.appendSamples) ? base.appendSamples.slice() : [];
    var extra = createHostConfig();
    mergedAppend = mergedAppend.concat(extra.appendSamples);

    window.AiGridSampleHostConfig = Object.assign({}, base, extra, {
        defaultSampleId: base.defaultSampleId || extra.defaultSampleId,
        appendSamples: mergedAppend
    });
})();

