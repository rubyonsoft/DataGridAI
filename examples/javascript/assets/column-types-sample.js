(function () {
    "use strict";

    var nav = document.getElementById("sampleNav");
    var search = document.getElementById("sampleSearch");
    var title = document.getElementById("sampleTitle");
    var subtitle = document.getElementById("sampleSubtitle");
    var notes = document.getElementById("sampleNotes");
    var codeJs = document.getElementById("codeJs");
    var codeHtml = document.getElementById("codeHtml");
    var codePage = document.getElementById("codePage");
    var status = document.getElementById("resultStatus");
    var fullPageNotes = document.getElementById("sampleFullPageNotes");
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".code-tab"));
    var runBtn = document.getElementById("runSample");
    var resetBtn = document.getElementById("resetSample");
    var copyPageBtn = document.getElementById("copyPage");
    var expandAllBtn = document.getElementById("sampleExpandAll");
    var collapseAllBtn = document.getElementById("sampleCollapseAll");
    var mvpNav = document.getElementById("mvpNav");
    var workbench = document.querySelector(".workbench");
    var toggleCodePanelBtn = document.getElementById("toggleCodePanel");
    var mvpSampleIds = [
        "example-ai-page-builder",
        "example-react-aigrid",
        "caption-menu",
        "large-data",
        "example-chart-intraday-breaks-grid"
    ];

    var defaultHtmlCode = "<div id=\"gridMount\"></div>";
    var editorState = {};
    var currentGrid = null;
    var hostConfig = window.AiGridSampleHostConfig || {};
    var defaultSampleId = (typeof hostConfig.defaultSampleId === "string" && hostConfig.defaultSampleId.trim())
        ? hostConfig.defaultSampleId.trim()
        : "column-types";
    // Runtime paths written into the standalone page code; hosts outside the API server override them.
    var standaloneCoreCssUrl = (typeof hostConfig.coreCssUrl === "string" && hostConfig.coreCssUrl.trim())
        ? hostConfig.coreCssUrl.trim()
        : "/sample/assets/aigrid-core.css?v=20260419r31";
    var standaloneCoreJsUrl = (typeof hostConfig.coreJsUrl === "string" && hostConfig.coreJsUrl.trim())
        ? hostConfig.coreJsUrl.trim()
        : "/sample/assets/aigrid-core.js?v=20260422r33";

    function installSidebarSlideToggle() {
        var layout = document.querySelector(".api-layout");
        var sidebar = layout ? layout.querySelector(".sidebar") : null;
        if (!layout || !sidebar) {
            return;
        }

        if (!sidebar.id) {
            sidebar.id = "sampleSidebar";
        }

        var toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "sidebar-panel-toggle";
        toggle.setAttribute("aria-controls", sidebar.id);
        sidebar.appendChild(toggle);

        function setCollapsed(collapsed, persist) {
            layout.classList.toggle("sidebar-collapsed", collapsed);
            toggle.setAttribute("aria-expanded", String(!collapsed));
            toggle.setAttribute("aria-label", collapsed ? "Open sample navigation" : "Close sample navigation");
            toggle.title = collapsed ? "Open sample navigation" : "Close sample navigation";

            if (persist) {
                try {
                    window.localStorage.setItem("datagridai-sample-sidebar", collapsed ? "collapsed" : "expanded");
                } catch (error) {
                    // Local storage can be unavailable in private or embedded contexts.
                }
            }
        }

        var stored = "";
        try {
            stored = window.localStorage.getItem("datagridai-sample-sidebar") || "";
        } catch (error) {
            stored = "";
        }

        setCollapsed(stored === "collapsed", false);
        toggle.addEventListener("click", function () {
            setCollapsed(!layout.classList.contains("sidebar-collapsed"), true);
        });
    }

    function columnSource() {
        return {
            url: "/api/v1/demo/column-types",
            fallbackUrl: "/api/demo/column-types",
            rowsPath: "calcData1",
            continentPath: "continentData",
            nationPath: "nationData"
        };
    }

    function treeSource() {
        return {
            url: "/api/v1/demo/tree-data",
            fallbackUrl: "/api/demo/tree-data",
            rowsPath: "treeData"
        };
    }

    function createSampleElement(tagName, className, text) {
        var element = document.createElement(tagName);
        if (className) element.className = className;
        if (text !== undefined && text !== null) element.textContent = String(text);
        return element;
    }

    function renderFlagCell(row) {
        var wrapper = createSampleElement("div", "cell-flag-wrap");
        var rawUrl = row && row.flagUrl != null ? String(row.flagUrl) : "";
        try {
            var parsedUrl = new URL(rawUrl, document.baseURI);
            if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") throw new Error("unsupported protocol");
            var image = createSampleElement("img", "cell-flag");
            image.src = parsedUrl.href;
            image.alt = "flag";
            wrapper.appendChild(image);
        } catch (error) {
            wrapper.textContent = rawUrl;
        }
        return wrapper;
    }

    function renderCalendarCell(row, col) {
        var field = col.key || col.field;
        var cell = createSampleElement("div", "calendar-cell");
        cell.appendChild(createSampleElement("div", "date", row[field]));
        var schedulesElement = createSampleElement("div", "schedules");
        var schedules = Array.isArray(row[field + "-schedule"]) ? row[field + "-schedule"] : [];
        schedules.slice(0, 2).forEach(function (schedule) {
            var allowedType = schedule.type === "important" || schedule.type === "work" ? schedule.type : "";
            var scheduleElement = createSampleElement("div", "schedule" + (allowedType ? " " + allowedType : ""));
            scheduleElement.appendChild(createSampleElement("span", "time", schedule.time));
            scheduleElement.appendChild(createSampleElement("span", "event", schedule.title));
            schedulesElement.appendChild(scheduleElement);
        });
        if (schedules.length > 2) {
            var more = createSampleElement("div", "add-num");
            more.appendChild(createSampleElement("span", "", "+" + (schedules.length - 2)));
            schedulesElement.appendChild(more);
        }
        cell.appendChild(schedulesElement);
        return cell;
    }

    function baseColumns() {
        return [
            { key: "rowno", title: "#", type: "rowno", width: 60, readOnly: true },
            { key: "text", title: "텍스트", type: "text", width: 130, placeHolder: "값을 입력하세요" },
            {
                key: "number", title: "숫자", type: "number", width: 120, align: "right", format: function (v) {
                    return (parseFloat(v) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
                }
            },
            { key: "check", title: "체크박스", type: "check", width: 100 },
            { key: "radio", title: "라디오버튼", type: "radio", width: 230 },
            { key: "flagUrl", title: "template", type: "template", cellTemplate: renderFlagCell, width: 100 },
            {
                key: "date", title: "날짜", type: "date", width: 180, format: function (v) {
                    if (!v) return "";
                    var d = new Date(v);
                    return d.getFullYear() + "년 " + String(d.getMonth() + 1).padStart(2, '0') + "월 " + String(d.getDate()).padStart(2, '0') + "일";
                }
            },
            { key: "multitext", title: "멀티텍스트", type: "multitext", width: 450, align: "left" },
            { key: "button", title: "버튼", type: "button", width: 160 },
            { key: "continent", title: "콤보(마스터)", type: "combo-master", width: 150 },
            { key: "nation", title: "콤보(디테일)", type: "combo-detail", width: 150 }
        ];
    }

    function getRichSampleData() {
        return ensureMinSampleRows([
            { "text": "매화반", "number": "35852.437", "check": "T", "radio": "T", "multitext": "Never Say NO - 고객의 성공적인 프로젝트를 위해 소프트보울은 NO 보다는 YES를 지향 합니다.", "continent": "asia", "nation": "china", "date": "2023-01-01", "flagUrl": "https://flagcdn.com/w80/cn.png" },
            { "text": "", "number": "8957.746", "check": "T", "radio": "F", "multitext": "Never Say NO - 고객의 성공적인 프로젝트를 위해 소프트보울은 NO 보다는 YES를 지향 합니다.", "continent": "europe", "nation": "germany", "date": "2023-01-01", "flagUrl": "https://flagcdn.com/w80/de.png" },
            { "text": "", "number": "63548.374", "check": "F", "radio": "S", "multitext": "당장 눈 앞의 이익보다는 미래에 생길 가치를, 나무보다는 숲을 보는 안목으로 경영하겠습니다.", "continent": "asia", "nation": "japan", "date": "2023-01-02", "flagUrl": "https://flagcdn.com/w80/jp.png" },
            { "text": "난초반", "number": "14986.253", "check": "T", "radio": "F", "multitext": "고객만족을 통해 사회에 기여하는 기업이 되겠다는 초심을 지키며 순간적인 반짝임보다는 꾸준함을 중시하는 기업이 되겠습니다.", "continent": "oceania", "nation": "new_zealand", "date": "2023-01-03", "flagUrl": "https://flagcdn.com/w80/nz.png" },
            { "text": "난초반", "number": "2785.586", "check": "F", "radio": "T", "multitext": "배가 가는 방향을 정하는 것은 바람도, 물결도 아닌 방향타를 쥔 선장의 의지입니다.", "continent": "oceania", "nation": "australia", "date": "2023-01-04", "flagUrl": "https://flagcdn.com/w80/au.png" },
            { "text": "난초반", "number": "56937.197", "check": "F", "radio": "S", "multitext": "고객만족을 통해 사회에 기여하는 기업이 되겠다는 초심을 지키며 순간적인 반짝임보다는 꾸준함을 중시하는 기업이 되겠습니다.", "continent": "oceania", "nation": "new_zealand", "date": "2023-01-05", "flagUrl": "https://flagcdn.com/w80/nz.png" },
            { "text": "국화반", "number": "41236.374", "check": "T", "radio": "T", "multitext": "당장 눈 앞의 이익보다는 미래에 생길 가치를, 나무보다는 숲을 보는 안목으로 경영하겠습니다.", "continent": "europe", "nation": "france", "date": "2023-01-06", "flagUrl": "https://flagcdn.com/w80/fr.png" },
            { "text": "국화반", "number": "9074.256", "check": "T", "radio": "T", "multitext": "배가 가는 방향을 정하는 것은 바람도, 물결도 아닌 방향타를 쥔 선장의 의지입니다.", "continent": "europe", "nation": "italy", "date": "2023-01-07", "flagUrl": "https://flagcdn.com/w80/it.png" },
            { "text": "국화반", "number": "79456.493", "check": "T", "radio": "T", "multitext": "고객만족을 통해 사회에 기여하는 기업이 되겠다는 초심을 지키며 순간적인 반짝임보다는 꾸준함을 중시하는 기업이 되겠습니다.", "continent": "oceania", "nation": "australia", "date": "2023-01-08", "flagUrl": "https://flagcdn.com/w80/au.png" },
            { "text": "국화반", "number": "15674.802", "check": "F", "radio": "S", "multitext": "배가 가는 방향을 정하는 것은 바람도, 물결도 아닌 방향타를 쥔 선장의 의지입니다.", "continent": "north_america", "nation": "united_states", "date": "2023-01-09", "flagUrl": "https://flagcdn.com/w80/us.png" },
            { "text": "국화반", "number": "37456.109", "check": "F", "radio": "T", "multitext": "배가 가는 방향을 정하는 것은 바람도, 물결도 아닌 방향타를 쥔 선장의 의지입니다.", "continent": "europe", "nation": "hungary", "date": "2023-01-10", "flagUrl": "https://flagcdn.com/w80/hu.png" },
            { "text": "국화반", "number": "21853.497", "check": "F", "radio": "F", "multitext": "Never Say NO - 고객의 성공적인 프로젝트를 위해 소프트보울은 NO 보다는 YES를 지향 합니다.", "continent": "asia", "nation": "south_korea", "date": "2023-01-11", "flagUrl": "https://flagcdn.com/w80/kr.png" },
            { "text": "대나무반", "number": "65478.299", "check": "T", "radio": "F", "multitext": "당장 눈 앞의 이익보다는 미래에 생길 가치를, 나무보다는 숲을 보는 안목으로 경영하겠습니다.", "continent": "asia", "nation": "japan", "date": "2023-01-12", "flagUrl": "https://flagcdn.com/w80/jp.png" },
            { "text": "매화반", "number": "4596.401", "check": "F", "radio": "F", "multitext": "배가 가는 방향을 정하는 것은 바람도, 물결도 아닌 방향타를 쥔 선장의 의지입니다.", "continent": "north_america", "nation": "canada", "date": "2023-01-13", "flagUrl": "https://flagcdn.com/w80/ca.png" },
            { "text": "매화반", "number": "83267.034", "check": "T", "radio": "S", "multitext": "愚公移山(우공이산)의 마음으로 열심히 달려 갑니다.", "continent": "oceania", "nation": "australia", "date": "2023-01-14", "flagUrl": "https://flagcdn.com/w80/au.png" },
            { "text": "매화반", "number": "6785.387", "check": "F", "radio": "S", "multitext": "고객만족을 통해 사회에 기여하는 기업이 되겠다는 초심을 지키며 순간적인 반짝임보다는 꾸준함을 중시하는 기업이 되겠습니다.", "continent": "europe", "nation": "Turkey", "date": "2023-01-15", "flagUrl": "https://flagcdn.com/w80/tr.png" }
        ], 20);
    }

    function getContinentData() {
        return [
            { 'continentValue': 'asia', 'continentText': '아시아' },
            { 'continentValue': 'europe', 'continentText': '유럽' },
            { 'continentValue': 'north_america', 'continentText': '북아메리카' },
            { 'continentValue': 'oceania', 'continentText': '오세아니아' }
        ];
    }

    function getNationData() {
        return [
            { "continentValue": "asia", "nationText": "대한민국", "nationValue": "south_korea" },
            { "continentValue": "asia", "nationText": "일본", "nationValue": "japan" },
            { "continentValue": "asia", "nationText": "중국", "nationValue": "china" },
            { "continentValue": "europe", "nationText": "튀르키예", "nationValue": "Turkey" },
            { "continentValue": "europe", "nationText": "독일", "nationValue": "germany" },
            { "continentValue": "europe", "nationText": "프랑스", "nationValue": "france" },
            { "continentValue": "europe", "nationText": "헝가리", "nationValue": "hungary" },
            { "continentValue": "europe", "nationText": "이탈리아", "nationValue": "italy" },
            { "continentValue": "north_america", "nationText": "캐나다", "nationValue": "canada" },
            { "continentValue": "north_america", "nationText": "미국", "nationValue": "united_states" },
            { "continentValue": "oceania", "nationText": "호주", "nationValue": "australia" },
            { "continentValue": "oceania", "nationText": "뉴질랜드", "nationValue": "new_zealand" }
        ];
    }

    function serverColumns() {
        return [
            { key: "rowno", title: "#", type: "rowno", width: 70, readOnly: true },
            { key: "id", title: "ID", type: "number", width: 90, readOnly: true },
            { key: "name", title: "Name", type: "text", width: 140 },
            { key: "email", title: "Email", type: "text", width: 210 },
            { key: "dept", title: "Dept", type: "text", width: 140 },
            { key: "salary", title: "Salary", type: "number", width: 120 },
            { key: "status", title: "Status", type: "text", width: 110 }
        ];
    }

    function baseFeatures() {
        return { selection: true, editing: true, copyPaste: true, rowDrag: true };
    }

    function ensureMinSampleRows(rows, minCount) {
        if (!Array.isArray(rows)) return rows;
        var target = parseInt(minCount, 10);
        if (isNaN(target) || target < 1 || rows.length >= target || !rows.length) return rows;

        var expanded = rows.map(function (row) {
            return Object.assign({}, row);
        });

        var cursor = 0;
        while (expanded.length < target) {
            var seed = rows[cursor % rows.length] || {};
            var next = Object.assign({}, seed);
            next.__sampleCloneIndex = expanded.length + 1;
            expanded.push(next);
            cursor++;
        }

        return expanded;
    }

    function bindingColumns() {
        return [
            { key: "rowno", title: "#", type: "rowno", width: 70, readOnly: true },
            { key: "id", title: "ID", type: "number", width: 90, readOnly: true },
            { key: "name", title: "Name", type: "text", width: 140 },
            { key: "email", title: "Email", type: "text", width: 220 },
            { key: "dept", title: "Dept", type: "text", width: 130 },
            { key: "salary", title: "Salary", type: "number", width: 110 },
            { key: "status", title: "Status", type: "text", width: 100 }
        ];
    }

    function localBindingRows() {
        return ensureMinSampleRows([
            { id: 1001, name: "Kim Minseo", email: "minseo.kim@company.com", dept: "Development", salary: 76000, status: "Active" },
            { id: 1002, name: "Lee Jiwon", email: "jiwon.lee@company.com", dept: "Sales", salary: 64000, status: "Active" },
            { id: 1003, name: "Park Dohyun", email: "dohyun.park@company.com", dept: "HR", salary: 59000, status: "Inactive" },
            { id: 1004, name: "Choi Yuna", email: "yuna.choi@company.com", dept: "Marketing", salary: 67000, status: "Active" },
            { id: 1005, name: "Jung Seongho", email: "seongho.jung@company.com", dept: "Finance", salary: 72000, status: "Active" }
        ], 20);
    }

    function apiMockRow(index) {
        var names = ["Kim Minseo", "Lee Jiwon", "Park Dohyun", "Choi Yuna", "Jung Seongho", "Han Soyeon", "Yoon Taekyung", "Seo Arin"];
        var depts = ["Development", "Sales", "Marketing", "HR", "Finance"];
        var statuses = ["Active", "Inactive"];
        var id = index + 1;
        var name = names[index % names.length] + " " + id;
        return {
            id: id,
            name: name,
            email: "user" + id + "@example.com",
            dept: depts[index % depts.length],
            salary: 52000 + ((index * 137) % 68000),
            status: statuses[index % statuses.length],
            hireDate: "2024-" + String((index % 12) + 1).padStart(2, "0") + "-" + String((index % 28) + 1).padStart(2, "0"),
            profileUrl: "https://example.com/users/" + id,
            progress: (index * 7) % 100,
            active: index % 3 !== 0,
            rating: (index % 5) + 1
        };
    }

    function apiMockRows(offset, limit) {
        var rows = [];
        for (var i = 0; i < limit; i++) {
            rows.push(apiMockRow(offset + i));
        }
        return rows;
    }

    function apiMockTotal(url) {
        var requested = parseInt(url.searchParams.get("dataSize") || "0", 10);
        if (requested === 100000 || requested === 300000 || requested === 500000) {
            return requested;
        }
        return 5000;
    }

    function apiJsonResponse(payload, contentType) {
        return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { "Content-Type": contentType || "application/json; charset=utf-8" }
        });
    }

    function apiMockResponse(url, init) {
        var path = url.pathname.toLowerCase();
        if (path === "/api/v1/demo/column-types" || path === "/api/demo/column-types") {
            return apiJsonResponse({
                title: "Column Types",
                subtitle: "Local fallback dataset for the static sample explorer.",
                calcData1: getRichSampleData(),
                continentData: getContinentData(),
                nationData: getNationData()
            });
        }

        if (path === "/api/v1/demo/tree-data" || path === "/api/demo/tree-data") {
            return apiJsonResponse({
                title: "Tree Data",
                subtitle: "Local fallback hierarchical dataset.",
                treeData: [
                    { id: 1, parentId: null, name: "Company", type: "Organization", owner: "CEO", status: "Active", budget: "500000", date: "2023-01-01" },
                    { id: 10, parentId: 1, name: "Development", type: "Department", owner: "CTO", status: "Active", budget: "220000", date: "2023-01-05" },
                    { id: 11, parentId: 10, name: "Frontend Team", type: "Team", owner: "Lead Kim", status: "Active", budget: "90000", date: "2023-01-10" },
                    { id: 12, parentId: 10, name: "Backend Team", type: "Team", owner: "Lead Park", status: "Active", budget: "100000", date: "2023-01-12" },
                    { id: 20, parentId: 1, name: "Sales", type: "Department", owner: "CSO", status: "Active", budget: "120000", date: "2023-01-06" },
                    { id: 21, parentId: 20, name: "Domestic Sales", type: "Team", owner: "Lead Lee", status: "Active", budget: "60000", date: "2023-01-15" }
                ]
            });
        }

        if (path === "/api/data/json" || path === "/api/v1/query/legacy") {
            var jsonOffset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10) || 0);
            var jsonLimit = Math.max(1, Math.min(1000, parseInt(url.searchParams.get("limit") || "100", 10) || 100));
            return apiJsonResponse({
                total: apiMockTotal(url),
                data: apiMockRows(jsonOffset, jsonLimit),
                offset: jsonOffset,
                limit: jsonLimit,
                dataSize: apiMockTotal(url)
            });
        }

        if (path === "/api/data/columnar" || path === "/api/v1/query/columnar") {
            var fields = ["id", "name", "email", "dept", "salary", "status", "hireDate", "profileUrl", "progress", "active", "rating"];
            var columnOffset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10) || 0);
            var columnLimit = Math.max(1, Math.min(1000, parseInt(url.searchParams.get("limit") || "100", 10) || 100));
            var rows = apiMockRows(columnOffset, columnLimit);
            return apiJsonResponse({
                total: apiMockTotal(url),
                columns: fields,
                data: rows.map(function (row) {
                    return fields.map(function (field) { return row[field]; });
                }),
                offset: columnOffset,
                limit: columnLimit,
                dataSize: apiMockTotal(url)
            });
        }

        if (path === "/api/data/stream") {
            var streamOffset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10) || 0);
            var streamLimit = Math.max(1, Math.min(1000, parseInt(url.searchParams.get("limit") || "100", 10) || 100));
            var body = apiMockRows(streamOffset, streamLimit).map(function (row) {
                return JSON.stringify(row);
            }).join("\n");
            return new Response(body + "\n", {
                status: 200,
                headers: { "Content-Type": "application/x-ndjson; charset=utf-8" }
            });
        }

        if (path === "/api/v1/query/execute") {
            var spec = {};
            try {
                spec = init && init.body ? JSON.parse(init.body) : {};
            } catch (_) { }
            var pageSize = Math.max(1, Math.min(1000, parseInt(spec.pageSize || spec.take || "20", 10) || 20));
            var page = Math.max(1, parseInt(spec.page || "1", 10) || 1);
            var offset = (page - 1) * pageSize;
            return apiJsonResponse({
                total: 5000,
                rows: apiMockRows(offset, pageSize),
                page: page,
                pageSize: pageSize,
                aggregates: {}
            });
        }

        return null;
    }

    function installApiFallback() {
        if (!window.fetch || window.__dataGridAiSampleApiFallbackInstalled) {
            return;
        }

        var originalFetch = window.fetch.bind(window);
        window.__dataGridAiSampleApiFallbackInstalled = true;
        window.fetch = async function (input, init) {
            var url = new URL(typeof input === "string" ? input : input.url, window.location.href);
            if (url.pathname.indexOf("/api/") !== 0) {
                return originalFetch(input, init);
            }

            // Static hosts without the API server answer from the local dataset without a failing request.
            if (hostConfig.localApiOnly === true) {
                var localResponse = apiMockResponse(url, init);
                if (localResponse) {
                    return localResponse;
                }
            }

            try {
                var response = await originalFetch(input, init);
                var contentType = response.headers.get("content-type") || "";
                if (response.ok && (contentType.indexOf("json") >= 0 || contentType.indexOf("ndjson") >= 0)) {
                    return response;
                }

                var fallback = apiMockResponse(url, init);
                return fallback || response;
            } catch (_) {
                var failedFallback = apiMockResponse(url, init);
                if (failedFallback) {
                    return failedFallback;
                }
                throw _;
            }
        };
    }

    function rowStyleDemoRows() {
        return ensureMinSampleRows([
            { text: "VIP Rush", name: "Kim Minseo", number: 980, check: "T", radio: "S", date: "2026-04-01", multitext: "Priority delivery", continent: "AS", nation: "KR" },
            { text: "Audit Hold", name: "Lee Jiwon", number: 860, check: "F", radio: "F", date: "2026-03-18", multitext: "Pending review", continent: "EU", nation: "DE" },
            { text: "Standard", name: "Park Dohyun", number: 620, check: "T", radio: "S", date: "2026-03-06", multitext: "Normal flow", continent: "AS", nation: "KR" },
            { text: "EU Transit", name: "Choi Yuna", number: 540, check: "T", radio: "F", date: "2026-02-25", multitext: "Route update", continent: "EU", nation: "FR" },
            { text: "VIP Renewal", name: "Jung Seongho", number: 930, check: "T", radio: "S", date: "2026-04-08", multitext: "Contract extension", continent: "NA", nation: "US" },
            { text: "Risk Followup", name: "Han Soyeon", number: 790, check: "F", radio: "U", date: "2026-03-30", multitext: "Requires manager signoff", continent: "AS", nation: "JP" },
            { text: "Baseline", name: "Yoon Taekyung", number: 470, check: "T", radio: "S", date: "2026-02-14", multitext: "Stable process", continent: "SA", nation: "BR" },
            { text: "EU Support", name: "Seo Arin", number: 680, check: "T", radio: "F", date: "2026-03-21", multitext: "Regional support", continent: "EU", nation: "NL" },
            { text: "Hotfix", name: "Bae Minjae", number: 995, check: "F", radio: "U", date: "2026-04-11", multitext: "Urgent hotfix batch", continent: "AS", nation: "KR" },
            { text: "Routine", name: "Oh Jisoo", number: 580, check: "T", radio: "S", date: "2026-03-12", multitext: "Routine maintenance", continent: "OC", nation: "AU" }
        ], 20);
    }

    function stickyRowsDemoRows() {
        var seeds = rowStyleDemoRows();
        var rows = [];
        for (var i = 0; i < 80; i++) {
            var src = seeds[i % seeds.length];
            var row = Object.assign({}, src);
            row.text = src.text + " #" + (i + 1);
            row.number = Math.max(120, (parseInt(src.number, 10) || 0) + ((i % 7) - 3) * 12 + Math.floor(i / 10) * 6);
            row.multitext = src.multitext + " batch " + (Math.floor(i / 10) + 1);
            rows.push(row);
        }
        return rows;
    }

    function statusColorRows() {
        return ensureMinSampleRows([
            { status: "좋음", name: "비트코인", nowCost: 143200000, dayBeforePercent: "1.42", dayBeforeCost: "▲2,000,000", highCost: 145500000, lowCost: 140800000, tradingVolume: "2,340 BTC", tradingValue: 335000000000 },
            { status: "주의", name: "이더리움", nowCost: 5100000, dayBeforePercent: "-0.88", dayBeforeCost: "▼45,000", highCost: 5200000, lowCost: 5030000, tradingVolume: "18,200 ETH", tradingValue: 92800000000 },
            { status: "좋음", name: "리플", nowCost: 910, dayBeforePercent: "2.11", dayBeforeCost: "▲19", highCost: 938, lowCost: 880, tradingVolume: "12,300,000 XRP", tradingValue: 11200000000 },
            { status: "주의", name: "솔라나", nowCost: 236000, dayBeforePercent: "-1.36", dayBeforeCost: "▼3,200", highCost: 243000, lowCost: 231000, tradingVolume: "420,000 SOL", tradingValue: 9880000000 },
            { status: "좋음", name: "도지코인", nowCost: 278, dayBeforePercent: "0.73", dayBeforeCost: "▲2", highCost: 284, lowCost: 272, tradingVolume: "86,000,000 DOGE", tradingValue: 23900000000 },
            { status: "주의", name: "에이다", nowCost: 645, dayBeforePercent: "-2.02", dayBeforeCost: "▼13", highCost: 672, lowCost: 638, tradingVolume: "25,200,000 ADA", tradingValue: 16200000000 },
            { status: "좋음", name: "아발란체", nowCost: 51800, dayBeforePercent: "1.04", dayBeforeCost: "▲530", highCost: 52600, lowCost: 50400, tradingVolume: "980,000 AVAX", tradingValue: 5070000000 },
            { status: "주의", name: "폴카닷", nowCost: 12900, dayBeforePercent: "-0.51", dayBeforeCost: "▼66", highCost: 13150, lowCost: 12740, tradingVolume: "3,600,000 DOT", tradingValue: 4630000000 }
        ], 20);
    }

    function mergeSampleRows() {
        return [
            { seq: 1, rstat: "보고완료", epidinvest: "Y", magorder: "1차", progress: "진행중", pcr1: "2026-04-01", pcr2: "2026-04-01", healthCenter: "강남구 보건소", contactes: 12 },
            { seq: 1, rstat: "보고완료", epidinvest: "Y", magorder: "1차", progress: "진행중", pcr1: "2026-04-01", pcr2: "2026-04-01", healthCenter: "강남구 보건소", contactes: 12 },
            { seq: 1, rstat: "보고완료", epidinvest: "Y", magorder: "2차", progress: "점검중", pcr1: "2026-04-03", pcr2: "2026-04-05", healthCenter: "강남구 보건소", contactes: 7 },
            { seq: 1, rstat: "보고완료", epidinvest: "N", magorder: "2차", progress: "점검중", pcr1: "2026-04-03", pcr2: "2026-04-05", healthCenter: "강남구 보건소", contactes: 7 },

            { seq: 2, rstat: "보고중", epidinvest: "Y", magorder: "1차", progress: "진행중", pcr1: "2026-04-02", pcr2: "2026-04-02", healthCenter: "서초구 보건소", contactes: 20 },
            { seq: 2, rstat: "보고중", epidinvest: "Y", magorder: "1차", progress: "진행중", pcr1: "2026-04-02", pcr2: "2026-04-02", healthCenter: "서초구 보건소", contactes: 20 },
            { seq: 2, rstat: "보고중", epidinvest: "Y", magorder: "2차", progress: "완료", pcr1: "2026-04-06", pcr2: "2026-04-06", healthCenter: "서초구 보건소", contactes: 5 },
            { seq: 2, rstat: "보고중", epidinvest: "N", magorder: "2차", progress: "완료", pcr1: "2026-04-06", pcr2: "2026-04-06", healthCenter: "서초구 보건소", contactes: 5 },

            { seq: 3, rstat: "검토중", epidinvest: "Y", magorder: "1차", progress: "대기", pcr1: "2026-04-04", pcr2: "2026-04-07", healthCenter: "송파구 보건소", contactes: 14 },
            { seq: 3, rstat: "검토중", epidinvest: "Y", magorder: "1차", progress: "대기", pcr1: "2026-04-04", pcr2: "2026-04-07", healthCenter: "송파구 보건소", contactes: 14 },
            { seq: 3, rstat: "검토중", epidinvest: "Y", magorder: "2차", progress: "대기", pcr1: "2026-04-08", pcr2: "2026-04-08", healthCenter: "송파구 보건소", contactes: 3 },
            { seq: 3, rstat: "검토중", epidinvest: "N", magorder: "2차", progress: "대기", pcr1: "2026-04-08", pcr2: "2026-04-08", healthCenter: "송파구 보건소", contactes: 3 },

            { seq: 4, rstat: "완료", epidinvest: "Y", magorder: "1차", progress: "완료", pcr1: "2026-04-09", pcr2: "2026-04-09", healthCenter: "마포구 보건소", contactes: 9 },
            { seq: 4, rstat: "완료", epidinvest: "Y", magorder: "1차", progress: "완료", pcr1: "2026-04-09", pcr2: "2026-04-09", healthCenter: "마포구 보건소", contactes: 9 },
            { seq: 4, rstat: "완료", epidinvest: "Y", magorder: "2차", progress: "완료", pcr1: "2026-04-10", pcr2: "2026-04-10", healthCenter: "마포구 보건소", contactes: 2 },
            { seq: 4, rstat: "완료", epidinvest: "N", magorder: "2차", progress: "완료", pcr1: "2026-04-10", pcr2: "2026-04-10", healthCenter: "마포구 보건소", contactes: 2 }
        ];
    }

    function summarySubtotalRows() {
        var rows = [
            { region: "서울", customer: "A마트", qty: 12, amount: 840000, tax: 84000, status: "정상" },
            { region: "서울", customer: "B상사", qty: 6, amount: 420000, tax: 42000, status: "정상" },
            { region: "서울", customer: "C유통", qty: 4, amount: 260000, tax: 26000, status: "검토" },
            { region: "서울", customer: "D물산", qty: 9, amount: 690000, tax: 69000, status: "정상" },
            { region: "부산", customer: "E상회", qty: 7, amount: 455000, tax: 45500, status: "정상" },
            { region: "부산", customer: "F테크", qty: 3, amount: 198000, tax: 19800, status: "검토" },
            { region: "부산", customer: "G트레이드", qty: 11, amount: 880000, tax: 88000, status: "정상" },
            { region: "부산", customer: "H메디칼", qty: 5, amount: 315000, tax: 31500, status: "검토" },
            { region: "대구", customer: "I커머스", qty: 10, amount: 770000, tax: 77000, status: "정상" },
            { region: "대구", customer: "J홀딩스", qty: 8, amount: 560000, tax: 56000, status: "정상" }
        ];
        for (var i = 0; i < rows.length; i++) {
            rows[i].subtotal = (Number(rows[i].amount) || 0) + (Number(rows[i].tax) || 0);
        }
        return ensureMinSampleRows(rows, 20);
    }

    function localSampleConfig(titleText, toolbar, featurePatch, extra) {
        return Object.assign({
            mount: "#gridMount",
            title: titleText,
            toolbarText: toolbar,
            dataSource: columnSource(),
            features: Object.assign(baseFeatures(), featurePatch || {}),
            columns: baseColumns(),
            lists: {
                continentData: getContinentData(),
                nationData: getNationData()
            }
        }, extra || {});
    }

    function serverSampleConfig(titleText, toolbar, pageSize, featurePatch, extra) {
        return Object.assign({
            mount: "#gridMount",
            title: titleText,
            toolbarText: toolbar,
            dataSource: { url: "/api/data/columnar", serverMode: true },
            paging: { pageSize: pageSize || 100 },
            features: Object.assign({
                selection: true,
                selectionMode: "row",
                sorting: true,
                filtering: true,
                paging: true,
                lazyLoading: false,
                editing: true,
                copyPaste: true,
                rowDrag: true,
                stickyHeader: true,
                frozenColumns: 1,
                columnResize: true,
                contextMenu: true
            }, featurePatch || {}),
            columns: serverColumns()
        }, extra || {});
    }

    var samples = [
        {
            id: "column-types", group: "Column", name: "Column Types",
            title: "Column Types", subtitle: "Editing + multi column types",
            notes: [
                "Dataset: /api/v1/demo/column-types (fallback: /api/demo/column-types)",
                "Base editing and keyboard/copy workflow.",
                "Includes rowno/text/number/check/radio/date/multitext/combo columns.",
                "Sorting and filtering are enabled (GridAi sort/filter style)."
            ],
            code: [
                "AiGrid.createGrid({",
                "  mount: '#gridMount',",
                "  dataSource: {",
                "    url: '/api/v1/demo/column-types',",
                "    fallbackUrl: '/api/demo/column-types',",
                "    rowsPath: 'calcData1',",
                "    continentPath: 'continentData',",
                "    nationPath: 'nationData'",
                "  },",
                "  features: { selection: true, editing: true, copyPaste: true, columnResize: true, sorting: true, filtering: true },",
                "  columns: [",
                "    { key: 'rowno', title: '#', type: 'rowno', width: 60 },",
                "    { key: 'text', title: '텍스트', type: 'text', width: 130, placeHolder: '값을 입력하세요' },",
                "    { key: 'number', title: '숫자', type: 'number', width: 120, align: 'right', format: (v) => (parseFloat(v)||0).toLocaleString()+'%' },",
                "    { key: 'check', title: '체크박스', type: 'check', width: 100 },",
                "    { key: 'radio', title: '라디오버튼', type: 'radio', width: 230 },",
                "    { key: 'flagUrl', title: 'template', type: 'template', cellTemplate: renderFlagCell, width: 100 },",
                "    { key: 'date', title: '날짜', type: 'date', width: 180 },",
                "    { key: 'multitext', title: '멀티텍스트', type: 'multitext', width: 450 }",
                "  ]",
                "});"
            ],
            defaultJs: [
                "const continentData = " + JSON.stringify(getContinentData(), null, 2) + ";",
                "const nationData = " + JSON.stringify(getNationData(), null, 2) + ";",
                "",
                "function renderFlagCell(row) {",
                "  const wrapper = document.createElement('div');",
                "  wrapper.className = 'cell-flag-wrap';",
                "  const rawUrl = row && row.flagUrl != null ? String(row.flagUrl) : '';",
                "  try {",
                "    const parsedUrl = new URL(rawUrl, document.baseURI);",
                "    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') throw new Error('unsupported protocol');",
                "    const image = document.createElement('img');",
                "    image.src = parsedUrl.href;",
                "    image.className = 'cell-flag';",
                "    image.alt = 'flag';",
                "    wrapper.appendChild(image);",
                "  } catch (error) {",
                "    wrapper.textContent = rawUrl;",
                "  }",
                "  return wrapper;",
                "}",
                "",
                "return AiGrid.createGrid({",
                "  mount: '#gridMount',",
                "  dataSource: {",
                "    url: '/api/v1/demo/column-types',",
                "    fallbackUrl: '/api/demo/column-types',",
                "    rowsPath: 'calcData1',",
                "    continentPath: 'continentData',",
                "    nationPath: 'nationData'",
                "  },",
                "  features: { selection: true, editing: true, copyPaste: true, columnResize: true, sorting: true, filtering: true, stickyHeader: true },",
                "  columns: [",
                "    { key: 'rowno', title: '#', type: 'rowno', width: 60, readOnly: true },",
                "    { key: 'text', title: '텍스트', type: 'text', width: 130, placeHolder: '값을 입력하세요' },",
                "    { key: 'number', title: '숫자', type: 'number', width: 120, align: 'right', format: (v) => (parseFloat(v)||0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%' },",
                "    { key: 'check', title: '체크박스', type: 'check', width: 100 },",
                "    { key: 'radio', title: '라디오버튼', type: 'radio', width: 230 },",
                "    { key: 'flagUrl', title: 'template', type: 'template', cellTemplate: renderFlagCell, width: 100 },",
                "    { key: 'date', title: '날짜', type: 'date', width: 180, format: (v) => { if(!v) return ''; var d = new Date(v); return d.getFullYear()+'년 '+String(d.getMonth()+1).padStart(2,'0')+'월 '+String(d.getDate()).padStart(2,'0')+'일'; } },",
                "    { key: 'multitext', title: '멀티텍스트', type: 'multitext', width: 450, align: 'left' },",
                "    { key: 'button', title: '버튼', type: 'button', width: 160 },",
                "    { key: 'continent', title: '콤보(마스터)', type: 'combo-master', width: 150 },",
                "    { key: 'nation', title: '콤보(디테일)', type: 'combo-detail', width: 150 }",
                "  ]",
                "});"
            ],
            build: function () {
                var config = localSampleConfig(
                    "Phase 1 - Column Types",
                    "Selection, Editing, Copy/Paste, Row Drag",
                    { columnResize: true, sorting: true, filtering: true, stickyHeader: true },
                    {
                        dataSource: columnSource(),
                        columns: baseColumns(),
                        lists: {
                            continentData: getContinentData(),
                            nationData: getNationData()
                        }
                    }
                );
                return config;
            }
        },
        {
            id: "sort-filter", group: "Column", name: "Sort & Filter",
            title: "Sort & Filter", subtitle: "Caption filter + row filter",
            notes: [
                "Click column headers to sort ascending/descending.",
                "Use the 툴바 필터 and 행 필터 toolbar buttons to switch filter styles.",
                "행 필터 keeps the header input compact and opens operator/value controls in a popup.",
                "필터 입력값에서 | 는 OR 조건, & 는 AND 조건입니다. and, or은 칼럼조건입니다",
                "Filter mode is AND by default."
            ],
            code: [
                "AiGrid.createGrid({",
                "  mount: '#gridMount',",
                "  dataSource: { url: '/api/v1/demo/column-types', rowsPath: 'calcData1' },",
                "  features: { selection: true, sorting: true, filtering: true, rowFilter: true, stickyHeader: true, columnResize: true },",
                "  toolBar: { left: ['captionFilter', 'rowFilter'] },",
                "  filterUiMode: 'row',",
                "  filterMode: 'and',",
                "  columns: [/* rowno, text, name, number, check, date ... */]",
                "});"
            ],
            build: function () {
                return localSampleConfig(
                    "Sort & Filter",
                    "Header sorting and operator-based filtering",
                    {
                        selection: true,
                        sorting: true,
                        filtering: true,
                        stickyHeader: true,
                        columnResize: true,
                        rowFilter: true,
                        editing: false,
                        copyPaste: false,
                        rowDrag: false
                    },
                    {
                        toolBar: { left: ["captionFilter", "rowFilter"] },
                        filterUiMode: "row",
                        filterMode: "and"
                    }
                );
            }
        },
        {
            id: "caption-menu", group: "Column", name: "Caption Menu",
            title: "Caption Menu", subtitle: "Hide/Show columns + Pin Left/Right",
            notes: [
                "Click the hamburger(≡) button on each header.",
                "Hide/show columns from the caption menu.",
                "Pin columns to left/right and release pin.",
                "captionMenu supports both grid-level and column-level true/false."
            ],
            code: [
                "AiGrid.createGrid({",
                "  mount: '#gridMount',",
                "  dataSource: { url: '/api/v1/demo/column-types', rowsPath: 'calcData1' },",
                "  features: { sorting: true, filtering: true, columnResize: true, stickyHeader: true, captionMenu: true },",
                "  columns: [{ key: 'rowno', captionMenu: false }, { key: 'name', captionMenu: true }, ...]",
                "});"
            ],
            build: function () {
                var cols = baseColumns();
                for (var i = 0; i < cols.length; i++) {
                    if (cols[i].key === "rowno") cols[i].captionMenu = false;
                }
                return localSampleConfig(
                    "Caption Menu",
                    "Header menu: hide/show, pin left/right",
                    {
                        sorting: true,
                        filtering: true,
                        columnResize: true,
                        stickyHeader: true,
                        captionMenu: true
                    },
                    {
                        columns: cols
                    }
                );
            }
        },
        {
            id: "grid-resize", group: "Column", name: "Grid Resize",
            title: "Grid Resize", subtitle: "Shrink columns to fit viewport width",
            notes: [
                "When browser width gets smaller, columns shrink proportionally.",
                "Use features.gridResize: true to prefer fit behavior over horizontal scroll.",
                "If viewport becomes too small, minimum widths are used."
            ],
            code: [
                "AiGrid.createGrid({",
                "  mount: '#gridMount',",
                "  dataSource: { url: '/api/v1/demo/column-types', rowsPath: 'calcData1' },",
                "  features: { columnResize: true, gridResize: true, stickyHeader: true, sorting: true, filtering: true },",
                "  columns: [/* columns with width values */]",
                "});"
            ],
            build: function () {
                return localSampleConfig(
                    "Grid Resize",
                    "Viewport shrink => proportional column shrink",
                    {
                        sorting: true,
                        filtering: true,
                        columnResize: true,
                        gridResize: true,
                        stickyHeader: true,
                        rowDrag: false
                    }
                );
            }
        },
        {
            id: "row-select-checkbox", group: "Column", name: "Row Select Checkbox",
            title: "Row Select Checkbox", subtitle: "First-column checkbox selects row",
            notes: [
                "First column renders a real checkbox.",
                "Header checkbox can select or clear all rows.",
                "When checkbox is clicked, that row is selected (selectionMode: multi-row).",
                "Selected row values can be read from grid.selectedRows."
            ],
            code: [
                "var gridPromise = AiGrid.createGrid({",
                "  features: { selection: true, selectionMode: 'multi-row' },",
                "  columns: [{ key: 'selected', type: 'row-check' }, ...]",
                "});",
                "grid.on('selectionChange', function () {",
                "  var rows = (grid.selectedRows || []).map(function (i) { return grid.rows[i]; });",
                "  console.log(rows);",
                "});"
            ],
            build: function () {
                return localSampleConfig(
                    "Row Select Checkbox",
                    "Checkbox click => row selection",
                    {
                        selection: true,
                        selectionMode: "multi-row",
                        rowDrag: false,
                        editing: false,
                        copyPaste: false
                    },
                    {
                        columns: [
                            { key: "selected", title: "Select", type: "row-check", width: 86, readOnly: true },
                            { key: "rowno", title: "#", type: "rowno", width: 70, readOnly: true },
                            { key: "text", title: "Text", type: "text", width: 110 },
                            { key: "name", title: "Name", type: "text", width: 100 },
                            { key: "number", title: "Number", type: "number", width: 95 },
                            { key: "check", title: "Check", type: "check", width: 90 },
                            { key: "radio", title: "Radio", type: "radio", width: 120 },
                            { key: "date", title: "Date", type: "date", width: 120 }
                        ]
                    }
                );
            }
        },
        {
            id: "binding-local", group: "Binding", name: "Local Data Binding",
            title: "Local Data Binding", subtitle: "Bind array data directly to grid",
            notes: [
                "Data source is a local JavaScript array (no HTTP request).",
                "Closest DataGridAI pattern to GridAI guide: LocalData binding.",
                "Edit local rows/columns and run immediately."
            ],
            code: [
                "AiGrid.createGrid({",
                "  dataSource: [/* local row objects */],",
                "  columns: [/* local schema columns */]",
                "});"
            ],
            build: function () {
                return {
                    mount: "#gridMount",
                    title: "Data Binding - Local Data",
                    toolbarText: "Array-to-grid direct binding",
                    dataSource: localBindingRows(),
                    features: {
                        selection: true,
                        editing: true,
                        copyPaste: true,
                        rowDrag: false,
                        stickyHeader: true,
                        frozenColumns: 1
                    },
                    columns: bindingColumns()
                };
            }
        },
        {
            id: "binding-ajax", group: "Binding", name: "Ajax Data Binding",
            title: "Ajax Data Binding", subtitle: "Fetch data then bind to grid",
            notes: [
                "Data is loaded with fetch() and then bound as local rows.",
                "Closest DataGridAI pattern to GridAI guide: ajax binding.",
                "Default request uses /api/data/json?offset=0&limit=80."
            ],
            code: [
                "fetch('/api/data/json?...').then(r => r.json()).then(payload => {",
                "  const rows = payload.data;",
                "  return AiGrid.createGrid({ dataSource: rows, columns: [...] });",
                "});"
            ],
            build: function () {
                return {
                    mount: "#gridMount",
                    title: "Data Binding - Ajax",
                    toolbarText: "Fetch + bind",
                    dataSource: localBindingRows(),
                    features: {
                        selection: true,
                        editing: true,
                        copyPaste: true,
                        rowDrag: false,
                        stickyHeader: true,
                        frozenColumns: 1
                    },
                    columns: bindingColumns()
                };
            },
            defaultJs: [
                "// Ajax binding sample: fetch rows first, then bind.",
                "async function loadRows() {",
                "  var response = await fetch('/api/data/json?offset=0&limit=80', { cache: 'no-store' });",
                "  if (!response.ok) {",
                "    throw new Error('Ajax request failed: ' + response.status);",
                "  }",
                "",
                "  var payload = await response.json();",
                "  var rows = Array.isArray(payload.data) ? payload.data : (Array.isArray(payload.rows) ? payload.rows : []);",
                "",
                "  if (rows.length && Array.isArray(rows[0]) && Array.isArray(payload.columns)) {",
                "    rows = rows.map(function (src) {",
                "      var row = {};",
                "      for (var i = 0; i < payload.columns.length; i++) {",
                "        row[payload.columns[i]] = src[i];",
                "      }",
                "      return row;",
                "    });",
                "  }",
                "",
                "  return rows;",
                "}",
                "",
                "return loadRows().then(function (rows) {",
                "  return AiGrid.createGrid({",
                "    mount: '#gridMount',",
                "    title: 'Data Binding - Ajax',",
                "    toolbarText: 'Fetch + bind',",
                "    dataSource: rows,",
                "    features: { selection: true, editing: true, copyPaste: true, rowDrag: false, stickyHeader: true, frozenColumns: 1 },",
                "    columns: [",
                "      { key: 'rowno', title: '#', type: 'rowno', width: 70, readOnly: true },",
                "      { key: 'id', title: 'ID', type: 'number', width: 90, readOnly: true },",
                "      { key: 'name', title: 'Name', type: 'text', width: 140 },",
                "      { key: 'email', title: 'Email', type: 'text', width: 220 },",
                "      { key: 'dept', title: 'Dept', type: 'text', width: 130 },",
                "      { key: 'salary', title: 'Salary', type: 'number', width: 110 },",
                "      { key: 'status', title: 'Status', type: 'text', width: 100 }",
                "    ]",
                "  });",
                "});"
            ]
        },
        {
            id: "rendering", group: "Style", name: "Sticky/Frozen",
            title: "Rendering", subtitle: "Sticky header/footer + frozen columns",
            notes: [
                "Frozen columns: 2",
                "Summary row enabled",
                "Good for visual rendering regression checks."
            ],
            code: [
                "AiGrid.createGrid({",
                "  features: { stickyHeader: true, stickyFooter: true, frozenColumns: 2, summary: true }",
                "});"
            ],
            build: function () {
                return localSampleConfig("Phase 2 - Rendering", "Sticky Header/Footer + Frozen Columns", {
                    stickyHeader: true,
                    stickyFooter: true,
                    frozenColumns: 2,
                    summary: true
                });
            }
        },
        {
            id: "summary-subtotal", group: "Style", name: "Summary & Subtotal",
            title: "Summary & Subtotal", subtitle: "Row subtotal column + footer subtotal/total rows",
            notes: [
                "행합계(subtotal) 열을 데이터 행에 표시합니다.",
                "footer에 소계(서울/부산)와 합계를 다중 행으로 표시합니다.",
                "summary.rows + where(row) 조건으로 소계 범위를 지정할 수 있습니다."
            ],
            code: [
                "AiGrid.createGrid({",
                "  features: { stickyFooter: true, summary: true },",
                "  summary: {",
                "    labelColumn: 'customer',",
                "    rows: [",
                "      { label: '소계(서울)', where: function (row) { return row.region === '서울'; }, columns: { qty: 'sum', amount: 'sum', tax: 'sum', subtotal: 'sum' } },",
                "      { label: '합계', columns: { qty: 'sum', amount: 'sum', tax: 'sum', subtotal: 'sum' } }",
                "    ]",
                "  }",
                "});"
            ],
            build: function () {
                return {
                    mount: "#gridMount",
                    title: "Summary & Subtotal",
                    toolbarText: "Row subtotal + footer subtotal/total",
                    dataSource: summarySubtotalRows(),
                    features: {
                        selection: true,
                        editing: false,
                        copyPaste: true,
                        rowDrag: false,
                        stickyHeader: true,
                        stickyFooter: true,
                        summary: true,
                        columnResize: true,
                        sorting: true
                    },
                    columns: [
                        { key: "rowno", title: "#", type: "rowno", width: 70, readOnly: true },
                        { key: "region", title: "지역", type: "text", width: 100 },
                        { key: "customer", title: "거래처", type: "text", width: 140 },
                        { key: "qty", title: "수량", type: "number", width: 90, align: "right" },
                        { key: "amount", title: "공급가", type: "number", width: 120, align: "right", format: function (v) { return Number(v || 0).toLocaleString() + " KRW"; } },
                        { key: "tax", title: "부가세", type: "number", width: 110, align: "right", format: function (v) { return Number(v || 0).toLocaleString() + " KRW"; } },
                        { key: "subtotal", title: "행합계", type: "number", width: 130, align: "right", readOnly: true, format: function (v) { return Number(v || 0).toLocaleString() + " KRW"; } },
                        { key: "status", title: "상태", type: "text", width: 100, align: "center" }
                    ],
                    summary: {
                        labelColumn: "customer",
                        rowHeight: 32,
                        rows: [
                            {
                                label: "소계(서울)",
                                kind: "subtotal",
                                where: function (row) { return row.region === "서울"; },
                                columns: { qty: "sum", amount: "sum", tax: "sum", subtotal: "sum" },
                                values: {
                                    status: function (rows) { return rows.length + "건"; }
                                }
                            },
                            {
                                label: "소계(부산)",
                                kind: "subtotal",
                                where: function (row) { return row.region === "부산"; },
                                columns: { qty: "sum", amount: "sum", tax: "sum", subtotal: "sum" },
                                values: {
                                    status: function (rows) { return rows.length + "건"; }
                                }
                            },
                            {
                                label: "합계",
                                kind: "total",
                                columns: { qty: "sum", amount: "sum", tax: "sum", subtotal: "sum" },
                                values: {
                                    status: function (rows) {
                                        var ok = 0;
                                        for (var i = 0; i < rows.length; i++) {
                                            if (rows[i].status === "정상") ok++;
                                        }
                                        return "정상 " + ok + "건 / 전체 " + rows.length + "건";
                                    }
                                }
                            }
                        ],
                        formatter: function (value, ctx) {
                            if (value == null || value === "") return "";
                            if (ctx.key === "amount" || ctx.key === "tax" || ctx.key === "subtotal") {
                                return Number(value || 0).toLocaleString() + " KRW";
                            }
                            if (ctx.key === "qty" && typeof value === "number") {
                                return value.toLocaleString();
                            }
                            return value;
                        }
                    }
                };
            },
            defaultJs: [
                "var rows = [",
                "  { region: '서울', customer: 'A마트', qty: 12, amount: 840000, tax: 84000, status: '정상' },",
                "  { region: '서울', customer: 'B상사', qty: 6, amount: 420000, tax: 42000, status: '정상' },",
                "  { region: '서울', customer: 'C유통', qty: 4, amount: 260000, tax: 26000, status: '검토' },",
                "  { region: '서울', customer: 'D물산', qty: 9, amount: 690000, tax: 69000, status: '정상' },",
                "  { region: '부산', customer: 'E상회', qty: 7, amount: 455000, tax: 45500, status: '정상' },",
                "  { region: '부산', customer: 'F테크', qty: 3, amount: 198000, tax: 19800, status: '검토' },",
                "  { region: '부산', customer: 'G트레이드', qty: 11, amount: 880000, tax: 88000, status: '정상' },",
                "  { region: '부산', customer: 'H메디칼', qty: 5, amount: 315000, tax: 31500, status: '검토' },",
                "  { region: '대구', customer: 'I커머스', qty: 10, amount: 770000, tax: 77000, status: '정상' },",
                "  { region: '대구', customer: 'J홀딩스', qty: 8, amount: 560000, tax: 56000, status: '정상' }",
                "];",
                "for (var i = 0; i < rows.length; i++) {",
                "  rows[i].subtotal = (Number(rows[i].amount) || 0) + (Number(rows[i].tax) || 0);",
                "}",
                "",
                "return AiGrid.createGrid({",
                "  mount: '#gridMount',",
                "  title: 'Summary & Subtotal',",
                "  toolbarText: 'Row subtotal + footer subtotal/total',",
                "  dataSource: rows,",
                "  features: { selection: true, editing: false, copyPaste: true, rowDrag: false, stickyHeader: true, stickyFooter: true, summary: true, columnResize: true, sorting: true },",
                "  columns: [",
                "    { key: 'rowno', title: '#', type: 'rowno', width: 70, readOnly: true },",
                "    { key: 'region', title: '지역', type: 'text', width: 100 },",
                "    { key: 'customer', title: '거래처', type: 'text', width: 140 },",
                "    { key: 'qty', title: '수량', type: 'number', width: 90, align: 'right' },",
                "    { key: 'amount', title: '공급가', type: 'number', width: 120, align: 'right', format: function (v) { return Number(v || 0).toLocaleString() + ' KRW'; } },",
                "    { key: 'tax', title: '부가세', type: 'number', width: 110, align: 'right', format: function (v) { return Number(v || 0).toLocaleString() + ' KRW'; } },",
                "    { key: 'subtotal', title: '행합계', type: 'number', width: 130, align: 'right', readOnly: true, format: function (v) { return Number(v || 0).toLocaleString() + ' KRW'; } },",
                "    { key: 'status', title: '상태', type: 'text', width: 100, align: 'center' }",
                "  ],",
                "  summary: {",
                "    labelColumn: 'customer',",
                "    rowHeight: 32,",
                "    rows: [",
                "      { label: '소계(서울)', kind: 'subtotal', where: function (row) { return row.region === '서울'; }, columns: { qty: 'sum', amount: 'sum', tax: 'sum', subtotal: 'sum' }, values: { status: function (rows) { return rows.length + '건'; } } },",
                "      { label: '소계(부산)', kind: 'subtotal', where: function (row) { return row.region === '부산'; }, columns: { qty: 'sum', amount: 'sum', tax: 'sum', subtotal: 'sum' }, values: { status: function (rows) { return rows.length + '건'; } } },",
                "      { label: '합계', kind: 'total', columns: { qty: 'sum', amount: 'sum', tax: 'sum', subtotal: 'sum' }, values: { status: function (rows) { var ok = 0; for (var i = 0; i < rows.length; i++) { if (rows[i].status === '정상') ok++; } return '정상 ' + ok + '건 / 전체 ' + rows.length + '건'; } } }",
                "    ],",
                "    formatter: function (value, ctx) {",
                "      if (value == null || value === '') return '';",
                "      if (ctx.key === 'amount' || ctx.key === 'tax' || ctx.key === 'subtotal') return Number(value || 0).toLocaleString() + ' KRW';",
                "      if (ctx.key === 'qty' && typeof value === 'number') return value.toLocaleString();",
                "      return value;",
                "    }",
                "  }",
                "});"
            ]
        },
        {
            id: "multi-header", group: "Style", name: "Multi Header",
            title: "Multi Header", subtitle: "Grouped column headers with sortable leaf headers",
            notes: [
                "일반 컬럼은 rowspan=2로 두 헤더 행을 차지하고, 승인정보만 colspan으로 하위 컬럼을 묶습니다.",
                "그룹에 속하지 않은 헤더와 승인정보 하위 헤더 모두 클릭 정렬을 지원합니다.",
                "Shift+클릭하면 다중 컬럼 정렬이 적용되며 화살표 옆 숫자로 우선순위를 표시합니다.",
                "승인정보 그룹 헤더 자체는 설명용이며 정렬 상태를 변경하지 않습니다."
            ],
            code: [
                "AiGrid.createGrid({",
                "  features: { stickyHeader: true, sorting: true, columnResize: true },",
                "  headerGroups: [",
                "    { title: '승인정보', children: ['advisor', 'departmentHead', 'scholarship', 'registration', 'counseling', 'academicAffairs'] }",
                "  ],",
                "  columns: [ /* rowspan 일반 컬럼 + 승인정보 하위 컬럼 */ ]",
                "});"
            ],
            build: function () {
                return {
                    mount: "#gridMount",
                    title: "Multi Header",
                    toolbarText: "Click a leaf header to sort · Shift-click for multi-sort",
                    dataSource: [
                        { selected: false, requestDate: "2024-07-11", year: 2024, semester: "1학기", department: "간호학과", grade: 3, studentNo: "201901149", name: "이채은", status: "휴학연기", advisor: "승인", departmentHead: "승인", scholarship: "-", registration: "완료", counseling: "완료", academicAffairs: "승인" },
                        { selected: false, requestDate: "2024-07-16", year: 2024, semester: "1학기", department: "간호학과", grade: 1, studentNo: "202401102", name: "황서준", status: "군휴학", advisor: "승인", departmentHead: "대기", scholarship: "-", registration: "완료", counseling: "대기", academicAffairs: "승인" },
                        { selected: false, requestDate: "2024-07-18", year: 2024, semester: "2학기", department: "컴퓨터공학과", grade: 2, studentNo: "202301087", name: "김민서", status: "일반휴학", advisor: "대기", departmentHead: "대기", scholarship: "확인", registration: "완료", counseling: "완료", academicAffairs: "대기" }
                    ],
                    features: {
                        selection: true,
                        editing: false,
                        copyPaste: true,
                        rowDrag: false,
                        stickyHeader: true,
                        sorting: true,
                        columnResize: true
                    },
                    headerGroups: [
                        { id: "approval", title: "승인정보", children: ["advisor", "departmentHead", "scholarship", "registration", "counseling", "academicAffairs"] }
                    ],
                    columns: [
                        { key: "selected", title: "", type: "row-check", width: 48 },
                        { key: "requestDate", title: "신청일자", type: "date", width: 110, readOnly: true },
                        { key: "year", title: "년도", type: "number", width: 80, readOnly: true },
                        { key: "semester", title: "학기", type: "text", width: 80, readOnly: true },
                        { key: "department", title: "학과", type: "text", width: 150, readOnly: true },
                        { key: "grade", title: "학년", type: "number", width: 80, readOnly: true },
                        { key: "studentNo", title: "학번", type: "text", width: 120, readOnly: true },
                        { key: "name", title: "성명", type: "text", width: 110, readOnly: true },
                        { key: "status", title: "현학적 상태", type: "text", width: 120, readOnly: true },
                        { key: "advisor", title: "지도교수", type: "text", width: 100, readOnly: true },
                        { key: "departmentHead", title: "학부(과)장", type: "text", width: 110, readOnly: true },
                        { key: "scholarship", title: "장학", type: "text", width: 90, readOnly: true },
                        { key: "registration", title: "등록", type: "text", width: 90, readOnly: true },
                        { key: "counseling", title: "상담", type: "text", width: 90, readOnly: true },
                        { key: "academicAffairs", title: "교무처", type: "text", width: 90, readOnly: true }
                    ]
                };
            },
            defaultJs: [
                "var rows = [",
                "  { requestDate: '2024-07-11', year: 2024, semester: '1학기', department: '간호학과', name: '이채은', advisor: '승인', departmentHead: '승인', scholarship: '-', registration: '완료', counseling: '완료', academicAffairs: '승인' },",
                "  { requestDate: '2024-07-16', year: 2024, semester: '1학기', department: '간호학과', name: '황서준', advisor: '승인', departmentHead: '대기', scholarship: '-', registration: '완료', counseling: '대기', academicAffairs: '승인' }",
                "];",
                "",
                "return AiGrid.createGrid({",
                "  mount: '#gridMount',",
                "  title: 'Multi Header',",
                "  toolbarText: 'Click a leaf header to sort · Shift-click for multi-sort',",
                "  dataSource: rows,",
                "  features: { selection: true, editing: false, copyPaste: true, rowDrag: false, stickyHeader: true, sorting: true, columnResize: true },",
                "  headerGroups: [",
                "    { id: 'approval', title: '승인정보', children: ['advisor', 'departmentHead', 'scholarship', 'registration', 'counseling', 'academicAffairs'] }",
                "  ],",
                "  columns: [",
                "    { key: 'requestDate', title: '신청일자', type: 'date', width: 110, readOnly: true },",
                "    { key: 'year', title: '년도', type: 'number', width: 80, readOnly: true },",
                "    { key: 'semester', title: '학기', type: 'text', width: 80, readOnly: true },",
                "    { key: 'department', title: '학과', type: 'text', width: 150, readOnly: true },",
                "    { key: 'name', title: '성명', type: 'text', width: 110, readOnly: true },",
                "    { key: 'advisor', title: '지도교수', type: 'text', width: 100, readOnly: true },",
                "    { key: 'departmentHead', title: '학부(과)장', type: 'text', width: 110, readOnly: true },",
                "    { key: 'scholarship', title: '장학', type: 'text', width: 90, readOnly: true },",
                "    { key: 'registration', title: '등록', type: 'text', width: 90, readOnly: true },",
                "    { key: 'counseling', title: '상담', type: 'text', width: 90, readOnly: true },",
                "    { key: 'academicAffairs', title: '교무처', type: 'text', width: 90, readOnly: true }",
                "  ]",
                "});"
            ]
        },
        {
            id: "column-style", group: "Style", name: "Column Style",
            title: "Column Style", subtitle: "Header/Cell style per column",
            notes: [
                "Set column-level style with className, headerClassName, cellStyle, headerStyle.",
                "Useful when specific columns need visual emphasis (amount, status, note columns).",
                "Works with frozen columns and sticky rows together."
            ],
            code: [
                "AiGrid.createGrid({",
                "  columns: [",
                "    { key: 'number', className: 'aigrid-col-cell-amber', headerClassName: 'aigrid-col-header-amber', cellStyle: { textAlign: 'right' } },",
                "    { key: 'text', className: 'aigrid-col-cell-sky', headerClassName: 'aigrid-col-header-sky' }",
                "  ]",
                "});"
            ],
            build: function () {
                var cols = baseColumns();
                for (var i = 0; i < cols.length; i++) {
                    if (cols[i].key === "text") {
                        cols[i].className = "aigrid-col-cell-sky";
                        cols[i].headerClassName = "aigrid-col-header-sky";
                        cols[i].headerStyle = { textAlign: "left" };
                    } else if (cols[i].key === "number") {
                        cols[i].className = "aigrid-col-cell-amber";
                        cols[i].headerClassName = "aigrid-col-header-amber";
                        cols[i].cellStyle = { textAlign: "right" };
                        cols[i].headerStyle = { textAlign: "right" };
                    } else if (cols[i].key === "multitext") {
                        cols[i].className = "aigrid-col-cell-muted";
                    }
                }
                return localSampleConfig(
                    "Column Style",
                    "Column-level visual style customization",
                    {
                        stickyHeader: true,
                        columnResize: true,
                        frozenColumns: 1
                    },
                    {
                        columns: cols
                    }
                );
            }
        },
        {
            id: "status-color", group: "Style", name: "Status Color",
            title: "Status Color", subtitle: "State-based color via colCss/format",
            notes: [
                "GridAi-like colCss callback is supported: return class name by row state.",
                "status column uses good/warning class.",
                "dayBefore(%) and dayBefore(KRW) use up/down class by sign."
            ],
            code: [
                "AiGrid.createGrid({",
                "  columns: [",
                "    { key: 'status', colCss: function (row) { return row.status === '좋음' ? 'good' : 'warning'; } },",
                "    { key: 'dayBeforePercent', colCss: function (row) { return String(row.dayBeforePercent).indexOf('-') === 0 ? 'down' : 'up'; } }",
                "  ]",
                "});"
            ],
            build: function () {
                return {
                    mount: "#gridMount",
                    title: "Status Color",
                    toolbarText: "State-based color styling",
                    dataSource: statusColorRows(),
                    features: { selection: true, editing: false, copyPaste: true, rowDrag: false, stickyHeader: true, columnResize: true },
                    columns: [
                        {
                            key: "status", title: "평가상태", type: "text", width: 110, align: "center",
                            colCss: function (row) { return row.status === "좋음" ? "good" : (row.status === "주의" ? "warning" : ""); }
                        },
                        { key: "name", title: "한글명", type: "text", width: 110, align: "center", readOnly: true },
                        {
                            key: "nowCost", title: "현재가", type: "number", width: 120, align: "right", readOnly: true,
                            format: function (value) { return Number(value || 0).toLocaleString() + " KRW"; }
                        },
                        {
                            key: "dayBeforePercent", title: "전일대비(%)", type: "text", width: 110, align: "right", readOnly: true,
                            format: function (value) {
                                var txt = String(value || "0");
                                return txt.indexOf("-") === 0 ? (txt + "%") : ("+" + txt + "%");
                            },
                            colCss: function (row) {
                                var txt = String(row.dayBeforePercent || "0");
                                return txt.indexOf("-") === 0 ? "down" : "up";
                            }
                        },
                        {
                            key: "dayBeforeCost", title: "전일대비(KRW)", type: "text", width: 120, align: "right", readOnly: true,
                            colCss: function (row) {
                                var txt = String(row.dayBeforeCost || "");
                                return txt.indexOf("▼") === 0 ? "down" : "up";
                            }
                        },
                        {
                            key: "highCost", title: "고가", type: "number", width: 110, align: "right", readOnly: true,
                            format: function (value) { return Number(value || 0).toLocaleString(); }
                        },
                        {
                            key: "lowCost", title: "저가", type: "number", width: 110, align: "right", readOnly: true,
                            format: function (value) { return Number(value || 0).toLocaleString(); }
                        },
                        {
                            key: "tradingVolume", title: "거래량(24H)", type: "text", width: 180, align: "right", readOnly: true,
                            format: function (value) { return String(value || ""); }
                        },
                        {
                            key: "tradingValue", title: "거래대금(24H)", type: "number", width: 180, align: "right", readOnly: true,
                            format: function (value) { return Number(value || 0).toLocaleString() + " KRW"; }
                        }
                    ]
                };
            },
            defaultJs: [
                "var rows = [",
                "  { status: '좋음', name: '비트코인', nowCost: 143200000, dayBeforePercent: '1.42', dayBeforeCost: '▲2,000,000', highCost: 145500000, lowCost: 140800000, tradingVolume: '2,340 BTC', tradingValue: 335000000000 },",
                "  { status: '주의', name: '이더리움', nowCost: 5100000, dayBeforePercent: '-0.88', dayBeforeCost: '▼45,000', highCost: 5200000, lowCost: 5030000, tradingVolume: '18,200 ETH', tradingValue: 92800000000 },",
                "  { status: '좋음', name: '리플', nowCost: 910, dayBeforePercent: '2.11', dayBeforeCost: '▲19', highCost: 938, lowCost: 880, tradingVolume: '12,300,000 XRP', tradingValue: 11200000000 },",
                "  { status: '주의', name: '솔라나', nowCost: 236000, dayBeforePercent: '-1.36', dayBeforeCost: '▼3,200', highCost: 243000, lowCost: 231000, tradingVolume: '420,000 SOL', tradingValue: 9880000000 },",
                "  { status: '좋음', name: '도지코인', nowCost: 278, dayBeforePercent: '0.73', dayBeforeCost: '▲2', highCost: 284, lowCost: 272, tradingVolume: '86,000,000 DOGE', tradingValue: 23900000000 },",
                "  { status: '주의', name: '에이다', nowCost: 645, dayBeforePercent: '-2.02', dayBeforeCost: '▼13', highCost: 672, lowCost: 638, tradingVolume: '25,200,000 ADA', tradingValue: 16200000000 },",
                "  { status: '좋음', name: '아발란체', nowCost: 51800, dayBeforePercent: '1.04', dayBeforeCost: '▲530', highCost: 52600, lowCost: 50400, tradingVolume: '980,000 AVAX', tradingValue: 5070000000 },",
                "  { status: '주의', name: '폴카닷', nowCost: 12900, dayBeforePercent: '-0.51', dayBeforeCost: '▼66', highCost: 13150, lowCost: 12740, tradingVolume: '3,600,000 DOT', tradingValue: 4630000000 }",
                "];",
                "",
                "return AiGrid.createGrid({",
                "  mount: '#gridMount',",
                "  title: 'Status Color',",
                "  toolbarText: 'State-based color styling',",
                "  dataSource: rows,",
                "  features: { selection: true, editing: false, copyPaste: true, rowDrag: false, stickyHeader: true, columnResize: true },",
                "  columns: [",
                "    { key: 'status', title: '평가상태', type: 'text', align: 'center', width: 110, colCss: function (row) { return row.status === '좋음' ? 'good' : (row.status === '주의' ? 'warning' : ''); } },",
                "    { key: 'name', title: '한글명', type: 'text', align: 'center', width: 110, readOnly: true },",
                "    { key: 'nowCost', title: '현재가', type: 'number', align: 'right', width: 120, readOnly: true, format: function (v) { return Number(v || 0).toLocaleString() + ' KRW'; } },",
                "    { key: 'dayBeforePercent', title: '전일대비(%)', type: 'text', align: 'right', width: 110, readOnly: true, format: function (v) { var t = String(v || '0'); return t.indexOf('-') === 0 ? (t + '%') : ('+' + t + '%'); }, colCss: function (row) { var t = String(row.dayBeforePercent || '0'); return t.indexOf('-') === 0 ? 'down' : 'up'; } },",
                "    { key: 'dayBeforeCost', title: '전일대비(KRW)', type: 'text', align: 'right', width: 120, readOnly: true, colCss: function (row) { return String(row.dayBeforeCost || '').indexOf('▼') === 0 ? 'down' : 'up'; } },",
                "    { key: 'highCost', title: '고가', type: 'number', align: 'right', width: 110, readOnly: true, format: function (v) { return Number(v || 0).toLocaleString(); } },",
                "    { key: 'lowCost', title: '저가', type: 'number', align: 'right', width: 110, readOnly: true, format: function (v) { return Number(v || 0).toLocaleString(); } },",
                "    { key: 'tradingVolume', title: '거래량(24H)', type: 'text', align: 'right', width: 180, readOnly: true },",
                "    { key: 'tradingValue', title: '거래대금(24H)', type: 'number', align: 'right', width: 180, readOnly: true, format: function (v) { return Number(v || 0).toLocaleString() + ' KRW'; } }",
                "  ]",
                "});"
            ]
        },
        {
            id: "merge-row-col", group: "Style", name: "Merge Row & Col",
            title: "Merge Row & Col", subtitle: "Merge same values vertically/horizontally",
            notes: [
                "Column option mergeRow supports true or function(row) merge key.",
                "Column option mergeColumn supports horizontal merge for adjacent same-value cells.",
                "This demo applies row merge to status columns and column merge to 검사일/확진일.",
                "Merged cells are centered and include background/text color styling via colCss classes."
            ],
            code: [
                "AiGrid.createGrid({",
                "  mergeRow: true,",
                "  mergeColumn: true,",
                "  columns: [",
                "    { key: 'seq', mergeRow: true },",
                "    { key: 'rstat', mergeRow: function (row) { return row.seq + '.' + row.rstat; } },",
                "    { key: 'progress', mergeRow: true, align: 'center', valign: 'center',",
                "      colCss: function (row) {",
                "        if (row.progress === '완료') return 'merge-cell-progress-complete merge-cell-center';",
                "        if (row.progress === '점검중') return 'merge-cell-progress-review merge-cell-center';",
                "        return 'merge-cell-progress-wait merge-cell-center';",
                "      }",
                "    },",
                "    { key: 'pcr1', mergeRow: true, mergeColumn: true, align: 'center', valign: 'center', colCss: 'merge-cell-date merge-cell-center' },",
                "    { key: 'pcr2', mergeRow: true, mergeColumn: true, align: 'center', valign: 'center', colCss: 'merge-cell-date merge-cell-center' }",
                "  ]",
                "});"
            ],
            build: function () {
                return {
                    mount: "#gridMount",
                    title: "Merge Row & Col",
                    toolbarText: "RowSpan + ColSpan merge",
                    dataSource: mergeSampleRows(),
                    features: { selection: true, editing: false, copyPaste: true, rowDrag: false, stickyHeader: true, columnResize: true },
                    mergeRow: true,
                    mergeColumn: true,
                    columns: [
                        { key: "seq", title: "순번", type: "number", width: 80, align: "center", valign: "center", mergeRow: true },
                        {
                            key: "rstat", title: "보고상태", type: "text", width: 110, align: "center", valign: "center",
                            mergeRow: function (row) { return row.seq + "." + row.rstat; }
                        },
                        {
                            key: "epidinvest", title: "역학조사여부", type: "text", width: 120, align: "center", valign: "center",
                            mergeRow: function (row) { return row.seq + "." + row.rstat + "." + row.epidinvest; }
                        },
                        {
                            key: "magorder", title: "확대차수", type: "text", width: 110, align: "center", valign: "center",
                            mergeRow: function (row) { return row.seq + "." + row.rstat + "." + row.epidinvest + "." + row.magorder; }
                        },
                        {
                            key: "progress", title: "진행상태", type: "text", width: 120, align: "center", valign: "center", mergeRow: true,
                            colCss: function (row) {
                                if (row.progress === "완료") return "merge-cell-progress-complete merge-cell-center";
                                if (row.progress === "점검중") return "merge-cell-progress-review merge-cell-center";
                                return "merge-cell-progress-wait merge-cell-center";
                            }
                        },
                        { key: "pcr1", title: "검사일", type: "text", width: 110, align: "center", valign: "center", mergeRow: true, mergeColumn: true, colCss: "merge-cell-date merge-cell-center" },
                        { key: "pcr2", title: "확진일", type: "text", width: 110, align: "center", valign: "center", mergeRow: true, mergeColumn: true, colCss: "merge-cell-date merge-cell-center" },
                        { key: "healthCenter", title: "보건소명", type: "text", width: 240, align: "center", valign: "center", mergeRow: true, colCss: "merge-cell-center" },
                        { key: "contactes", title: "접촉자수", type: "number", width: 100, align: "center", valign: "center", mergeRow: true, colCss: "merge-cell-center" }
                    ]
                };
            },
            defaultJs: [
                "var rows = [",
                "  { seq: 1, rstat: '보고완료', epidinvest: 'Y', magorder: '1차', progress: '진행중', pcr1: '2026-04-01', pcr2: '2026-04-01', healthCenter: '강남구 보건소', contactes: 12 },",
                "  { seq: 1, rstat: '보고완료', epidinvest: 'Y', magorder: '1차', progress: '진행중', pcr1: '2026-04-01', pcr2: '2026-04-01', healthCenter: '강남구 보건소', contactes: 12 },",
                "  { seq: 1, rstat: '보고완료', epidinvest: 'Y', magorder: '2차', progress: '점검중', pcr1: '2026-04-03', pcr2: '2026-04-05', healthCenter: '강남구 보건소', contactes: 7 },",
                "  { seq: 1, rstat: '보고완료', epidinvest: 'N', magorder: '2차', progress: '점검중', pcr1: '2026-04-03', pcr2: '2026-04-05', healthCenter: '강남구 보건소', contactes: 7 },",
                "  { seq: 2, rstat: '보고중', epidinvest: 'Y', magorder: '1차', progress: '진행중', pcr1: '2026-04-02', pcr2: '2026-04-02', healthCenter: '서초구 보건소', contactes: 20 },",
                "  { seq: 2, rstat: '보고중', epidinvest: 'Y', magorder: '1차', progress: '진행중', pcr1: '2026-04-02', pcr2: '2026-04-02', healthCenter: '서초구 보건소', contactes: 20 },",
                "  { seq: 2, rstat: '보고중', epidinvest: 'Y', magorder: '2차', progress: '완료', pcr1: '2026-04-06', pcr2: '2026-04-06', healthCenter: '서초구 보건소', contactes: 5 },",
                "  { seq: 2, rstat: '보고중', epidinvest: 'N', magorder: '2차', progress: '완료', pcr1: '2026-04-06', pcr2: '2026-04-06', healthCenter: '서초구 보건소', contactes: 5 }",
                "];",
                "",
                "return AiGrid.createGrid({",
                "  mount: '#gridMount',",
                "  title: 'Merge Row & Col',",
                "  toolbarText: 'RowSpan + ColSpan merge',",
                "  dataSource: rows,",
                "  mergeRow: true,",
                "  mergeColumn: true,",
                "  features: { selection: true, editing: false, copyPaste: true, rowDrag: false, stickyHeader: true, columnResize: true },",
                "  columns: [",
                "    { key: 'seq', title: '순번', type: 'number', width: 80, align: 'center', valign: 'center', mergeRow: true },",
                "    { key: 'rstat', title: '보고상태', type: 'text', width: 110, align: 'center', valign: 'center', mergeRow: function (row) { return row.seq + '.' + row.rstat; } },",
                "    { key: 'epidinvest', title: '역학조사여부', type: 'text', width: 120, align: 'center', valign: 'center', mergeRow: function (row) { return row.seq + '.' + row.rstat + '.' + row.epidinvest; } },",
                "    { key: 'magorder', title: '확대차수', type: 'text', width: 110, align: 'center', valign: 'center', mergeRow: function (row) { return row.seq + '.' + row.rstat + '.' + row.epidinvest + '.' + row.magorder; } },",
                "    { key: 'progress', title: '진행상태', type: 'text', width: 120, align: 'center', valign: 'center', mergeRow: true, colCss: function (row) { if (row.progress === '완료') return 'merge-cell-progress-complete merge-cell-center'; if (row.progress === '점검중') return 'merge-cell-progress-review merge-cell-center'; return 'merge-cell-progress-wait merge-cell-center'; } },",
                "    { key: 'pcr1', title: '검사일', type: 'text', width: 110, align: 'center', valign: 'center', mergeRow: true, mergeColumn: true, colCss: 'merge-cell-date merge-cell-center' },",
                "    { key: 'pcr2', title: '확진일', type: 'text', width: 110, align: 'center', valign: 'center', mergeRow: true, mergeColumn: true, colCss: 'merge-cell-date merge-cell-center' },",
                "    { key: 'healthCenter', title: '보건소명', type: 'text', width: 240, align: 'center', valign: 'center', mergeRow: true, colCss: 'merge-cell-center' },",
                "    { key: 'contactes', title: '접촉자수', type: 'number', width: 100, align: 'center', valign: 'center', mergeRow: true, colCss: 'merge-cell-center' }",
                "  ]",
                "});"
            ]
        },
        {
            id: "row-style", group: "Style", name: "Row Style",
            title: "Row Style", subtitle: "Conditional row-level styling (GridAi rowcss style)",
            notes: [
                "Apply row classes by condition (rowStyleRules).",
                "Multiple conditions are stacked by priority to show distinct row colors.",
                "Demo data is fixed so all style conditions are visible immediately."
            ],
            code: [
                "AiGrid.createGrid({",
                "  features: { stickyHeader: true, columnResize: true, sorting: true },",
                "  dataSource: [/* fixed demo rows */],",
                "  rowStyleRules: [",
                "    { className: 'aigrid-row-style-alert', when: function (row) { return Number(row.number) >= 950; } },",
                "    { className: 'aigrid-row-style-warn', when: function (row) { return row.check === 'F'; } },",
                "    { className: 'aigrid-row-style-vip', when: function (row) { return String(row.text).indexOf('VIP') >= 0; } },",
                "    { className: 'aigrid-row-style-info', when: function (row) { return row.continent === 'EU'; } },",
                "    { className: 'aigrid-row-style-ok', when: function () { return true; } }",
                "  ]",
                "});"
            ],
            build: function () {
                return localSampleConfig(
                    "Row Style",
                    "Condition-based row CSS",
                    {
                        stickyHeader: true,
                        columnResize: true,
                        sorting: true,
                        rowDrag: false
                    },
                    {
                        dataSource: rowStyleDemoRows(),
                        columns: [
                            { key: "rowno", title: "#", type: "rowno", width: 70, readOnly: true },
                            { key: "text", title: "Text", type: "text", width: 120 },
                            { key: "name", title: "Name", type: "text", width: 110 },
                            { key: "number", title: "Number", type: "number", width: 100 },
                            { key: "check", title: "Check", type: "check", width: 90 },
                            { key: "radio", title: "Radio", type: "radio", width: 110 },
                            { key: "date", title: "Date", type: "date", width: 120 },
                            { key: "multitext", title: "Multitext", type: "multitext", width: 260 },
                            { key: "continent", title: "Continent", type: "text", width: 120 },
                            { key: "nation", title: "Nation", type: "text", width: 100 }
                        ],
                        rowStyleRules: [
                            {
                                className: "aigrid-row-style-alert",
                                when: function (row) { return Number(row.number || 0) >= 950; }
                            },
                            {
                                className: "aigrid-row-style-warn",
                                when: function (row) { return String(row.check || "") === "F"; }
                            },
                            {
                                className: "aigrid-row-style-vip",
                                when: function (row) { return String(row.text || "").indexOf("VIP") >= 0; }
                            },
                            {
                                className: "aigrid-row-style-info",
                                when: function (row) { return String(row.continent || "") === "EU"; }
                            },
                            {
                                className: "aigrid-row-style-ok",
                                when: function () { return true; }
                            }
                        ]
                    }
                );
            },
            defaultJs: [
                "// Row CSS demo: priority-based row style rules.",
                "var rows = [",
                "  { text: 'VIP Rush', name: 'Kim Minseo', number: 980, check: 'T', radio: 'S', date: '2026-04-01', multitext: 'Priority delivery', continent: 'AS', nation: 'KR' },",
                "  { text: 'Audit Hold', name: 'Lee Jiwon', number: 860, check: 'F', radio: 'F', date: '2026-03-18', multitext: 'Pending review', continent: 'EU', nation: 'DE' },",
                "  { text: 'Standard', name: 'Park Dohyun', number: 620, check: 'T', radio: 'S', date: '2026-03-06', multitext: 'Normal flow', continent: 'AS', nation: 'KR' },",
                "  { text: 'EU Transit', name: 'Choi Yuna', number: 540, check: 'T', radio: 'F', date: '2026-02-25', multitext: 'Route update', continent: 'EU', nation: 'FR' },",
                "  { text: 'VIP Renewal', name: 'Jung Seongho', number: 930, check: 'T', radio: 'S', date: '2026-04-08', multitext: 'Contract extension', continent: 'NA', nation: 'US' },",
                "  { text: 'Risk Followup', name: 'Han Soyeon', number: 790, check: 'F', radio: 'U', date: '2026-03-30', multitext: 'Requires manager signoff', continent: 'AS', nation: 'JP' },",
                "  { text: 'Baseline', name: 'Yoon Taekyung', number: 470, check: 'T', radio: 'S', date: '2026-02-14', multitext: 'Stable process', continent: 'SA', nation: 'BR' },",
                "  { text: 'EU Support', name: 'Seo Arin', number: 680, check: 'T', radio: 'F', date: '2026-03-21', multitext: 'Regional support', continent: 'EU', nation: 'NL' },",
                "  { text: 'Hotfix', name: 'Bae Minjae', number: 995, check: 'F', radio: 'U', date: '2026-04-11', multitext: 'Urgent hotfix batch', continent: 'AS', nation: 'KR' },",
                "  { text: 'Routine', name: 'Oh Jisoo', number: 580, check: 'T', radio: 'S', date: '2026-03-12', multitext: 'Routine maintenance', continent: 'OC', nation: 'AU' }",
                "];",
                "",
                "return AiGrid.createGrid({",
                "  mount: '#gridMount',",
                "  title: 'Row Style',",
                "  toolbarText: 'Condition-based row CSS',",
                "  dataSource: rows,",
                "  features: { selection: true, editing: true, copyPaste: true, rowDrag: false, stickyHeader: true, columnResize: true, sorting: true },",
                "  rowStyleRules: [",
                "    { className: 'aigrid-row-style-alert', when: function (row) { return Number(row.number || 0) >= 950; } },",
                "    { className: 'aigrid-row-style-warn', when: function (row) { return String(row.check || '') === 'F'; } },",
                "    { className: 'aigrid-row-style-vip', when: function (row) { return String(row.text || '').indexOf('VIP') >= 0; } },",
                "    { className: 'aigrid-row-style-info', when: function (row) { return String(row.continent || '') === 'EU'; } },",
                "    { className: 'aigrid-row-style-ok', when: function () { return true; } }",
                "  ],",
                "  columns: [",
                "    { key: 'rowno', title: '#', type: 'rowno', width: 70, readOnly: true },",
                "    { key: 'text', title: 'Text', type: 'text', width: 120 },",
                "    { key: 'name', title: 'Name', type: 'text', width: 110 },",
                "    { key: 'number', title: 'Number', type: 'number', width: 100 },",
                "    { key: 'check', title: 'Check', type: 'check', width: 90 },",
                "    { key: 'radio', title: 'Radio', type: 'radio', width: 110 },",
                "    { key: 'date', title: 'Date', type: 'date', width: 120 },",
                "    { key: 'multitext', title: 'Multitext', type: 'multitext', width: 260 },",
                "    { key: 'continent', title: 'Continent', type: 'text', width: 120 },",
                "    { key: 'nation', title: 'Nation', type: 'text', width: 100 }",
                "  ]",
                "});"
            ]
        },
        {
            id: "sticky-rows", group: "Style", name: "Sticky Rows",
            title: "Sticky Rows", subtitle: "Pin specific rows to top/bottom while scrolling",
            notes: [
                "Set features.stickyRows = true to enable row pinning.",
                "stickyRows.top pins rows to top in listed order.",
                "stickyRows.bottom pins rows to bottom (supports negative index like -1).",
                "This sample uses 80 rows so vertical scroll is always visible."
            ],
            code: [
                "AiGrid.createGrid({",
                "  features: { stickyHeader: true, stickyFooter: true, summary: true, stickyRows: true },",
                "  stickyRows: { top: [0, 2], bottom: [-1] }",
                "});"
            ],
            build: function () {
                return localSampleConfig(
                    "Sticky Rows",
                    "Top/Bottom pinned rows during vertical scroll",
                    {
                        stickyHeader: true,
                        stickyFooter: true,
                        summary: true,
                        stickyRows: true,
                        columnResize: true,
                        rowDrag: false
                    },
                    {
                        dataSource: stickyRowsDemoRows(),
                        stickyRows: { top: [0, 2], bottom: [-1] },
                        columns: [
                            { key: "rowno", title: "#", type: "rowno", width: 70, readOnly: true },
                            { key: "text", title: "Text", type: "text", width: 130 },
                            { key: "name", title: "Name", type: "text", width: 120 },
                            { key: "number", title: "Number", type: "number", width: 100 },
                            { key: "check", title: "Check", type: "check", width: 90 },
                            { key: "radio", title: "Radio", type: "radio", width: 110 },
                            { key: "date", title: "Date", type: "date", width: 120 },
                            { key: "multitext", title: "Multitext", type: "multitext", width: 260 },
                            { key: "continent", title: "Continent", type: "text", width: 120 },
                            { key: "nation", title: "Nation", type: "text", width: 100 }
                        ]
                    }
                );
            }
        },
        {
            id: "grouping", group: "Data", name: "Grouping",
            title: "Grouping", subtitle: "Drag header to top zone for grouping",
            notes: [
                "헤더를 상단 그룹 영역으로 드래그하면 그룹 필드가 추가됩니다.",
                "그룹 토큰의 × 버튼으로 개별 해제, 해제 버튼으로 전체 해제할 수 있습니다.",
                "그룹 토큰을 드래그해 순서를 변경하면 그룹 계층 순서가 즉시 반영됩니다.",
                "토큰 포커스 상태에서 좌/우/Home/End/Delete 키로 순서 변경/해제도 가능합니다.",
                "초기에는 그룹 미적용 상태로 시작하며, 필요할 때만 그룹핑합니다."
            ],
            code: [
                "AiGrid.createGrid({",
                "  groupable: true,",
                "  features: { grouping: true, stickyHeader: true },",
                "  grouping: { fields: [] }",
                "});"
            ],
            build: function () {
                return localSampleConfig(
                    "Phase 3 - Grouping",
                    "Header drag-drop grouping",
                    { editing: false, copyPaste: false, rowDrag: false, stickyHeader: true, frozenColumns: 1, grouping: true },
                    { groupable: true, grouping: { fields: [] } }
                );
            }
        },
        {
            id: "tree", group: "Tree", name: "Tree View",
            title: "Tree View", subtitle: "Hierarchy with expand/collapse",
            notes: [
                "Dataset: /api/v1/demo/tree-data",
                "Tree mode with id/parent/label mapping",
                "Useful for hierarchical navigation checks"
            ],
            code: [
                "AiGrid.createGrid({",
                "  dataSource: { url: '/api/v1/demo/tree-data', rowsPath: 'treeData' },",
                "  tree: { idField: 'id', parentField: 'parentId', labelField: 'name' },",
                "  features: { tree: true, stickyHeader: true }",
                "});"
            ],
            build: function () {
                return {
                    mount: "#gridMount",
                    title: "Phase 4 - Tree View",
                    toolbarText: "Hierarchy navigation",
                    dataSource: treeSource(),
                    tree: { idField: "id", parentField: "parentId", labelField: "name" },
                    features: { selection: true, tree: true, stickyHeader: true, frozenColumns: 1 },
                    columns: [
                        { key: "rowno", title: "#", type: "rowno", width: 70, readOnly: true },
                        { key: "name", title: "Name", type: "text", width: 260 },
                        { key: "type", title: "Type", type: "text", width: 120 },
                        { key: "owner", title: "Owner", type: "text", width: 120 },
                        { key: "status", title: "Status", type: "text", width: 110 },
                        { key: "budget", title: "Budget", type: "number", width: 120 }
                    ]
                };
            }
        },
        {
            id: "data-exchange", group: "Data", name: "Data Exchange",
            title: "Data Exchange", subtitle: "CSV/Excel-ready configuration baseline",
            notes: [
                "Local sample dataset with editable fields",
                "Use as baseline for import/export tooling integration",
                "Sticky header enabled for long row operations"
            ],
            code: [
                "AiGrid.createGrid({",
                "  features: { editing: true, copyPaste: true, stickyHeader: true },",
                "  columns: [/* exchange-friendly field set */]",
                "});"
            ],
            build: function () {
                return localSampleConfig("Phase 5 - Data Exchange", "CSV/Excel import-export baseline", {
                    stickyHeader: true,
                    rowDrag: false,
                    frozenColumns: 1
                });
            }
        },
        {
            id: "typed-dom-renderer", group: "Extension", name: "Typed DOM Renderer",
            title: "Typed DOM Renderer", subtitle: "Render rich cells with Node-returning functions",
            notes: [
                "Use a cellTemplate function that returns a Node or DocumentFragment.",
                "Set untrusted values with textContent and allowlist URL protocols and CSS classes.",
                "String HTML templates are intentionally rejected by AiGrid 0.1.1."
            ],
            code: [
                "function renderTask(row) {",
                "  const title = document.createElement('strong');",
                "  title.textContent = row.task;",
                "  return title;",
                "}",
                "AiGrid.createGrid({",
                "  columns: [",
                "    { key: 'task', cellTemplate: renderTask }",
                "  ]",
                "});"
            ],
            defaultHtml: [
                "<style>",
                ".inner-card{display:flex;flex-direction:column;gap:6px;line-height:1.2;}",
                ".inner-title{font-weight:700;color:#102341;}",
                ".inner-meta{display:flex;align-items:center;gap:8px;font-size:12px;color:#4a5f83;}",
                ".inner-priority{padding:2px 7px;border-radius:999px;font-weight:700;font-size:11px;}",
                ".inner-risk-high{background:#ffe1e1;color:#9f1d1d;}",
                ".inner-risk-medium{background:#fff3db;color:#8a5a00;}",
                ".inner-risk-low{background:#e5f8eb;color:#1f6f3e;}",
                ".inner-tags{display:flex;gap:5px;flex-wrap:wrap;}",
                ".inner-tag{padding:2px 7px;border-radius:999px;font-size:11px;font-weight:600;border:1px solid #d8e0ee;background:#f6f8fc;color:#344763;}",
                ".tag-blue{background:#e7f0ff;color:#1d4fa3;border-color:#c8dcff;}",
                ".tag-purple{background:#efe8ff;color:#5530a3;border-color:#dccdff;}",
                ".tag-red{background:#ffe5e8;color:#9f2136;border-color:#ffc9d1;}",
                ".tag-green{background:#e5f7ea;color:#1f6f3e;border-color:#c9ebd5;}",
                ".tag-slate{background:#f1f5fa;color:#3f516c;border-color:#d9e2ef;}",
                ".inner-more{font-size:11px;color:#6a7d9a;font-weight:700;}",
                ".inner-status{display:inline-flex;align-items:center;justify-content:center;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;}",
                ".tone-progress{background:#e8f1ff;color:#2457a8;}",
                ".tone-review{background:#fff4dd;color:#986300;}",
                ".tone-done{background:#e4f6ea;color:#1c6b3a;}",
                ".inner-progress-wrap{display:flex;align-items:center;gap:8px;}",
                ".inner-progress-track{position:relative;flex:1;height:10px;background:#edf2f9;border-radius:999px;overflow:hidden;}",
                ".inner-progress-bar{position:absolute;left:0;top:0;bottom:0;border-radius:999px;}",
                ".inner-progress-bar.tone-progress{background:linear-gradient(90deg,#6ba1ff,#3570d3);}",
                ".inner-progress-bar.tone-review{background:linear-gradient(90deg,#ffc86b,#e39b2f);}",
                ".inner-progress-bar.tone-done{background:linear-gradient(90deg,#4bd08a,#229a62);}",
                ".inner-progress-text{min-width:42px;text-align:right;font-size:12px;font-weight:700;color:#243856;}",
                ".inner-template-btn{height:28px;border:1px solid #b9c9e4;border-radius:7px;background:#fff;color:#1f3f72;font-size:12px;font-weight:700;padding:0 10px;cursor:pointer;}",
                ".inner-template-btn:hover{background:#f3f7ff;}",
                "</style>",
                "<div id='gridMount'></div>"
            ].join(""),
            defaultJs: [
                "var rows = [",
                "  { id: 1001, task: 'API migration', owner: 'Kim Minseo', priority: 'High', status: 'In Progress', progress: 72, tags: [{ label: 'backend', tone: 'blue' }, { label: 'api', tone: 'purple' }, { label: 'urgent', tone: 'red' }, { label: 'sprint-2', tone: 'slate' }] },",
                "  { id: 1002, task: 'UI polish', owner: 'Lee Jiwon', priority: 'Medium', status: 'In Review', progress: 86, tags: [{ label: 'frontend', tone: 'blue' }, { label: 'accessibility', tone: 'green' }, { label: 'qa', tone: 'slate' }] },",
                "  { id: 1003, task: 'Telemetry patch', owner: 'Park Dohyun', priority: 'Low', status: 'Done', progress: 100, tags: [{ label: 'ops', tone: 'slate' }, { label: 'monitor', tone: 'green' }] },",
                "  { id: 1004, task: 'Excel export tuning', owner: 'Choi Yuna', priority: 'High', status: 'In Progress', progress: 58, tags: [{ label: 'excel', tone: 'purple' }, { label: 'formula', tone: 'blue' }, { label: 'perf', tone: 'red' }] }",
                "];",
                "",
                "function makeElement(tag, className, text) {",
                "  var element = document.createElement(tag);",
                "  if (className) element.className = className;",
                "  if (text != null) element.textContent = String(text);",
                "  return element;",
                "}",
                "function riskClass(priority) {",
                "  return priority === 'High' ? 'inner-risk-high' : priority === 'Medium' ? 'inner-risk-medium' : 'inner-risk-low';",
                "}",
                "function statusTone(status) {",
                "  return status === 'Done' ? 'tone-done' : status === 'In Review' ? 'tone-review' : 'tone-progress';",
                "}",
                "function percentValue(value) {",
                "  var n = Number(value);",
                "  if (!isFinite(n)) n = 0;",
                "  return Math.max(0, Math.min(100, n));",
                "}",
                "function renderTask(row) {",
                "  var card = makeElement('div', 'inner-card');",
                "  card.appendChild(makeElement('div', 'inner-title', row.task));",
                "  var meta = makeElement('div', 'inner-meta');",
                "  meta.appendChild(makeElement('span', '', row.owner));",
                "  meta.appendChild(makeElement('span', 'inner-priority ' + riskClass(row.priority), row.priority));",
                "  card.appendChild(meta);",
                "  var tags = makeElement('div', 'inner-tags');",
                "  (Array.isArray(row.tags) ? row.tags : []).slice(0, 3).forEach(function (tag) {",
                "    var tone = ['blue', 'purple', 'red', 'green', 'slate'].indexOf(tag.tone) >= 0 ? tag.tone : 'slate';",
                "    tags.appendChild(makeElement('span', 'inner-tag tag-' + tone, tag.label));",
                "  });",
                "  if (row.tags && row.tags.length > 3) tags.appendChild(makeElement('span', 'inner-more', '+' + (row.tags.length - 3)));",
                "  card.appendChild(tags);",
                "  return card;",
                "}",
                "function renderStatus(row) { return makeElement('span', 'inner-status ' + statusTone(row.status), row.status); }",
                "function renderProgress(row) {",
                "  var value = percentValue(row.progress);",
                "  var wrap = makeElement('div', 'inner-progress-wrap');",
                "  var track = makeElement('div', 'inner-progress-track');",
                "  var bar = makeElement('div', 'inner-progress-bar ' + statusTone(row.status));",
                "  bar.style.width = value + '%';",
                "  track.appendChild(bar); wrap.appendChild(track);",
                "  wrap.appendChild(makeElement('span', 'inner-progress-text', value + '%'));",
                "  return wrap;",
                "}",
                "function renderAction(row) {",
                "  var button = makeElement('button', 'inner-template-btn', 'Toggle');",
                "  button.type = 'button'; button.dataset.id = String(row.id);",
                "  return button;",
                "}",
                "",
                "var gridPromise = AiGrid.createGrid({",
                "  mount: '#gridMount',",
                "  title: 'Typed DOM Renderer',",
                "  toolbarText: 'Node-returning cellTemplate interaction',",
                "  dataSource: rows,",
                "  features: { selection: true, editing: false, copyPaste: true, stickyHeader: true, columnResize: true, rowDrag: false },",
                "  columns: [",
                "    { key: 'rowno', title: '#', type: 'rowno', width: 70, readOnly: true },",
                "    { key: 'task', title: 'Task', width: 320, readOnly: true, cellTemplate: renderTask },",
                "    { key: 'status', title: 'Status', width: 120, align: 'center', readOnly: true, cellTemplate: renderStatus },",
                "    { key: 'progress', title: 'Progress', width: 220, align: 'left', readOnly: true, cellTemplate: renderProgress },",
                "    { key: 'actions', title: 'Action', width: 120, align: 'center', readOnly: true, cellTemplate: renderAction }",
                "  ]",
                "});",
                "",
                "Promise.resolve(gridPromise).then(function (grid) {",
                "  var mount = document.getElementById('gridMount');",
                "  if (!mount || !grid) return;",
                "  if (mount._innerTemplateBound) return;",
                "  mount._innerTemplateBound = true;",
                "",
                "  mount.addEventListener('click', function (e) {",
                "    var btn = e.target.closest('.inner-template-btn');",
                "    if (!btn) return;",
                "    e.preventDefault();",
                "    e.stopPropagation();",
                "",
                "    var id = Number(btn.getAttribute('data-id'));",
                "    var row = null;",
                "    for (var i = 0; i < grid.rows.length; i++) {",
                "      if (Number(grid.rows[i].id) === id) { row = grid.rows[i]; break; }",
                "    }",
                "    if (!row) return;",
                "",
                "    if (row.status === 'Done') {",
                "      row.status = 'In Progress';",
                "      row.progress = 65;",
                "      row.priority = 'High';",
                "      row.tags = [{ label: 'rollback', tone: 'red' }, { label: 'follow-up', tone: 'purple' }, { label: 'backend', tone: 'blue' }];",
                "    } else if (row.status === 'In Review') {",
                "      row.status = 'Done';",
                "      row.progress = 100;",
                "      row.priority = 'Low';",
                "      row.tags = [{ label: 'released', tone: 'green' }, { label: 'monitor', tone: 'slate' }];",
                "    } else {",
                "      row.status = 'In Review';",
                "      row.progress = 90;",
                "      row.priority = 'Medium';",
                "      row.tags = [{ label: 'qa', tone: 'slate' }, { label: 'ux-check', tone: 'blue' }, { label: 'ready', tone: 'green' }];",
                "    }",
                "",
                "    grid.render();",
                "  });",
                "});",
                "",
                "return gridPromise;"
            ]
        },
        {
            id: "excel-export-formula", group: "Extension", name: "Excel Download (Formula)",
            title: "Excel Download", subtitle: "Export values + formulas + merge/footer/style",
            notes: [
                "엑셀 다운로드 시 수식 포함(includeFormula) 내보내기를 지원합니다.",
                "헤더/푸터(includeHeader/includeFooter), 병합 유지(keepMerge) 옵션을 함께 확인할 수 있습니다.",
                "cellStyle/rowStyle 콜백으로 클래스 기반 엑셀 스타일 매핑이 가능합니다."
            ],
            code: [
                "grid.exportToExcel({",
                "  fileName: '엑셀_수식_다운로드.xlsx',",
                "  includeFormula: true,",
                "  includeHeader: true,",
                "  includeFooter: true,",
                "  keepMerge: true",
                "});"
            ],
            defaultHtml: [
                "<div class='excel-export-formula-sample' style='display:flex;flex-direction:column;gap:10px;width:100%;height:100%;min-width:0;min-height:0;'>",
                "  <div style='display:flex;align-items:center;gap:8px;flex:0 0 auto;'>",
                "    <button id='btnExcelExportFormula' type='button' style='height:32px;border:1px solid #c7d2e5;border-radius:6px;background:#fff;padding:0 12px;font-weight:700;cursor:pointer;'>Excel Download (Formula)</button>",
                "    <span style='color:#5a6782;font-size:12px;'>수식/병합/푸터 포함 엑셀 다운로드</span>",
                "  </div>",
                "  <div id='gridMount' style='flex:1 1 auto;width:100%;min-width:0;min-height:0;'></div>",
                "</div>"
            ].join(""),
            defaultJs: [
                "var rows = [",
                "  { class: '1반', name: '김민서', korean: 96, english: 91, math: 88 },",
                "  { class: '1반', name: '이지원', korean: 82, english: 77, math: 90 },",
                "  { class: '1반', name: '박도현', korean: 73, english: 85, math: 79 },",
                "  { class: '2반', name: '최유나', korean: 65, english: 71, math: 68 },",
                "  { class: '2반', name: '정성호', korean: 92, english: 88, math: 95 },",
                "  { class: '2반', name: '한소연', korean: 58, english: 62, math: 74 },",
                "  { class: '3반', name: '윤태경', korean: 87, english: 93, math: 84 },",
                "  { class: '3반', name: '서아린', korean: 79, english: 81, math: 77 },",
                "  { class: '3반', name: '배민재', korean: 98, english: 96, math: 97 },",
                "  { class: '3반', name: '오지수', korean: 69, english: 66, math: 72 }",
                "];",
                "for (var i = 0; i < rows.length; i++) {",
                "  var sum = (Number(rows[i].korean) || 0) + (Number(rows[i].english) || 0) + (Number(rows[i].math) || 0);",
                "  var avg = sum / 3;",
                "  rows[i].sum = sum;",
                "  rows[i].avg = avg;",
                "  rows[i].grade = avg >= 90 ? 'A' : (avg >= 80 ? 'B' : (avg >= 70 ? 'C' : (avg >= 60 ? 'D' : 'F')));",
                "}",
                "",
                "var gridPromise = AiGrid.createGrid({",
                "  mount: '#gridMount',",
                "  title: 'Excel Download (Formula)',",
                "  toolbarText: 'Formula + merge + footer export',",
                "  dataSource: rows,",
                "  mergeRow: true,",
                "  groupable: true,",
                "  features: { selection: true, editing: true, copyPaste: true, rowDrag: false, stickyHeader: true, stickyFooter: true, summary: true, grouping: true, columnResize: true },",
                "  grouping: { fields: [] },",
                "  summary: {",
                "    labelColumn: 'name',",
                "    rows: [",
                "      { label: '합계', kind: 'total', columns: { korean: 'sum', english: 'sum', math: 'sum', sum: 'sum', avg: 'avg' }, values: { grade: function (allRows) { var aCount = 0; for (var i = 0; i < allRows.length; i++) if (allRows[i].grade === 'A') aCount++; return 'A등급 ' + aCount + '명'; } } }",
                "    ]",
                "  },",
                "  excelExport: {",
                "    fileName: '엑셀_수식_다운로드.xlsx',",
                "    includeFormula: true,",
                "    keepMerge: true,",
                "    includeHeader: true,",
                "    includeFooter: true,",
                "    defaultStyle: false,",
                "    autoAlignment: true,",
                "    autoClassStyle: true,",
                "    cellStyle: function (cssSet) {",
                "      var style = {};",
                "      if (cssSet.has('red') || cssSet.has('blue') || cssSet.has('bold')) {",
                "        style.font = {};",
                "        if (cssSet.has('red')) style.font.color = { rgb: 'FF0000' };",
                "        if (cssSet.has('blue')) style.font.color = { rgb: '0000FF' };",
                "        if (cssSet.has('bold')) style.font.bold = true;",
                "      }",
                "      return style;",
                "    },",
                "    rowStyle: function (cssSet) {",
                "      if (cssSet.has('a-grade')) {",
                "        return { font: { bold: true } };",
                "      }",
                "      return {};",
                "    },",
                "    cancelFunc: function () {",
                "      console.log('excel export cancelled');",
                "    }",
                "  },",
                "  rowClassName: function (row) { return row.grade === 'A' ? 'a-grade excel-row-a' : (row.grade === 'B' ? 'excel-row-b' : (row.grade === 'C' ? 'excel-row-c' : 'excel-row-df')); },",
                "  columns: [",
                "    { key: 'rowno', title: '#', type: 'rowno', width: 70, readOnly: true },",
                "    { key: 'class', title: '반', type: 'text', width: 90, align: 'center', mergeRow: true, valign: 'center', colCss: function (row) { return row.class === '1반' ? 'excel-class-a merge-cell-center bold' : (row.class === '2반' ? 'excel-class-b merge-cell-center bold' : 'excel-class-c merge-cell-center bold'); } },",
                "    { key: 'name', title: '이름', type: 'text', width: 110 },",
                "    { key: 'korean', title: '국어', type: 'number', width: 90, align: 'right' },",
                "    { key: 'english', title: '영어', type: 'number', width: 90, align: 'right' },",
                "    { key: 'math', title: '수학', type: 'number', width: 90, align: 'right' },",
                "    { key: 'sum', title: '총점', type: 'number', width: 100, align: 'right', readOnly: true, excelFormula: '={col:korean}+{col:english}+{col:math}', colCss: function (row) { return row.sum >= 280 ? 'excel-score-high red bold' : (row.sum >= 250 ? 'excel-score-mid blue bold' : 'excel-score-low bold'); } },",
                "    { key: 'avg', title: '평균', type: 'number', width: 100, align: 'right', readOnly: true, excelFormula: '={col:sum}/3' },",
                "    { key: 'grade', title: '등급', type: 'text', width: 80, align: 'center', readOnly: true, excelFormula: '=IF({col:avg}>=90,\"A\",IF({col:avg}>=80,\"B\",IF({col:avg}>=70,\"C\",IF({col:avg}>=60,\"D\",\"F\"))))', colCss: function (row) { return row.grade === 'A' ? 'excel-grade-a merge-cell-center red bold' : (row.grade === 'B' ? 'excel-grade-b merge-cell-center blue bold' : (row.grade === 'C' ? 'excel-grade-c merge-cell-center' : 'excel-grade-df merge-cell-center')); } }",
                "  ]",
                "});",
                "",
                "var btn = document.getElementById('btnExcelExportFormula');",
                "if (btn) {",
                "  btn.addEventListener('click', function () {",
                "    Promise.resolve(gridPromise).then(function (grid) {",
                "      if (grid && typeof grid.exportToExcel === 'function') {",
                "        try {",
                "          grid.exportToExcel();",
                "        } catch (err) {",
                "          alert(err && err.message ? err.message : String(err));",
                "        }",
                "      }",
                "    });",
                "  });",
                "}",
                "return gridPromise;"
            ]
        },
        {
            id: "excel-import", group: "Extension", name: "Excel Import",
            title: "Excel Import", subtitle: "Upload Excel file and populate grid rows",
            notes: [
                "엑셀 업로드 기능을 사용하여 로컬 파일을 그리드에 반영합니다.",
                "excelImport 옵션을 통해 데이터 시작 행(row.from)과 열(col.from)을 지정할 수 있습니다.",
                "데이터 내용에 따라 colCss 동적 스타일이 즉시 적용됩니다."
            ],
            code: [
                "AiGrid.createGrid({",
                "  toolBar: { left: ['excelImport'] },",
                "  excelImport: { row: { from: 2 }, col: { from: 1 } },",
                "  columns: [",
                "    { key: 'si_do', title: '시/도', colCss: function(row) { ... } },",
                "    { key: 'lib_name', title: '도서관명' }, ...",
                "  ]",
                "});"
            ],
            build: function () {
                return {
                    mount: "#gridMount",
                    title: "Excel Import",
                    toolbarText: "Upload data document to grid",
                    dataSource: [], // Init empty
                    toolBar: { left: ["excelImport", "excelExport"] },
                    excelImport: { row: { from: 2 }, col: { from: 1 } },
                    features: { selection: true, editing: true, stickyHeader: true, columnResize: true },
                    columns: [
                        {
                            key: "si_do", title: "시/도", width: 120, align: "center",
                            colCss: function (row) {
                                switch (row.si_do) {
                                    case "경기도": return "a-red";
                                    case "강원도": return "a-yellow";
                                    case "서울특별시": return "a-green";
                                    case "전라북도": return "a-purple";
                                    default: return "";
                                }
                            }
                        },
                        { key: "si_gun_gu", title: "시/군/구", width: 110, align: "center" },
                        { key: "lib_name", title: "도서관명", width: 340, align: "left" },
                        { key: "lib_type", title: "도서관유형", width: 110, align: "center" },
                        { key: "addr", title: "주소", width: 340, align: "left" },
                        { key: "lib_number", title: "전화번호", width: 130, align: "center" },
                        { key: "homepage_addr", title: "홈페이지", width: 260, align: "left" }
                    ]
                };
            }
        },
        {
            id: "state", group: "State", name: "Undo/Redo + State",
            title: "State Management", subtitle: "History and local state persistence",
            notes: [
                "Undo/redo enabled",
                "State prefix: aigrid:sample:phase6:",
                "Use after edits to verify state re-apply behavior"
            ],
            code: [
                "AiGrid.createGrid({",
                "  statePrefix: 'aigrid:sample:phase6:',",
                "  history: { max: 80 },",
                "  features: { undoRedo: true, stateManagement: true }",
                "});"
            ],
            build: function () {
                return localSampleConfig(
                    "Phase 6 - Undo/Redo and Local State",
                    "History stack + LocalStorage",
                    { stickyHeader: true, frozenColumns: 1, undoRedo: true, stateManagement: true },
                    { statePrefix: "aigrid:sample:phase6:", history: { max: 80 } }
                );
            }
        },
        {
            id: "advanced", group: "Extension", name: "Advanced Flags",
            title: "Advanced Features", subtitle: "Accessibility and render monitoring options",
            notes: [
                "a11y and perfMonitoring are enabled",
                "Undo/redo + state management kept on",
                "Can be used to verify telemetry and event stability"
            ],
            code: [
                "AiGrid.createGrid({",
                "  features: { a11y: true, perfMonitoring: true, undoRedo: true, stateManagement: true }",
                "});"
            ],
            build: function () {
                return localSampleConfig("Phase 7 - Advanced", "A11y + render monitoring", {
                    stickyHeader: true,
                    frozenColumns: 1,
                    undoRedo: true,
                    stateManagement: true,
                    a11y: true,
                    perfMonitoring: true
                }, { history: { max: 60 } });
            }
        },
        {
            id: "copy-paste", group: "Extension", name: "Copy & Paste",
            title: "Clipboard Interoperability", subtitle: "Copy/Paste between Grid and Excel",
            notes: [
                "Ctrl+C: 선택된 영역을 클립보드로 복사합니다. (Marquee 효과)",
                "Ctrl+V: 클립보드의 데이터를 현재 포커스 셀부터 붙여넣습니다. (엑셀 데이터 호환)",
                "Ctrl+X: 잘라내기 기능을 지원합니다.",
                "점선으로 표기된 복사 영역은 다른 복사 동작 전까지 유지됩니다."
            ],
            code: [
                "AiGrid.createGrid({",
                "  features: { copyPaste: true, selection: true },",
                "  // 엑셀과 호환되는 TSV 포맷 지원",
                "  // Ctrl+C / Ctrl+V 단축키 기본 활성화",
                "});"
            ],
            build: function () {
                var testData = [];
                for (var i = 1; i <= 20; i++) {
                    testData.push({ id: i, name: "User " + i, dept: (i % 3 === 0 ? "IT" : "Sales"), score: Math.floor(Math.random() * 100) });
                }
                return {
                    mount: "#gridMount",
                    title: "Copy & Paste",
                    toolbarText: "Try Copying to Excel or Pasting from Excel",
                    dataSource: testData,
                    features: { selection: true, editing: true, copyPaste: true, undoRedo: true },
                    columns: [
                        { key: "id", title: "ID", width: 60, align: "center", readOnly: true },
                        { key: "name", title: "Name", width: 150, align: "center" },
                        { key: "dept", title: "Department", width: 120, align: "center" },
                        { key: "score", title: "Score", width: 100, align: "right" }
                    ]
                };
            }
        },
        {
            id: "data-validation", group: "Data", name: "Data Validation",
            title: "Data Validation", subtitle: "Built-in validation rules and findInvalid API",
            notes: [
                "pattern, type(number), max, min, between 규칙을 지원합니다.",
                "edit.immediateValidationCheck 옵션으로 편집 즉시 검증이 가능합니다.",
                "findInvalid() API를 사용하여 오류 셀로 순차적으로 포커스 이동이 가능합니다."
            ],
            code: [
                "AiGrid.createGrid({",
                "  columns: [",
                "    { key: 'name', title: '한글명', validators: [{ rule: 'pattern', value: '^[ㄱ-ㅎㅏ-ㅣ가-힣]+$', message: '한글로 입력하세요' }] },",
                "    { key: 'korean', title: '국어', validators: [{ rule: 'type', value: 'number' }] },",
                "    { key: 'english', title: '영어', validators: [{ rule: 'max', value: 100 }] }",
                "  ]",
                "});",
                "// 오류 셀 검색 및 이동",
                "var invalid = grid.findInvalid(curRow, curCol);",
                "if (invalid) grid.moveFocus(invalid.rowIndex, invalid.column);"
            ],
            build: function () {
                var testData = ensureMinSampleRows([
                    { class: "1반", name: "Cindy", korean: "백점", english: 105, math: -10, physics: 99 },
                    { class: "1반", name: "김민서", korean: 96, english: 91, math: 88, physics: 85 },
                    { class: "2반", name: "Tom", korean: "구십일", english: 71, math: 68, physics: 40 },
                    { class: "2반", name: "정성호", korean: 92, english: 88, math: 95, physics: 92 },
                    { class: "3반", name: "봉인성123", korean: 98, english: 96, math: 97, physics: 84 }
                ], 20);
                return {
                    mount: "#gridMount",
                    title: "Data Validation",
                    toolbarText: "Integrity check with validators",
                    dataSource: testData,
                    toolBar: {
                        left: ["#findInvalidBtn"] // Reference custom button
                    },
                    features: { selection: true, editing: true, stickyHeader: true },
                    columns: [
                        { key: "class", title: "학급명", width: 100, align: "center" },
                        {
                            key: "name", title: "한글만 입력", width: 150, align: "center",
                            validators: [{ rule: "pattern", value: "^[ㄱ-ㅎㅏ-ㅣ가-힣]+$", message: "한글로 입력하세요" }]
                        },
                        {
                            key: "korean", title: "숫자만 가능", width: 150, align: "center",
                            validators: [{ rule: "type", value: "number", message: "숫자를 입력하세요." }]
                        },
                        {
                            key: "english", title: "100점 이하", width: 150, align: "center",
                            validators: [{ rule: "max", value: 100, message: "100점 이하로만 입력하세요." }]
                        },
                        {
                            key: "math", title: "0 이상", width: 150, align: "center",
                            validators: [{ rule: "min", value: 0, message: "0 이상 양수로만 입력해 주세요." }]
                        },
                        {
                            key: "physics", title: "40 ~ 90 사이", width: 180, align: "center",
                            validators: [{ rule: "between", value: [40, 90], message: "40~90점 사이만 입력해 주세요." }]
                        }
                    ]
                };
            }
        },
        {
            id: "row-status", group: "State", name: "Row Status",
            title: "행의 상태 정보", subtitle: "Insert · Update · Delete 상태를 시각적으로 표시",
            notes: [
                "showStatus: true 설정 시 각 행 왼쪽에 상태 컬러 바가 표시됩니다.",
                "신규행: 🟢 초록색(I), 수정행: 🔵 파란색(U), 삭제행: 🔴 빨간색(D) + 취소선",
                "행삭제 시 즉시 제거되지 않고 'D' 상태로 표시되어 일괄 저장이 가능합니다.",
                "우측 [저장 시뮬레이션] 버튼을 눌러 변경된 데이터 내역을 확인하세요."
            ],
            code: [
                "AiGrid.createGrid({",
                "  showStatus: true,",
                "  toolBar: ['add', 'delete', '|', 'saveTest'],",
                "  // grid.getChanges()를 통해 I/U/D 내역을 일괄 추출할 수 있습니다.",
                "});"
            ],
            build: function () {
                var classNames = ["1반", "1반", "1반", "2반", "2반", "2반", "3반", "3반"];
                var names = ["김민서", "이수진", "박재원", "정성호", "최예린", "한동훈", "송지아", "임도현"];
                var testData = ensureMinSampleRows(classNames.map(function (c, i) {
                    return {
                        class: c, name: names[i], number: i + 1,
                        korean: Math.floor(70 + Math.random() * 30), english: Math.floor(65 + Math.random() * 35),
                        math: Math.floor(60 + Math.random() * 40), history: Math.floor(55 + Math.random() * 45)
                    };
                }), 20);
                return {
                    mount: "#gridMount",
                    title: "행의 상태 정보",
                    toolbarText: "행 추가·수정·삭제 후 왼쪽 상태 컬러 바를 확인하세요",
                    dataSource: testData,
                    showStatus: true,
                    toolBar: {
                        left: ["undo", "redo", "|", "add", "delete"],
                        right: ["saveTest"]
                    },
                    onAfterRender: function (grid) {
                        // Custom button event binding
                        var saveBtn = grid.mount.querySelector("[data-action='saveTest']");
                        if (saveBtn) {
                            saveBtn.textContent = "💾 저장 시뮬레이션";
                            saveBtn.classList.add("a-blue-btn"); // UI point
                            saveBtn.onclick = function () {
                                var changes = grid.getChanges({ includeDeleted: true });
                                console.log("Grid Changes:", changes);
                                if (window.showJsonPopup) {
                                    window.showJsonPopup(
                                        "행 상태 변경 JSON",
                                        changes,
                                        "신규 " + changes.inserted.length + "건 / 수정 " + changes.updated.length + "건 / 삭제 " + changes.deleted.length + "건"
                                    );
                                    return;
                                }
                                alert(JSON.stringify(changes, null, 2));
                            };
                        }
                    },
                    editable: { mode: "inline", eventType: "dblclick", immediateValidationCheck: false },
                    contextMenu: ["insertRow", "deleteRow"],
                    features: { selection: true, editing: true, undoRedo: true, stickyHeader: true },
                    columns: [
                        { key: "class", title: "반편성", width: 90, align: "center" },
                        { key: "name", title: "성명", width: 120, align: "center" },
                        { key: "number", title: "번호", width: 70, align: "center", readOnly: true },
                        { key: "korean", title: "국어", width: 80, align: "right" },
                        { key: "english", title: "영어", width: 80, align: "right" },
                        { key: "math", title: "수학", width: 80, align: "right" },
                        { key: "history", title: "역사", width: 80, align: "right" }
                    ]
                };
            },
            defaultJs: [
                "var classNames = ['1반', '1반', '1반', '2반', '2반', '2반', '3반', '3반'];",
                "var names = ['김민서', '이수진', '박재원', '정성호', '최예린', '한동훈', '송지아', '임도현'];",
                "var rows = [];",
                "for (var i = 0; i < 20; i++) {",
                "  rows.push({",
                "    class: classNames[i % classNames.length],",
                "    name: names[i % names.length],",
                "    number: i + 1,",
                "    korean: 70 + ((i * 7) % 31),",
                "    english: 65 + ((i * 9) % 36),",
                "    math: 60 + ((i * 11) % 41),",
                "    history: 55 + ((i * 13) % 46)",
                "  });",
                "}",
                "",
                "return AiGrid.createGrid({",
                "  mount: '#gridMount',",
                "  title: '행의 상태 정보',",
                "  toolbarText: '행 추가·수정·삭제 후 왼쪽 상태 컬러 바를 확인하세요',",
                "  dataSource: rows,",
                "  showStatus: true,",
                "  toolBar: {",
                "    left: ['undo', 'redo', '|', 'add', 'delete'],",
                "    right: ['saveTest']",
                "  },",
                "  onAfterRender: function (grid) {",
                "    var saveBtn = grid.mount.querySelector(\"[data-action='saveTest']\");",
                "    if (!saveBtn) return;",
                "    saveBtn.textContent = '💾 저장 시뮬레이션';",
                "    saveBtn.classList.add('a-blue-btn');",
                "    saveBtn.onclick = function () {",
                "      var changes = grid.getChanges({ includeDeleted: true });",
                "      console.log('Grid Changes:', changes);",
                "      if (window.showJsonPopup) {",
                "        window.showJsonPopup(",
                "          '행 상태 변경 JSON',",
                "          changes,",
                "          '신규 ' + changes.inserted.length + '건 / 수정 ' + changes.updated.length + '건 / 삭제 ' + changes.deleted.length + '건'",
                "        );",
                "        return;",
                "      }",
                "      alert(JSON.stringify(changes, null, 2));",
                "    };",
                "  },",
                "  editable: { mode: 'inline', eventType: 'dblclick', immediateValidationCheck: false },",
                "  contextMenu: ['insertRow', 'deleteRow'],",
                "  features: { selection: true, editing: true, undoRedo: true, stickyHeader: true },",
                "  columns: [",
                "    { key: 'class', title: '반편성', width: 90, align: 'center' },",
                "    { key: 'name', title: '성명', width: 120, align: 'center' },",
                "    { key: 'number', title: '번호', width: 70, align: 'center', readOnly: true },",
                "    { key: 'korean', title: '국어', width: 80, align: 'right' },",
                "    { key: 'english', title: '영어', width: 80, align: 'right' },",
                "    { key: 'math', title: '수학', width: 80, align: 'right' },",
                "    { key: 'history', title: '역사', width: 80, align: 'right' }",
                "  ]",
                "});"
            ]
        },
        {
            id: "tooltip", group: "Features", name: "Tooltip (도움말)",
            title: "툴팁 (도움말 풍선)", subtitle: "헤더 및 셀 영역에 동적 도움말 풍선 출력",
            notes: [
                "tooltip 속성을 통해 헤더(caption)와 셀(cell) 각각의 툴팁을 설정할 수 있습니다.",
                "placement: 'top', 'bottom', 'left', 'right' 위치 설정이 가능합니다.",
                "template: '{{field}}' 형식을 사용하여 행 데이터를 동적으로 바인딩합니다.",
                "헤더의 경우 '{{caption}}' 예약어를 사용하여 제목을 표시할 수 있습니다."
            ],
            code: [
                "columns: [",
                "  {",
                "    key: 'region', title: '지역',",
                "    tooltip: {",
                "      caption: { placement: 'right', template: '이 컬럼은 {{caption}}을 나타냅니다.' },",
                "      cell: { placement: 'top', template: '<b>{{region}}</b> 지역의 상세 정보입니다.' }",
                "    }",
                "  }",
                "]"
            ],
            build: function () {
                var dustData = ensureMinSampleRows([
                    { col4: "서울", col3: "강남구", col1: "2024-04-18", col2: "14:00", col5: "테헤란로", col6: "강남역", col7: "삼성역", col8: 22, col9: 45 },
                    { col4: "서울", col3: "서초구", col1: "2024-04-18", col2: "14:00", col5: "강남대로", col6: "신논현역", col7: "양재역", col8: 23, col9: 42 },
                    { col4: "경기", col3: "판교", col1: "2024-04-18", col2: "15:00", col5: "대왕판교로", col6: "판교테크노밸리", col7: "정자역", col8: 21, col9: 48 },
                    { col4: "인천", col3: "송도", col1: "2024-04-18", col2: "15:00", col5: "인천타워대로", col6: "지식정보단지", col7: "센트럴파크", col8: 20, col9: 55 }
                ], 20);

                return {
                    mount: "#gridMount",
                    title: "툴팁 기능 데모",
                    dataSource: dustData,
                    columns: [
                        {
                            key: "col4", title: "지역", width: 100, align: "center",
                            tooltip: {
                                caption: { placement: "right", template: "이 컬럼은 <b>{{caption}}</b>을 나타냅니다." },
                                cell: { placement: "top", template: "현재 거점은 <b>{{col4}}</b> 입니다." }
                            }
                        },
                        { key: "col3", title: "지역명", width: 100, align: "center" },
                        {
                            key: "col5", title: "도로명", width: 150, align: "left",
                            tooltip: {
                                cell: { placement: "right", template: "도로명: {{col5}}" }
                            }
                        },
                        {
                            key: "col6", title: "시작점", width: 180, align: "left",
                            tooltip: {
                                caption: { placement: "top", template: "경로의 시작 지점" }
                            }
                        },
                        {
                            key: "col7", title: "도착점", width: 180, align: "left",
                            tooltip: {
                                cell: { placement: "left", template: "최종 목적지: {{col7}}" }
                            }
                        },
                        {
                            key: "col8", title: "기온", width: 80, align: "right", type: "number",
                            tooltip: {
                                cell: { placement: "top", template: "현재 기온 {{col8}}℃" }
                            }
                        },
                        { key: "col9", title: "습도", width: 80, align: "right", type: "number" }
                    ]
                };
            }
        },
        {
            id: "calendar", group: "Features", name: "Calendar (달력)",
            title: "Grid Calendar", subtitle: "그리드를 활용한 캘린더 형태의 데이터 시각화",
            notes: [
                "7개의 컬럼을 배치하여 요일별 데이터를 표현합니다.",
                "captionCss와 colCss를 사용하여 주말(토, 일) 색상을 다르게 지정합니다.",
                "cellTemplate을 통해 일자 및 일정을 자유롭게 렌더링합니다.",
                "doCommand: 'focus' 이벤트를 활용하여 클릭 시 일정 팝업을 띄울 수 있습니다."
            ],
            code: [
                "function renderDay(row, col) { /* return a DOM Node and use textContent */ }",
                "columns: [",
                "  { field: 'sun', caption: '일', captionCss: 'sunday', colCss: 'sunday', cellTemplate: renderDay },",
                "  { field: 'mon', caption: '월', cellTemplate: renderDay },",
                "  ...",
                "]"
            ],
            defaultJs: [
                "const scheduleData = [",
                "  { sun: 1, 'sun-schedule': [{ time: '10:00', title: '가족 모임', type: 'important' }], mon: 2, tue: 3, 'tue-schedule': [",
                "    { time: '09:00', title: '삼성전자 공모주', type: 'work' },",
                "    { time: '10:00', title: '현대차 미팅', type: 'work' },",
                "    { time: '14:00', title: '병원 예약', type: 'important' },",
                "    { time: '16:00', title: '운동', type: 'work' }",
                "  ], wed: 4, thu: 5, fri: 6, sat: 7 },",
                "  { sun: 8, mon: 9, tue: 10, wed: 11, thu: 12, 'thu-schedule': [{ time: '14:00', title: '주간 회의', type: 'work' }], fri: 13, sat: 14 },",
                "  { sun: 15, mon: 16, tue: 17, wed: 18, thu: 19, fri: 20, sat: 21, 'sat-schedule': [{ time: '19:00', title: '친구 생일파티', type: 'important' }] },",
                "  { sun: 22, mon: 23, tue: 24, wed: 25, thu: 26, fri: 27, sat: 28 },",
                "  { sun: 29, mon: 30, tue: '', wed: '', thu: '', fri: '', sat: '' }",
                "];",
                "",
                "function renderDay(row, col) {",
                "  const field = col.key || col.field;",
                "  const cell = document.createElement('div'); cell.className = 'calendar-cell';",
                "  const date = document.createElement('div'); date.className = 'date';",
                "  date.textContent = row[field] == null ? '' : String(row[field]); cell.appendChild(date);",
                "  const list = document.createElement('div'); list.className = 'schedules';",
                "  (Array.isArray(row[field + '-schedule']) ? row[field + '-schedule'] : []).slice(0, 2).forEach(function (item) {",
                "    const entry = document.createElement('div');",
                "    entry.className = 'schedule' + (item.type === 'important' || item.type === 'work' ? ' ' + item.type : '');",
                "    const time = document.createElement('span'); time.className = 'time'; time.textContent = String(item.time || '');",
                "    const event = document.createElement('span'); event.className = 'event'; event.textContent = String(item.title || '');",
                "    entry.append(time, event); list.appendChild(entry);",
                "  });",
                "  cell.appendChild(list); return cell;",
                "}",
                "",
                "return AiGrid.createGrid({",
                "  mount: '#gridMount',",
                "  dataSource: scheduleData,",
                "  rowHeight: 120,",
                "  showRowNo: false,",
                "  doCommand: function(grid, name, command) {",
                "    if (name === 'focus') {",
                "      const colField = AiGrid.getFocusedColumn(grid).field;",
                "      const rowData = AiGrid.getRowData(grid, command.key);",
                "      const schedules = rowData[colField + '-schedule'];",
                "      if (schedules && schedules.length) {",
                "        window.showCalendarSchedulePopup(rowData[colField], schedules);",
                "      }",
                "    }",
                "  },",
                "  columns: [",
                "    { field: 'sun', title: '일', width: '14.2%', align: 'center', captionCss: 'sunday', colCss: 'sunday', cellTemplate: renderDay },",
                "    { field: 'mon', title: '월', width: '14.2%', align: 'center', cellTemplate: renderDay },",
                "    { field: 'tue', title: '화', width: '14.2%', align: 'center', cellTemplate: renderDay },",
                "    { field: 'wed', title: '수', width: '14.2%', align: 'center', cellTemplate: renderDay },",
                "    { field: 'thu', title: '목', width: '14.2%', align: 'center', cellTemplate: renderDay },",
                "    { field: 'fri', title: '금', width: '14.2%', align: 'center', cellTemplate: renderDay },",
                "    { field: 'sat', title: '토', width: '14.2%', align: 'center', captionCss: 'saturday', colCss: 'saturday', cellTemplate: renderDay }",
                "  ]",
                "});"
            ],
            build: function () {
                var scheduleData = [
                    {
                        sun: 1, 'sun-schedule': [{ time: '10:00', title: '가족 모임', type: 'important' }],
                        mon: 2,
                        tue: 3, 'tue-schedule': [
                            { time: '09:00', title: '삼성전자 공모주', type: 'work' },
                            { time: '10:00', title: '현대차 미팅', type: 'work' },
                            { time: '14:00', title: '병원 예약', type: 'important' },
                            { time: '16:00', title: '운동', type: 'work' }
                        ],
                        wed: 4, thu: 5, fri: 6, sat: 7
                    },
                    {
                        sun: 8, mon: 9, tue: 10, wed: 11,
                        thu: 12, 'thu-schedule': [{ time: '14:00', title: '주간 회의', type: 'work' }],
                        fri: 13, sat: 14
                    },
                    {
                        sun: 15, mon: 16, tue: 17, wed: 18, thu: 19, fri: 20, sat: 21,
                        'sat-schedule': [{ time: '19:00', title: '친구 생일파티', type: 'important' }]
                    },
                    {
                        sun: 22, mon: 23, tue: 24, wed: 25, thu: 26, fri: 27, sat: 28
                    },
                    {
                        sun: 29, mon: 30, tue: "", wed: "", thu: "", fri: "", sat: ""
                    }
                ];

                return {
                    mount: "#gridMount",
                    title: "2024년 4월 일정표",
                    dataSource: scheduleData,
                    rowHeight: 100,
                    showRowNo: false,
                    doCommand: function (grid, name, command) {
                        if (name === 'focus') {
                            var colField = AiGrid.getFocusedColumn(grid).field;
                            var rowData = AiGrid.getRowData(grid, command.key);
                            var schedules = rowData[colField + '-schedule'];
                            if (schedules && schedules.length) {
                                window.showCalendarSchedulePopup(rowData[colField], schedules);
                            }
                        }
                    },
                    columns: [
                        { field: "sun", title: "일", width: "14%", align: "center", captionCss: "sunday", colCss: "sunday", cellTemplate: renderCalendarCell },
                        { field: "mon", title: "월", width: "14%", align: "center", cellTemplate: renderCalendarCell },
                        { field: "tue", title: "화", width: "14%", align: "center", cellTemplate: renderCalendarCell },
                        { field: "wed", title: "수", width: "14%", align: "center", cellTemplate: renderCalendarCell },
                        { field: "thu", title: "목", width: "14%", align: "center", cellTemplate: renderCalendarCell },
                        { field: "fri", title: "금", width: "14%", align: "center", cellTemplate: renderCalendarCell },
                        { field: "sat", title: "토", width: "14%", align: "center", captionCss: "saturday", colCss: "saturday", cellTemplate: renderCalendarCell }
                    ]
                };
            }
        },
        {
            id: "large-data", group: "Performance", name: "Large Data Grid",
            title: "Large Data Grid", subtitle: "Local large dataset profile (max 500000)",
            notes: [
                "Generates local rows in browser memory.",
                "pageSize is fixed to 100000.",
                "Default rows are 500000. Use ?rows=100000 to test a smaller profile."
            ],
            code: [
                "AiGrid.createGrid({",
                "  const safeRows = Math.min(500000, Math.max(1, requestedRows));",
                "  dataSource: makeRows(safeRows),",
                "  paging: { pageSize: 100000 },",
                "  features: { paging: true, sorting: true, filtering: true, stickyHeader: true }",
                "});"
            ],
            defaultJs: [
                "function makeRows(count) {",
                "  const teams = ['Platform', 'AI', 'QA', 'Ops', 'Design', 'Sales'];",
                "  const states = ['Active', 'Review', 'Hold'];",
                "  const rows = [];",
                "  for (let i = 1; i <= count; i++) {",
                "    rows.push({",
                "      id: i,",
                "      team: teams[i % teams.length],",
                "      owner: 'User ' + i,",
                "      amount: 1000 + (i * 37 % 90000),",
                "      score: i % 101,",
                "      state: states[i % states.length],",
                "      createdAt: '2026-04-' + String((i % 28) + 1).padStart(2, '0')",
                "    });",
                "  }",
                "  return rows;",
                "}",
                "",
                "const maxRows = 500000;",
                "const defaultRows = 500000;",
                "const params = new URLSearchParams(window.location.search);",
                "const requestedRows = Number(params.get('rows') || defaultRows);",
                "const safeRows = Number.isFinite(requestedRows) ? Math.max(1, Math.min(maxRows, Math.floor(requestedRows))) : defaultRows;",
                "const rows = makeRows(safeRows);",
                "",
                "return AiGrid.createGrid({",
                "  mount: '#gridMount',",
                "  title: 'Large Data Grid',",
                "  toolbarText: 'Local rows: ' + safeRows + ' / pageSize: 100000 (max 500000)',",
                "  dataSource: rows,",
                "  paging: { pageSize: 100000 },",
                "  features: { selection: true, editing: false, paging: true, sorting: true, filtering: true, stickyHeader: true, columnResize: true, rowDrag: false },",
                "  columns: [",
                "    { key: 'rowno', title: '#', type: 'rowno', width: 70, readOnly: true },",
                "    { key: 'id', title: 'ID', type: 'number', width: 90, readOnly: true },",
                "    { key: 'team', title: 'Team', type: 'text', width: 130 },",
                "    { key: 'owner', title: 'Owner', type: 'text', width: 150 },",
                "    { key: 'amount', title: 'Amount', type: 'number', width: 120, align: 'right' },",
                "    { key: 'score', title: 'Score', type: 'number', width: 100, align: 'right' },",
                "    { key: 'state', title: 'State', type: 'text', width: 110 },",
                "    { key: 'createdAt', title: 'Created', type: 'date', width: 130 }",
                "  ]",
                "});"
            ],
            build: function () {
                return {
                    mount: "#gridMount",
                    title: "Large Data Grid",
                    toolbarText: "Local rows: 500000 / pageSize: 100000 (max 500000)",
                    dataSource: [],
                    paging: { pageSize: 100000 },
                    features: {
                        selection: true,
                        paging: true,
                        sorting: true,
                        filtering: true,
                        stickyHeader: true,
                        columnResize: true,
                        editing: false,
                        rowDrag: false,
                        copyPaste: false,
                        contextMenu: false
                    },
                    columns: serverColumns()
                };
            }
        },
        {
            id: "large-data-json", group: "Performance", name: "Large Data Grid (JSON API)",
            title: "Large Data Grid - JSON API", subtitle: "/api/data/json response profile",
            notes: [
                "Source: /api/data/json (object-array payload)",
                "Same grid options as columnar sample for fair comparison",
                "Use this to compare parser and network payload overhead"
            ],
            code: [
                "AiGrid.createGrid({",
                "  dataSource: { url: '/api/data/json', serverMode: true },",
                "  paging: { pageSize: 200 },",
                "  features: { paging: true, sorting: true, filtering: true, stickyHeader: true }",
                "});"
            ],
            build: function () {
                return serverSampleConfig(
                    "Large Data Grid - JSON API",
                    "Server object rows (/api/data/json)",
                    200,
                    {
                        editing: false,
                        copyPaste: false,
                        rowDrag: false,
                        contextMenu: false,
                        stickyHeader: true,
                        columnResize: true
                    },
                    {
                        dataSource: { url: "/api/data/json", serverMode: true }
                    }
                );
            }
        },
        {
            id: "large-data-stream", group: "Performance", name: "Large Data Grid (Stream API)",
            title: "Large Data Grid - Stream API", subtitle: "/api/data/stream (NDJSON) response profile",
            notes: [
                "Source: /api/data/stream (NDJSON)",
                "Stream endpoint now supported via responseType: 'ndjson'",
                "Best used for chunked read scenarios (sorting/filtering UI off by default)"
            ],
            code: [
                "AiGrid.createGrid({",
                "  dataSource: { url: '/api/data/stream', serverMode: true, responseType: 'ndjson' },",
                "  paging: { pageSize: 500 },",
                "  features: { paging: false, sorting: false, filtering: false, stickyHeader: true }",
                "});"
            ],
            build: function () {
                return serverSampleConfig(
                    "Large Data Grid - Stream API",
                    "NDJSON stream source (/api/data/stream)",
                    500,
                    {
                        editing: false,
                        copyPaste: false,
                        rowDrag: false,
                        sorting: false,
                        filtering: false,
                        paging: false,
                        lazyLoading: false,
                        contextMenu: false,
                        stickyHeader: true,
                        columnResize: true
                    },
                    {
                        dataSource: { url: "/api/data/stream", serverMode: true, responseType: "ndjson" }
                    }
                );
            }
        },
        {
            id: "server", group: "Server", name: "Server DataOps",
            title: "Server DataOps", subtitle: "Server sort/filter/paging + dirty tracking",
            notes: [
                "Source: /api/data/columnar",
                "Server sort/filter/paging enabled",
                "Use getChanges() / saveChanges('/api/data/changes') to verify delta flow"
            ],
            code: [
                "AiGrid.createGrid({",
                "  dataSource: { url: '/api/data/columnar', serverMode: true },",
                "  paging: { pageSize: 100 },",
                "  features: { sorting: true, filtering: true, paging: true, editing: true }",
                "});"
            ],
            build: function () {
                return serverSampleConfig("Phase 8 - Server DataOps", "Server sort/filter/paging + dirty tracking", 100);
            }
        },
        {
            id: "server-lazy", group: "Server", name: "Server Lazy Load",
            title: "Server Lazy Loading", subtitle: "Incremental fetch on scroll near viewport bottom",
            notes: [
                "Same /api/data/columnar source",
                "lazyLoading = true",
                "Scroll down to trigger appended row fetch"
            ],
            code: [
                "AiGrid.createGrid({",
                "  dataSource: { url: '/api/data/columnar', serverMode: true },",
                "  features: { paging: true, lazyLoading: true }",
                "});"
            ],
            build: function () {
                return serverSampleConfig("Phase 8 - Lazy Loading", "Server append loading by scroll", 150, { lazyLoading: true });
            }
        },
        {
            id: "server-page-size", group: "Server", name: "Server Page 200",
            title: "Server Paging (200)", subtitle: "Larger page size for paging performance checks",
            notes: [
                "Page size configured to 200",
                "Useful for comparing network and render behavior",
                "Sorting/filtering kept enabled"
            ],
            code: [
                "AiGrid.createGrid({",
                "  dataSource: { url: '/api/data/columnar', serverMode: true },",
                "  paging: { pageSize: 200 }",
                "});"
            ],
            build: function () {
                return serverSampleConfig("Phase 8 - Server Paging 200", "Page-size stress sample", 200);
            }
        }
    ];

    function applyHostConfig() {
        if (Array.isArray(hostConfig.includeSampleIds) && hostConfig.includeSampleIds.length) {
            var includeSet = {};
            hostConfig.includeSampleIds.forEach(function (id) {
                if (typeof id === "string" && id.trim()) {
                    includeSet[id.trim()] = true;
                }
            });
            samples = samples.filter(function (sample) {
                return !!includeSet[sample.id];
            });
        }

        if (Array.isArray(hostConfig.appendSamples) && hostConfig.appendSamples.length) {
            var indexMap = {};
            samples.forEach(function (sample, index) {
                indexMap[sample.id] = index;
            });

            hostConfig.appendSamples.forEach(function (sample) {
                if (!sample || typeof sample.id !== "string" || !sample.id.trim()) {
                    return;
                }
                var id = sample.id.trim();
                if (Object.prototype.hasOwnProperty.call(indexMap, id)) {
                    samples[indexMap[id]] = sample;
                    return;
                }
                indexMap[id] = samples.length;
                samples.push(sample);
            });
        }
    }

    applyHostConfig();

    var current = sampleById(defaultSampleId)
        ? defaultSampleId
        : (samples.length ? samples[0].id : "column-types");

    function sampleById(id) {
        return samples.find(function (s) {
            return s.id === id;
        });
    }

    function setStatus(text) {
        status.textContent = text;
    }

    function toLf(text) {
        return String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    }

    function indentLines(text, pad) {
        if (!text) {
            return "";
        }
        return toLf(text).split("\n").map(function (line) {
            return pad + line;
        }).join("\n");
    }

    function buildStandalonePage(sample, jsCode, htmlCode) {
        var sampleTitle = sample && sample.title ? String(sample.title) : "Sample";
        var mountHtml = (htmlCode && htmlCode.trim()) ? htmlCode : defaultHtmlCode;
        var htmlBlock = indentLines(mountHtml, "        ");
        var jsBlock = indentLines(jsCode || "", "                ");

        return [
            "<!DOCTYPE html>",
            "<html lang=\"en\">",
            "<head>",
            "    <meta charset=\"UTF-8\">",
            "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">",
            "    <title>DataGridAI Standalone - " + sampleTitle + "</title>",
            "    <link rel=\"stylesheet\" href=\"" + standaloneCoreCssUrl + "\">",
            "    <style>",
            "        html, body { margin: 0; padding: 0; height: 100%; background: #f3f6fb; font-family: \"Segoe UI\", \"Noto Sans KR\", sans-serif; }",
            "        .wrap { height: 100%; display: grid; grid-template-rows: auto 1fr; }",
            "        .head { padding: 12px 16px; border-bottom: 1px solid #d7deea; background: #ffffff; }",
            "        .head h1 { margin: 0; font-size: 18px; }",
            "        .head p { margin: 6px 0 0; font-size: 12px; color: #5e6f8a; }",
            "        .body { padding: 12px; }",
            "        #gridMount { height: calc(100vh - 92px); min-height: 480px; }",
            "        .error { color: #c92a2a; background: #fff5f5; border: 1px solid #ffc9c9; border-radius: 8px; padding: 10px; }",
            "    </style>",
            "</head>",
            "<body>",
            "    <div class=\"wrap\">",
            "        <header class=\"head\">",
            "            <h1>" + sampleTitle + "</h1>",
            "            <p>Standalone sample page generated from sample explorer</p>",
            "        </header>",
            "        <main class=\"body\">",
            htmlBlock,
            "        </main>",
            "    </div>",
            "",
            "    <script src=\"" + standaloneCoreJsUrl + "\"></script>",
            "    <script>",
            "        (async function () {",
            "            try {",
            jsBlock,
            "            } catch (error) {",
            "                console.error(error);",
            "                var mount = document.getElementById(\"gridMount\") || document.body;",
            "                var box = document.createElement(\"div\");",
            "                box.className = \"error\";",
            "                box.textContent = \"Sample execution failed: \" + (error.message || error);",
            "                mount.appendChild(box);",
            "            }",
            "        })();",
            "    </script>",
            "</body>",
            "</html>"
        ].join("\n");
    }

    function refreshPageCode(sample) {
        if (!codePage || !sample) {
            return;
        }
        var state = getEditorState(sample.id);
        codePage.value = buildStandalonePage(sample, state.js, state.html);
    }

    function copyTextToClipboard(text, label) {
        var done = function () {
            setStatus(label + " copied");
        };
        var failed = function () {
            setStatus("Failed to copy " + label);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done).catch(failed);
            return;
        }

        try {
            var temp = document.createElement("textarea");
            temp.value = text;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand("copy");
            document.body.removeChild(temp);
            done();
        } catch (_) {
            failed();
        }
    }

    function cloneSerializable(value) {
        if (value === null) {
            return null;
        }

        if (Array.isArray(value)) {
            return value.map(function (item) {
                return cloneSerializable(item);
            });
        }

        if (typeof value === "object") {
            var result = {};
            Object.keys(value).forEach(function (key) {
                var next = cloneSerializable(value[key]);
                if (typeof next !== "undefined") {
                    result[key] = next;
                }
            });
            return result;
        }

        if (typeof value === "function" || typeof value === "undefined") {
            return undefined;
        }

        return value;
    }

    function sampleDefaultHtml(sample) {
        if (sample && sample.defaultHtml && sample.defaultHtml.trim()) {
            return sample.defaultHtml;
        }

        return defaultHtmlCode;
    }

    function defaultJsCode(sample) {
        if (sample && Array.isArray(sample.defaultJs) && sample.defaultJs.length) {
            return sample.defaultJs.join("\n");
        }

        if (!sample || typeof sample.build !== "function") {
            return "return null;";
        }

        var config = cloneSerializable(sample.build());
        return [
            "// Edit this config and click Run.",
            "return AiGrid.createGrid(",
            JSON.stringify(config, null, 2),
            ");"
        ].join("\n");
    }

    function getEditorState(sampleId) {
        if (!editorState[sampleId]) {
            var sample = sampleById(sampleId);
            if (!sample) {
                return { js: "", html: defaultHtmlCode };
            }
            editorState[sampleId] = {
                js: defaultJsCode(sample),
                html: sampleDefaultHtml(sample)
            };
        }

        return editorState[sampleId];
    }

    function saveCurrentEditors() {
        var sample = sampleById(current);
        if (!sample) {
            return;
        }

        var state = getEditorState(sample.id);
        state.js = codeJs.value;
        state.html = codeHtml.value;
    }

    function resetMount(htmlCode) {
        var host = document.querySelector(".result-host");
        if (!host) {
            return;
        }
        host.innerHTML = htmlCode && htmlCode.trim() ? htmlCode : defaultHtmlCode;
    }

    function destroyCurrentGrid() {
        if (!currentGrid || typeof currentGrid.destroy !== "function") {
            currentGrid = null;
            return;
        }

        try {
            currentGrid.destroy();
        } catch (error) {
            console.warn(error);
        }
        currentGrid = null;
    }

    function showRunError(error) {
        console.error(error);
        setStatus("Failed: " + error.message);

        var host = document.querySelector(".result-host");
        if (!host) {
            return;
        }

        host.innerHTML = "";
        var errorBox = document.createElement("div");
        errorBox.className = "sample-error";
        errorBox.textContent = String(error.message || error);
        host.appendChild(errorBox);
    }

    function renderInfo(sample) {
        // Embedded page samples use the whole result area without the code panel.
        var isFullPageSample = sample.group === "AI" || sample.group === "React";
        document.body.classList.toggle("example-full-page-sample", isFullPageSample);
        title.textContent = sample.title;
        subtitle.textContent = sample.subtitle;
        notes.innerHTML = sample.notes.map(function (x) {
            return "<li>" + x + "</li>";
        }).join("");
        if (fullPageNotes) {
            fullPageNotes.innerHTML = isFullPageSample
                ? "<ul>" + sample.notes.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>"
                : "";
        }
        var state = getEditorState(sample.id);
        codeJs.value = state.js;
        codeHtml.value = state.html;
        refreshPageCode(sample);

        Array.prototype.slice.call(nav.querySelectorAll(".menu-item")).forEach(function (button) {
            var isActive = button.getAttribute("data-id") === sample.id;
            button.classList.toggle("active", isActive);
            if (isActive) {
                var group = button.closest(".menu-group");
                if (group) {
                    group.setAttribute("open", "open");
                }
            }
        });

        if (mvpNav) {
            Array.prototype.slice.call(mvpNav.querySelectorAll(".mvp-menu__item")).forEach(function (button) {
                button.classList.toggle("active", button.getAttribute("data-id") === sample.id);
            });
        }
    }

    function runCurrent() {
        var sample = sampleById(current);
        if (!sample) {
            return;
        }

        if ((!window.AiGrid || typeof window.AiGrid.createGrid !== "function") && typeof sample.build === "function") {
            setStatus("AiGrid core is not loaded.");
            return;
        }

        saveCurrentEditors();
        var state = getEditorState(sample.id);

        setStatus("Running...");
        destroyCurrentGrid();
        resetMount(state.html);

        try {
            var AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
            var runner = new AsyncFunction("AiGrid", "window", "document", "console", "\"use strict\";\n" + state.js);
            var output = runner(window.AiGrid, window, document, console);

            Promise.resolve(output).then(function (grid) {
                if (grid && typeof grid === "object") {
                    currentGrid = grid;
                    var rowText = grid.rows && grid.rows.length ? grid.rows.length + " rows" : "ready";
                    setStatus("Loaded: " + rowText);
                    return;
                }

                currentGrid = null;
                setStatus("Executed (no grid instance returned)");
            }).catch(showRunError);
        } catch (error) {
            showRunError(error);
        }
    }

    function setHash(id) {
        var nextHash = "#" + id;
        if (window.location.hash !== nextHash) {
            history.replaceState(null, "", nextHash);
        }
    }

    function activate(id) {
        var sample = sampleById(id);
        if (!sample) {
            return;
        }

        if (current !== id) {
            saveCurrentEditors();
        }

        current = id;
        setHash(id);
        renderInfo(sample);
        runCurrent();
    }

    function groupedSamples() {
        var grouped = [];
        var map = {};

        samples.forEach(function (sample) {
            if (!map[sample.group]) {
                map[sample.group] = { group: sample.group, items: [] };
                grouped.push(map[sample.group]);
            }
            map[sample.group].items.push(sample);
        });

        return grouped;
    }

    function defaultGroupOpen(entry) {
        return false;
    }

    function setAllGroupsOpen(isOpen) {
        Array.prototype.slice.call(nav.querySelectorAll(".menu-group")).forEach(function (group) {
            if (isOpen) {
                group.setAttribute("open", "open");
            } else {
                group.removeAttribute("open");
            }
        });
    }

    function buildNav() {
        var grouped = groupedSamples();
        nav.innerHTML = grouped.map(function (entry) {
            return "<details class='menu-group'" + (defaultGroupOpen(entry) ? " open" : "") + "><summary>" + entry.group + " (" + entry.items.length + ")</summary><div class='menu-items'>" +
                entry.items.map(function (sample) {
                    return "<button type='button' class='menu-item' data-id='" + sample.id + "'>" + sample.name + "</button>";
                }).join("") +
                "</div></details>";
        }).join("");

        Array.prototype.slice.call(nav.querySelectorAll(".menu-item")).forEach(function (button) {
            button.addEventListener("click", function () {
                activate(button.getAttribute("data-id"));
            });
        });

        if (expandAllBtn) {
            expandAllBtn.onclick = function () {
                setAllGroupsOpen(true);
            };
        }

        if (collapseAllBtn) {
            collapseAllBtn.onclick = function () {
                setAllGroupsOpen(false);
            };
        }
    }

    function renderMvpNav() {
        if (!mvpNav) {
            return;
        }

        var items = mvpSampleIds.map(sampleById).filter(Boolean);
        mvpNav.innerHTML = items.map(function (sample) {
            return "<button type='button' class='mvp-menu__item' data-id='" + sample.id + "'>" + sample.name + "</button>";
        }).join("");

        Array.prototype.slice.call(mvpNav.querySelectorAll(".mvp-menu__item")).forEach(function (button) {
            button.addEventListener("click", function () {
                activate(button.getAttribute("data-id"));
            });
        });
    }

    function setCodePanelOpen(isOpen) {
        if (!workbench) {
            return;
        }

        workbench.classList.toggle("code-collapsed", !isOpen);
        if (toggleCodePanelBtn) {
            toggleCodePanelBtn.textContent = isOpen ? "Hide Code" : "Show Code";
            toggleCodePanelBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        }
    }

    function filterNav() {
        var key = (search.value || "").trim().toLowerCase();

        Array.prototype.slice.call(nav.querySelectorAll(".menu-item")).forEach(function (button) {
            if (key.length < 2) {
                button.style.display = "";
                return;
            }

            var sample = sampleById(button.getAttribute("data-id"));
            var text = (sample.name + " " + sample.title + " " + sample.subtitle).toLowerCase();
            button.style.display = text.indexOf(key) >= 0 ? "" : "none";
        });

        Array.prototype.slice.call(nav.querySelectorAll(".menu-group")).forEach(function (group) {
            var visible = Array.prototype.slice.call(group.querySelectorAll(".menu-item")).some(function (item) {
                return item.style.display !== "none";
            });
            group.style.display = visible ? "" : "none";
            if (visible && key.length >= 2) {
                group.setAttribute("open", "open");
            }
        });
    }

    function setCodeTab(name) {
        codeJs.classList.toggle("hidden", name !== "js");
        codeHtml.classList.toggle("hidden", name !== "html");
        if (codePage) {
            codePage.classList.toggle("hidden", name !== "page");
        }

        tabs.forEach(function (tab) {
            tab.classList.toggle("active", tab.getAttribute("data-tab") === name);
        });
    }

    function initialSampleId() {
        var hash = (window.location.hash || "").replace(/^#/, "").trim();
        if (!hash) {
            return current;
        }
        return sampleById(hash) ? hash : current;
    }

    search.addEventListener("input", filterNav);

    codeJs.addEventListener("input", function () {
        var state = getEditorState(current);
        state.js = codeJs.value;
        refreshPageCode(sampleById(current));
    });

    codeHtml.addEventListener("input", function () {
        var state = getEditorState(current);
        state.html = codeHtml.value;
        refreshPageCode(sampleById(current));
    });

    tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
            setCodeTab(tab.getAttribute("data-tab"));
        });
    });

    runBtn.addEventListener("click", function () {
        runCurrent();
    });

    if (copyPageBtn && codePage) {
        copyPageBtn.addEventListener("click", function () {
            var sample = sampleById(current);
            if (!sample) {
                return;
            }
            refreshPageCode(sample);
            copyTextToClipboard(codePage.value || "", "Full Page");
        });
    }

    resetBtn.addEventListener("click", function () {
        var sample = sampleById(current);
        if (!sample) {
            return;
        }

        editorState[sample.id] = {
            js: defaultJsCode(sample),
            html: sampleDefaultHtml(sample)
        };

        renderInfo(sample);
        runCurrent();
    });

    if (toggleCodePanelBtn) {
        toggleCodePanelBtn.addEventListener("click", function () {
            setCodePanelOpen(workbench && workbench.classList.contains("code-collapsed"));
        });
    }

    installSidebarSlideToggle();
    installApiFallback();
    buildNav();
    renderMvpNav();
    setCodePanelOpen(false);
    setCodeTab("js");

    if (!samples.length) {
        setStatus("No samples registered.");
        return;
    }

    activate(initialSampleId());
})();
