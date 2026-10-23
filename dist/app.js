import { ENDING_ACHIEVEMENTS, ENDING_ACHIEVEMENT_CATEGORY_LABELS, KNOWLEDGE_NAMES, KNOWLEDGE_ORDER, RESOURCE_KEYS, RESOURCE_LABELS, SEASONS, SEASON_LABELS, MudWaterGame } from "./engine/index.js";
const STORAGE_KEY = "mud-water-v014-web-game-v1";
const ENDING_ACHIEVEMENT_STORAGE_KEY = "mud-water-ending-achievements-v1";
const app = document.querySelector("#wizardCard");
const metaStrip = document.querySelector("#metaStrip");
const sceneHeader = document.querySelector("#sceneHeader");
const persistentStatus = document.querySelector("#persistentStatus");
const sidePanel = document.querySelector("#sidePanel");
const sideTabs = document.querySelector("#sideTabs");
const saveState = document.querySelector("#saveState");
const seedLabel = document.querySelector("#seedLabel");
const toastElement = document.querySelector("#toast");
const gameGuideDialog = document.querySelector("#gameGuideDialog");
const endingAchievementsDialog = document.querySelector("#endingAchievementsDialog");
const endingAchievementGrid = document.querySelector("#endingAchievementGrid");
const endingAchievementCount = document.querySelector("#endingAchievementCount");
const endingAchievementSummary = document.querySelector("#endingAchievementSummary");
const endingAchievementProgress = document.querySelector("#endingAchievementProgress");
let game = loadGame();
let unlockedEndingAchievements = loadEndingAchievements();
let activeSideTab = "log";
let selectedActionId = null;
let selectedActorId = null;
let selectedTargetId = null;
let selectedKnowledgeKey = null;
let toastTimer = 0;
function loadGame() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return MudWaterGame.fromJSON(raw);
    } catch (error) {
        console.warn("Could not load saved game", error);
    }
    return MudWaterGame.newGame({
        seed: 20290000
    });
}
function loadEndingAchievements() {
    try {
        const raw = localStorage.getItem(ENDING_ACHIEVEMENT_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const knownIds = new Set(ENDING_ACHIEVEMENTS.map((achievement)=>achievement.id));
        const seen = new Set();
        return parsed.filter((record)=>{
            if (!record || typeof record.id !== "string" || !knownIds.has(record.id) || seen.has(record.id)) return false;
            seen.add(record.id);
            return true;
        });
    } catch (error) {
        console.warn("Could not load ending achievements", error);
        return [];
    }
}
function persistEndingAchievements() {
    try {
        localStorage.setItem(ENDING_ACHIEVEMENT_STORAGE_KEY, JSON.stringify(unlockedEndingAchievements));
    } catch (error) {
        console.warn("Could not save ending achievements", error);
    }
}
function recordCurrentEndingAchievement() {
    const ending = game.state.ending;
    if (!ending) return;
    const achievement = ENDING_ACHIEVEMENTS.find((item)=>item.title === ending.title);
    if (!achievement || unlockedEndingAchievements.some((item)=>item.id === achievement.id)) return;
    unlockedEndingAchievements.push({
        id: achievement.id,
        title: achievement.title,
        generation: ending.generation,
        unlockedAt: new Date().toISOString()
    });
    persistEndingAchievements();
}
function openGameGuide() {
    if (!gameGuideDialog.open) gameGuideDialog.showModal();
}
function openEndingAchievements() {
    recordCurrentEndingAchievement();
    renderEndingAchievements();
    if (!endingAchievementsDialog.open) endingAchievementsDialog.showModal();
}
function renderEndingAchievements() {
    const unlockedById = new Map(unlockedEndingAchievements.map((record)=>[
            record.id,
            record
        ]));
    const unlockedCount = ENDING_ACHIEVEMENTS.filter((item)=>unlockedById.has(item.id)).length;
    const progress = ENDING_ACHIEVEMENTS.length > 0 ? Math.round(unlockedCount / ENDING_ACHIEVEMENTS.length * 100) : 0;
    const categorySummary = [
        "he",
        "route",
        "survival"
    ].map((category)=>{
        const items = ENDING_ACHIEVEMENTS.filter((item)=>item.category === category);
        const count = items.filter((item)=>unlockedById.has(item.id)).length;
        return `${ENDING_ACHIEVEMENT_CATEGORY_LABELS[category]} ${count}/${items.length}`;
    }).join(" · ");
    endingAchievementCount.textContent = `已达成 ${unlockedCount} / ${ENDING_ACHIEVEMENTS.length}`;
    endingAchievementSummary.textContent = categorySummary;
    endingAchievementProgress.style.width = `${progress}%`;
    endingAchievementProgress.parentElement?.setAttribute("aria-valuenow", String(progress));
    endingAchievementGrid.innerHTML = ENDING_ACHIEVEMENTS.map((achievement)=>{
        const unlocked = unlockedById.get(achievement.id);
        return `
      <article class="ending-achievement-card ${achievement.category} ${unlocked ? "is-unlocked" : "is-locked"}">
        <div class="ending-achievement-meta">
          <span class="ending-achievement-category">${ENDING_ACHIEVEMENT_CATEGORY_LABELS[achievement.category]}</span>
          <span class="ending-achievement-state">${unlocked ? "已达成" : "尚未达成"}</span>
        </div>
        <h3>${escapeHtml(achievement.title)}</h3>
        <p>${escapeHtml(achievement.condition)}</p>
        <div class="ending-achievement-foot">
          ${unlocked ? `首次达成 · 第 ${unlocked.generation} 代` : "达成后会在这里留下记录"}
        </div>
      </article>
    `;
    }).join("");
}
function saveGame(show = false) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(game.state));
        saveState.textContent = `已保存 ${new Date().toLocaleTimeString("zh-CN", {
            hour: "2-digit",
            minute: "2-digit"
        })}`;
        if (show) toast("进度已保存");
    } catch (error) {
        saveState.textContent = "浏览器禁止本地保存";
        if (show) toast("保存失败，请导出 JSON");
    }
}
function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char)=>({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
}
function formatNumber(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
function treatmentConditionLabel(person) {
    const conditions = [
        person.heavyInjury ? "重伤" : "",
        person.lightInjury ? "轻伤" : "",
        person.infection ? "感染" : ""
    ].filter(Boolean);
    return conditions.length > 0 ? conditions.join("、") : "健康不满";
}
function toast(message) {
    toastElement.textContent = message;
    toastElement.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(()=>toastElement.classList.remove("show"), 2200);
}
function run(operation) {
    try {
        const result = operation();
        if (result && !result.ok) {
            toast(result.message);
            return;
        }
        if (result?.message) toast(result.message);
        selectedActionId = null;
        selectedTargetId = null;
        recordCurrentEndingAchievement();
        saveGame();
        render();
    } catch (error) {
        console.error(error);
        toast(error instanceof Error ? error.message : "操作失败");
    }
}
function phaseNumber(phase) {
    if (phase === "ready") return 1;
    if ([
        "eventDecision",
        "migration"
    ].includes(phase)) return 2;
    if ([
        "action",
        "secondAction"
    ].includes(phase)) return phase === "secondAction" ? 4 : 3;
    if ([
        "allianceDecision",
        "unexpectedDecision",
        "seasonEnd"
    ].includes(phase)) return 5;
    if (phase === "frailtyDecision") return 6;
    if ([
        "endingChoice",
        "survivalDecision",
        "ended"
    ].includes(phase)) return 7;
    return 1;
}
function renderHeader() {
    const population = game.population();
    const pregnant = game.state.pregnancy.filter((row)=>game.person(row.motherId)).length;
    metaStrip.innerHTML = `
    <span class="meta-chip">第 ${game.state.generation} 代</span>
    <span class="meta-chip">${SEASON_LABELS[game.season]}</span>
    <span class="meta-chip">${escapeHtml(game.state.camp)}</span>
    <span class="meta-chip">人口 ${population}</span>
    <span class="meta-chip">孕产妇 ${pregnant}</span>
  `;
    seedLabel.textContent = `seed ${game.state.seed}`;
    sceneHeader.innerHTML = `
    <div class="scene-kicker">第 ${game.state.generation} 代 · ${SEASON_LABELS[game.season]} · 阶段 ${phaseNumber(game.state.phase)}</div>
    <h2 class="scene-title">${phaseTitle()}</h2>
    <p class="scene-subtitle">${escapeHtml(game.state.lastMessage)}</p>
  `;
}
function phaseTitle() {
    const phase = game.state.phase;
    if (phase === "ready") return "让这一季开始";
    if (phase === "eventDecision") return "先处理正在发生的事";
    if (phase === "migration") return "决定是否带着营地移动";
    if (phase === "action") return "选择这一季的行动";
    if (phase === "secondAction") return "秋收还有一次行动";
    if (phase === "allianceDecision") return "外部关系出现窗口";
    if (phase === "unexpectedDecision") return "意外打断了计划";
    if (phase === "seasonEnd") return "行动结果与意外结算";
    if (phase === "frailtyDecision") return "长者的衰弱需要安排";
    if (phase === "survivalDecision") return "群体正在失去凝聚力";
    if (phase === "endingChoice") return "这个群体选择了怎样生活";
    if (phase === "ended") return game.state.ending?.title ?? "故事结束";
    return "规则状态";
}
function ageClass(age) {
    if (age < 10) return "儿童";
    if (age < 40) return "成人";
    return "长者";
}
function trendDescription(name) {
    if (name === "海侵与咸水") return "河口食物 -1；河口过冬额外消耗燃料 1 或材料 1。";
    if (name === "湿地扩张") return "湖沼采集与捕鱼食物 +1；湖沼夏季疾病测试 -1。";
    if (name === "邻族压力") return "接触邻族与联盟测试 +1；网络为 0 时凝聚力 -1。";
    return "尚未定义的趋势效果。";
}
function renderPersistentStatus() {
    const trend = game.state.currentTrend;
    const trendStart = trend ? game.state.generation % 2 === 0 ? game.state.generation : game.state.generation - 1 : 0;
    const trendPeriod = trendStart > 0 ? `第 ${trendStart}—${trendStart + 1} 代生效` : "尚未生效";
    persistentStatus.innerHTML = `
    <div class="compact-resources">
      ${RESOURCE_KEYS.map((key)=>`
        <div class="compact-resource ${game.state.resources[key] < 1 ? "low" : ""}">
          <span>${RESOURCE_LABELS[key]}</span>
          <strong>${formatNumber(game.state.resources[key])}</strong>
        </div>
      `).join("")}
    </div>
    <div class="trend-banner">
      <strong>长期趋势</strong>
      <p>${trend ? `<b>${escapeHtml(trend)}</b>：${escapeHtml(trendDescription(trend))}` : "尚未抽取；第 2、4、6…代开始时从三项趋势中抽取一项。"}</p>
      <span class="trend-period">${trend ? `生效中 · ${trendPeriod}` : "未生效"}</span>
    </div>
  `;
}
function renderWizard() {
    const phase = game.state.phase;
    if (phase === "ready") return renderReady();
    if (phase === "eventDecision") return renderDecision(game.state.pendingDecision);
    if (phase === "migration") return renderMigration();
    if (phase === "action" || phase === "secondAction") return renderActions();
    if ([
        "allianceDecision",
        "unexpectedDecision",
        "frailtyDecision",
        "survivalDecision",
        "endingChoice"
    ].includes(phase)) {
        return renderDecision(game.state.pendingDecision);
    }
    if (phase === "seasonEnd") return renderSeasonEnd();
    if (phase === "ended") return renderEnding();
    app.innerHTML = `<section class="wizard-section"><h2 class="wizard-title">规则引擎停在未知阶段</h2><p>${escapeHtml(phase)}</p></section>`;
}
function renderReady() {
    const trend = game.state.currentTrend ? `<span class="insight-pill">长期趋势：${escapeHtml(game.state.currentTrend)}</span>` : `<span class="insight-pill">尚未抽到长期趋势</span>`;
    const pendingUnexpected = game.state.pendingUnexpected ? `<span class="insight-pill">本代意外已经封存，将在指定季节行动后公开</span>` : "";
    app.innerHTML = `
    <section class="wizard-section">
      <span class="step-badge">${game.state.generation} 代 · ${SEASON_LABELS[game.season]}</span>
      <h2 class="wizard-title">${SEASON_LABELS[game.season]}开始</h2>
      <p class="wizard-copy">季节开始会先扣除食物与冬季燃料，再公开一张地点加权事件。事件结算之后才进入迁徙和行动，因此无法在事件出现前预先锁死本季计划。</p>
      <div class="insight-strip">${trend}${pendingUnexpected}<span class="insight-pill">营地：${escapeHtml(game.state.camp)}</span></div>
      <div class="button-row">
        <button class="button primary" data-command="beginSeason">开始 ${SEASON_LABELS[game.season]}</button>
      </div>
    </section>
  `;
}
function eventDecisionBanner() {
    const event = game.state.season.event;
    if (!event) return "";
    return `
    <div class="event-banner">
      <h3><span class="event-index">${event.card}</span>${SEASON_LABELS[event.season]}事件：${escapeHtml(event.name)}</h3>
      <p>${escapeHtml(event.text)}</p>
    </div>
  `;
}
function resolvedEventBanner() {
    const event = game.state.season.event;
    if (!event) return "";
    const result = event.resultText || (event.resolved ? "事件已结算" : "尚待裁定");
    return `
    <div class="event-banner">
      <h3><span class="event-index">${event.card}</span>${SEASON_LABELS[event.season]}事件：${escapeHtml(event.name)}</h3>
      <p>${escapeHtml(result)}</p>
    </div>
  `;
}
function renderDecision(decision) {
    if (!decision) {
        app.innerHTML = `<section class="wizard-section"><h2 class="wizard-title">待选项丢失</h2><p>请导入较早的存档。</p></section>`;
        return;
    }
    app.innerHTML = `
    <section class="wizard-section">
      <span class="step-badge">${decision.kind === "ending" ? "路线判定" : "需要裁定"}</span>
      <h2 class="wizard-title">${escapeHtml(decision.title)}</h2>
      <p class="wizard-copy">${escapeHtml(decision.body)}</p>
      ${decision.kind === "event" ? eventDecisionBanner() : ""}
      ${decision.kind === "unexpected" ? actionSummaryHtml() : ""}
      ${decision.kind === "alliance" ? actionSummaryHtml() : ""}
      <div class="option-list">
        ${decision.options.map((option)=>`
          <button class="option-button" type="button" data-decision="${escapeHtml(option.id)}" ${option.disabled ? "disabled" : ""}>
            <strong>${escapeHtml(option.label)}</strong>
            <span>${escapeHtml(option.disabled ? option.disabledReason : option.detail)}</span>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}
function renderMigration() {
    const options = game.getMigrationOptions();
    app.innerHTML = `
    <section class="wizard-section">
      <span class="step-badge">事件之后 · 行动之前</span>
      <h2 class="wizard-title">营地是否移动？</h2>
      <p class="wizard-copy">迁徙不占行动，每季最多一次。普通迁徙只能前往相邻营地，并支付食物 2、储藏 -1、住所 -1。</p>
      ${resolvedEventBanner()}
      <div class="migration-grid">
        ${options.map((option)=>`
          <button class="migration-option" type="button" data-migrate="${escapeHtml(option.camp)}" ${option.available ? "" : "disabled"}>
            <strong>${escapeHtml(option.label)}</strong>
            <span class="small muted">${option.available ? `食物 ${option.foodCost} · 储藏 -1 · 住所 -1` : escapeHtml(option.reason)}</span>
          </button>
        `).join("")}
      </div>
      <div class="button-row">
        <button class="button secondary" type="button" data-command="skipMigration">留在 ${escapeHtml(game.state.camp)}，进入行动</button>
      </div>
    </section>
  `;
}
function renderActions() {
    const actions = game.availableActions();
    const selected = actions.find((action)=>action.id === selectedActionId);
    if (selected) {
        const actorOptions = game.actorCandidatesForAction(selected.id);
        const hasKnowledge = game.actionKnowledgeKeys(selected.id).length > 0;
        if (!hasKnowledge && !selected.id.startsWith("train:")) selectedActorId = null;
        if (!actorOptions.some((person)=>person.id === selectedActorId)) {
            selectedActorId = hasKnowledge ? actorOptions[0]?.id ?? null : null;
        }
        if (selected.id === "care-treat") {
            const targets = game.treatablePeople();
            if (!targets.some((person)=>person.id === selectedTargetId)) {
                selectedTargetId = targets[0]?.id ?? null;
            }
        } else {
            selectedTargetId = null;
        }
        const availableKnowledge = game.availableKnowledgeForAction(selected.id);
        if (!availableKnowledge.includes(selectedKnowledgeKey)) {
            selectedKnowledgeKey = availableKnowledge[0] ?? null;
        }
    }
    app.innerHTML = `
    <section class="wizard-section">
      <span class="step-badge">${game.state.phase === "secondAction" ? "秋收额外行动" : "第一张行动卡"}</span>
      <h2 class="wizard-title">${game.state.phase === "secondAction" ? "再做一件不同的事" : "把有限的人手放到哪里？"}</h2>
      <p class="wizard-copy">选择行动、执行者、必要的治疗目标和至多一名相关知识提供者。训练不掷骰；其他行动按骰值结算。</p>
      <div class="action-grid">
        ${actions.map((action)=>renderActionButton(action, selected?.id ?? null)).join("")}
      </div>
      ${selected ? renderActionConfiguration(selected) : `<p class="small muted" style="margin-top:12px">先选一张行动卡查看执行配置。</p>`}
      ${game.state.phase === "secondAction" ? `<div class="button-row"><button class="button secondary" type="button" data-command="skipSecond">放弃第二行动</button></div>` : ""}
    </section>
  `;
}
function renderActionButton(action, selected) {
    return `
    <button class="action-button ${selected === action.id ? "selected" : ""}" type="button"
      data-select-action="${escapeHtml(action.id)}" ${action.available ? "" : "disabled"}>
      <strong>${escapeHtml(action.label)}</strong>
      <div class="action-fields">
        <span><b>条件：</b>${escapeHtml(action.conditions)}</span>
        <span><b>消耗：</b>${escapeHtml(action.cost)}</span>
        <span><b>结果：</b>${escapeHtml(action.outcomes)}</span>
        <span><b>加成：</b>${escapeHtml(action.bonus)}</span>
        ${action.available ? "" : `<span><b>不可用：</b>${escapeHtml(action.reason)}</span>`}
      </div>
    </button>
  `;
}
function renderActionConfiguration(action) {
    const actorOptions = game.actorCandidatesForAction(action.id);
    const knowledgeOptions = game.availableKnowledgeForAction(action.id);
    const training = action.id.startsWith("train:");
    const hasKnowledge = game.actionKnowledgeKeys(action.id).length > 0;
    const randomActor = !training && !hasKnowledge;
    const treatmentTargets = action.id === "care-treat" ? game.treatablePeople() : [];
    return `
    <div class="action-config">
      <label class="field">执行者
        <select id="actorSelect" ${training || randomActor ? "disabled" : ""}>
          ${randomActor ? `<option value="">由规则随机选择</option>` : ""}
          ${!randomActor ? actorOptions.map((person)=>`
            <option value="${person.id}" ${person.id === selectedActorId ? "selected" : ""}>
              ${escapeHtml(person.name)} · ${person.age.toFixed(2)}岁 · ${game.actionKnowledgeKeys(action.id).some((key)=>game.holder(key)?.id === person.id && game.fullKnowledge(key)) ? "+1" : "无知识加成"}
            </option>
          `).join("") : ""}
        </select>
      </label>
      ${action.id === "care-treat" ? `
        <label class="field">被治疗人
          <select id="targetSelect">
            ${treatmentTargets.map((person)=>`
              <option value="${person.id}" ${person.id === selectedTargetId ? "selected" : ""}>
                ${escapeHtml(person.name)} · 健康 ${person.health}/6 · ${treatmentConditionLabel(person)}
              </option>
            `).join("")}
          </select>
        </label>
      ` : ""}
      <label class="field">知识分配
        <select id="knowledgeSelect" ${training || knowledgeOptions.length === 0 ? "disabled" : ""}>
          ${training ? `<option value="${action.id.split(":")[1]}">${KNOWLEDGE_NAMES[action.id.split(":")[1]]}</option>` : ""}
          ${!training && knowledgeOptions.length === 0 ? `<option value="">无完整知识可提供 +1</option>` : ""}
          ${!training ? knowledgeOptions.map((key)=>`
            <option value="${key}" ${key === selectedKnowledgeKey ? "selected" : ""}>
              ${KNOWLEDGE_NAMES[key]} · ${escapeHtml(game.holder(key)?.name ?? "空缺")}
            </option>
          `).join("") : ""}
        </select>
      </label>
      <button class="button primary" type="button" data-command="performAction">确认行动</button>
    </div>
  `;
}
function actionSummaryHtml() {
    const records = game.state.season.actionRecords;
    if (records.length === 0) return `<p class="small muted">本季没有执行行动。</p>`;
    return `
    <div class="action-summary">
      ${records.map((record)=>`
        <div class="summary-row">
          <span class="result-tag ${record.result === "受阻" ? "fail" : record.result === "部分成功" ? "partial" : ""}">${escapeHtml(record.result)}</span>
          <div><strong>${escapeHtml(record.actionLabel)}${record.actorId ? ` · 执行：${escapeHtml(game.peopleName(record.actorId))}` : ""}${record.targetId ? ` · 治疗：${escapeHtml(game.peopleName(record.targetId))}` : ""}</strong><br><span class="small muted">${escapeHtml(record.text)}</span></div>
        </div>
      `).join("")}
    </div>
  `;
}
function resolvedUnexpectedBanner() {
    const unexpected = game.state.season.unexpected;
    if (!unexpected) return "";
    return `
    <div class="event-banner" style="background:linear-gradient(135deg,#f4e1db,#fff7f3);border-color:#d9b5aa">
      <h3><span class="event-index">${unexpected.card}</span>本季意外：${escapeHtml(unexpected.name)}</h3>
      <p>${escapeHtml(unexpected.resultText || (unexpected.triggered ? "意外已触发" : "尚未触发"))}</p>
    </div>
  `;
}
function renderSeasonEnd() {
    app.innerHTML = `
    <section class="wizard-section">
      <span class="step-badge">行动完成 · 意外已结算</span>
      <h2 class="wizard-title">行动与意外结果</h2>
      <p class="wizard-copy">接下来统一增加年龄、检查死亡与衰弱、移除早夭婴儿、结算分娩和受孕。年龄每季一律 +1.25 岁。</p>
      ${resolvedEventBanner()}
      ${actionSummaryHtml()}
      ${resolvedUnexpectedBanner()}
      <div class="button-row">
        <button class="button primary" type="button" data-command="finishSeason">结算年龄、出生与死亡</button>
      </div>
    </section>
  `;
}
function renderEnding() {
    const ending = game.state.ending;
    app.innerHTML = `
    <section class="ending-card">
      <span class="step-badge">第 ${ending?.generation ?? game.state.generation} 代结局</span>
      <h2>${escapeHtml(ending?.title ?? "故事结束")}</h2>
      <p>${escapeHtml(ending?.text ?? "")}</p>
      <div class="winner-actions">
        <button class="button primary" type="button" data-command="openNewGame">随机再开一局</button>
        <button class="button secondary" type="button" data-command="exportGame">导出这局战报存档</button>
      </div>
    </section>
  `;
}
function renderSidePanel() {
    sideTabs.querySelectorAll("[data-side-tab]").forEach((button)=>{
        button.classList.toggle("active", button.dataset.sideTab === activeSideTab);
    });
    if (activeSideTab === "log") renderLog();
    else if (activeSideTab === "people") renderPeople();
    else if (activeSideTab === "knowledge") renderKnowledge();
    else renderRouteWitness();
}
function renderRouteWitness() {
    const counters = game.state.counters;
    sidePanel.innerHTML = `
    <div class="progress-block">
      <h3>路线见证</h3>
      <div class="progress-row"><span>野稻管理</span><strong>${counters.wildRiceProgress}</strong></div>
      <div class="progress-row"><span>制作进度</span><strong>${counters.craftProgress}</strong></div>
      <div class="progress-row"><span>实际联盟</span><strong>${counters.actualAlliances}</strong></div>
      <div class="progress-row"><span>累计迁徙</span><strong>${counters.totalMigrations}</strong></div>
      <div class="progress-row"><span>河口代次</span><strong>${counters.estuaryGenerations}</strong></div>
      <div class="progress-row"><span>成功跨群往来</span><strong>${counters.crossgroupSuccessCount}</strong></div>
      <div class="progress-row"><span>儿童活到 10 岁</span><strong>${counters.childrenReachedTen}</strong></div>
      <div class="progress-row"><span>完整知识</span><strong>${game.completeKnowledgeCount()} / 5</strong></div>
      <p class="small muted" style="margin-top:9px">联盟提议：成功接触且网络 = 3 时立即出现；秋季窗口在两张行动结算后另行检查。</p>
    </div>
  `;
}
function renderPeople() {
    const people = game.state.people.slice().sort((a, b)=>{
        const deadA = [
            "死亡",
            "已迁出"
        ].includes(a.status) ? 1 : 0;
        const deadB = [
            "死亡",
            "已迁出"
        ].includes(b.status) ? 1 : 0;
        return deadA - deadB || a.id - b.id;
    });
    sidePanel.innerHTML = `
    <div class="person-list">
      ${people.map((person)=>`
        <div class="person-row ${[
            "死亡",
            "已迁出"
        ].includes(person.status) ? "dead" : ""}">
          <div class="person-line">
            <strong>${escapeHtml(person.name)}</strong>
            <div class="healthbar" title="健康 ${person.health}/6">${Array.from({
            length: 6
        }, (_, index)=>`<i class="${index < person.health ? "on" : ""}"></i>`).join("")}</div>
          </div>
          <div class="person-tags">
            <span class="tag">${person.sex} · ${person.age.toFixed(2)}岁</span>
            <span class="tag">${ageClass(person.age)}</span>
            ${![
            "儿童",
            "成人",
            "长者"
        ].includes(person.roleLabel) ? `<span class="tag">${escapeHtml(person.roleLabel)}</span>` : ""}
            <span class="tag">${escapeHtml(person.status)}</span>
            ${game.state.pregnancy.some((row)=>row.motherId === person.id && game.person(row.motherId)) ? `<span class="tag">孕期 · 预计${SEASON_LABELS[SEASONS[game.state.pregnancy.find((row)=>row.motherId === person.id).dueTurn % 4]]}</span>` : ""}
            ${person.frail ? `<span class="tag">衰弱</span>` : ""}
            ${person.infection ? `<span class="tag">感染</span>` : ""}
            ${person.lightInjury ? `<span class="tag">轻伤</span>` : ""}
            ${person.heavyInjury ? `<span class="tag">重伤</span>` : ""}
            ${person.spouseId ? `<span class="tag">配偶：${escapeHtml(game.peopleName(person.spouseId))}</span>` : ""}
            ${person.id === game.state.caregiverId ? `<span class="tag">照护者</span>` : ""}
            ${person.id === game.state.translatorId ? `<span class="tag">族际中间人</span>` : ""}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}
function renderKnowledge() {
    sidePanel.innerHTML = `
    <div class="knowledge-stack">
      ${KNOWLEDGE_ORDER.map((key)=>{
        const card = game.knowledge(key);
        const status = card.lost || card.holderId === null ? "失去传承" : card.level >= 3 ? "完整" : "脆弱";
        const klass = status === "完整" ? "complete" : status === "脆弱" ? "fragile" : "lost";
        const statusLabel = status === "失去传承" ? status : `${status} ${card.level}`;
        const holder = game.person(card.holderId);
        const holderText = holder ? `${holder.name} · ${ageClass(holder.age)} · ${holder.age.toFixed(2)}岁` : "空缺";
        return `
          <article class="knowledge-row ${klass === "lost" ? "lost" : ""}">
            <h3>${KNOWLEDGE_NAMES[key]}<span class="status ${klass}">${statusLabel}</span></h3>
            <p>当前：${escapeHtml(holderText)}${holder && holder.age < 10 ? " · 儿童持有，不提供 +1" : ""}</p>
            ${card.heirIds.map((id, index)=>{
            const heir = game.person(id);
            const text = heir ? `${heir.name} · ${ageClass(heir.age)} · ${heir.age.toFixed(2)}岁` : "空缺";
            return `<p>传承 ${index + 1}：${escapeHtml(text)} · 熟练度 ${heir ? card.heirLevels[index] : 0}</p>`;
        }).join("")}
          </article>
        `;
    }).join("")}
    </div>
  `;
}
function renderLog() {
    const logs = game.state.logs.slice(-80).reverse();
    sidePanel.innerHTML = logs.length === 0 ? `<div class="empty-state">事件与行动会在这里留下记录。</div>` : `<div class="log-list">${logs.map((entry)=>{
        const tone = entry.tone ?? (entry.kind === "ending" || /死亡|难产/.test(entry.title) ? "danger" : "normal");
        return `
      <article class="log-item" data-kind="${entry.kind}" data-tone="${tone}">
        <div class="log-meta">第 ${entry.generation} 代 · ${SEASON_LABELS[entry.season]}</div>
        <strong>${escapeHtml(entry.title)}</strong>
        <p>${escapeHtml(entry.text)}</p>
      </article>
    `;
    }).join("")}</div>`;
}
function render() {
    renderHeader();
    renderPersistentStatus();
    renderWizard();
    renderSidePanel();
}
function performSelectedAction() {
    if (!selectedActionId) {
        toast("先选一张行动卡");
        return;
    }
    const knowledgeSelect = document.querySelector("#knowledgeSelect");
    const actorSelect = document.querySelector("#actorSelect");
    const targetSelect = document.querySelector("#targetSelect");
    const action = game.availableActions().find((entry)=>entry.id === selectedActionId);
    const knowledgeKey = selectedActionId.startsWith("train:") ? selectedActionId.split(":")[1] : knowledgeSelect?.value ? knowledgeSelect.value : null;
    const hasKnowledge = game.actionKnowledgeKeys(selectedActionId).length > 0;
    run(()=>game.performAction({
            actionId: selectedActionId,
            actorId: selectedActionId.startsWith("train:") ? game.holder(knowledgeKey).id : hasKnowledge ? Number(actorSelect?.value || selectedActorId) : null,
            targetId: selectedActionId === "care-treat" ? Number(targetSelect?.value || selectedTargetId) : null,
            knowledgeKey,
            mode: action?.mode
        }));
}
function exportGame() {
    const blob = new Blob([
        JSON.stringify(game.state, null, 2)
    ], {
        type: "application/json;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `泥与水之间_第${game.state.generation}代_${SEASON_LABELS[game.season]}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}
function randomInteger(maxExclusive) {
    if (maxExclusive <= 1) return 0;
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    return random[0] % maxExclusive;
}
function startRandomNewGame() {
    let seed = randomInteger(100_000_000);
    if (seed === game.state.seed) seed = (seed + 1) % 100_000_000;
    const probe = MudWaterGame.newGame({
        seed
    });
    const holders = new Set(probe.state.knowledge.map((card)=>card.holderId));
    const nonHolders = probe.adults().filter((person)=>!holders.has(person.id));
    const rolePool = nonHolders.length >= 2 ? nonHolders : probe.adults();
    const caregiverId = rolePool[randomInteger(rolePool.length)].id;
    const translatorPool = rolePool.filter((person)=>person.id !== caregiverId);
    const translatorId = (translatorPool.length > 0 ? translatorPool : rolePool)[randomInteger(Math.max(1, translatorPool.length || rolePool.length))].id;
    game = MudWaterGame.newGame({
        seed,
        caregiverId,
        translatorId
    });
    selectedActionId = null;
    selectedActorId = null;
    selectedTargetId = null;
    selectedKnowledgeKey = null;
    activeSideTab = "log";
    saveGame();
    render();
    toast(`随机新局开始 · seed ${seed} · 照护者 ${game.peopleName(caregiverId)} · 族际中间人 ${game.peopleName(translatorId)}`);
    openGameGuide();
}
document.addEventListener("click", (event)=>{
    const target = event.target;
    const decisionButton = target.closest("[data-decision]");
    if (decisionButton) {
        run(()=>game.resolveDecision(decisionButton.dataset.decision));
        return;
    }
    const migrationButton = target.closest("[data-migrate]");
    if (migrationButton) {
        run(()=>game.migrate(migrationButton.dataset.migrate));
        return;
    }
    const actionButton = target.closest("[data-select-action]");
    if (actionButton) {
        selectedActionId = actionButton.dataset.selectAction;
        selectedActorId = game.state.caregiverId ?? game.adults()[0]?.id ?? null;
        selectedTargetId = selectedActionId === "care-treat" ? game.treatablePeople()[0]?.id ?? null : null;
        selectedKnowledgeKey = game.availableKnowledgeForAction(selectedActionId)[0] ?? null;
        renderWizard();
        return;
    }
    const command = target.closest("[data-command]")?.dataset.command;
    if (!command) return;
    if (command === "beginSeason") run(()=>game.beginSeason());
    else if (command === "skipMigration") run(()=>game.skipMigration());
    else if (command === "performAction") performSelectedAction();
    else if (command === "skipSecond") run(()=>game.skipSecondAction());
    else if (command === "finishSeason") run(()=>game.finishSeason());
    else if (command === "exportGame") exportGame();
    else if (command === "openNewGame") startRandomNewGame();
});
document.addEventListener("change", (event)=>{
    const target = event.target;
    if (target.id === "actorSelect") selectedActorId = Number(target.value);
    if (target.id === "targetSelect") selectedTargetId = Number(target.value);
    if (target.id === "knowledgeSelect") selectedKnowledgeKey = target.value || null;
});
sideTabs.addEventListener("click", (event)=>{
    const button = event.target.closest("[data-side-tab]");
    if (!button) return;
    activeSideTab = button.dataset.sideTab;
    renderSidePanel();
});
document.querySelector("#saveButton").addEventListener("click", ()=>saveGame(true));
document.querySelector("#exportButton").addEventListener("click", exportGame);
document.querySelector("#newGameButton").addEventListener("click", startRandomNewGame);
document.querySelector("#endingAchievementsButton").addEventListener("click", openEndingAchievements);
document.querySelector("#closeGameGuide").addEventListener("click", ()=>gameGuideDialog.close());
document.querySelector("#startGameGuide").addEventListener("click", ()=>gameGuideDialog.close());
gameGuideDialog.addEventListener("click", (event)=>{
    if (event.target === gameGuideDialog) gameGuideDialog.close();
});
document.querySelector("#importButton").addEventListener("click", ()=>{
    document.querySelector("#importFile").click();
});
document.querySelector("#importFile").addEventListener("change", async (event)=>{
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;
    try {
        game = MudWaterGame.fromJSON(await file.text());
        selectedActionId = null;
        recordCurrentEndingAchievement();
        saveGame();
        render();
        toast("存档已导入");
    } catch (error) {
        console.error(error);
        toast("导入失败：不是有效的 v0.14.x 存档");
    } finally{
        input.value = "";
    }
});
document.querySelector("#closeEndingAchievements").addEventListener("click", ()=>endingAchievementsDialog.close());
endingAchievementsDialog.addEventListener("click", (event)=>{
    if (event.target === endingAchievementsDialog) endingAchievementsDialog.close();
});
saveState.textContent = "本地自动存档";
recordCurrentEndingAchievement();
render();
openGameGuide();


//# sourceURL=D:\Applications\CodexData\脑洞\web-game\src\app.ts