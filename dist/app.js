import { ENDING_ACHIEVEMENTS, ENDING_ACHIEVEMENT_CATEGORY_LABELS, KNOWLEDGE_NAMES, KNOWLEDGE_ORDER, RESOURCE_KEYS, RESOURCE_CAPS, RESOURCE_LABELS, SEASONS, SEASON_LABELS, MudWaterGame } from "./engine/index.js";
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
const relationshipDialog = document.querySelector("#relationshipDialog");
const relationshipSummary = document.querySelector("#relationshipSummary");
const relationshipViewport = document.querySelector("#relationshipViewport");
const relationshipGraph = document.querySelector("#relationshipGraph");
const relationshipZoomValue = document.querySelector("#relationshipZoomValue");
const relationshipClearSelectionButton = document.querySelector("#relationshipClearSelection");
let game = loadGame();
let unlockedEndingAchievements = loadEndingAchievements();
let activeSideTab = "log";
let selectedActionId = null;
let selectedActorId = null;
let selectedTargetId = null;
let selectedKnowledgeKey = null;
let toastTimer = 0;
let relationshipZoom = 1;
let relationshipGraphWidth = 1;
let relationshipGraphHeight = 1;
let selectedRelationshipPersonId = null;
let relationshipGraphDrag = null;
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
function openRelationshipGraph() {
    renderRelationshipGraph();
    if (!relationshipDialog.open) relationshipDialog.showModal();
    window.requestAnimationFrame(()=>fitRelationshipGraph(false));
}
function refreshRelationshipGraphIfOpen() {
    if (relationshipDialog.open) renderRelationshipGraph();
}
const RELATIONSHIP_NODE_WIDTH = 158;
const RELATIONSHIP_NODE_HEIGHT = 72;
const RELATIONSHIP_NODE_GAP = 14;
const RELATIONSHIP_UNIT_GAP = 24;
const RELATIONSHIP_ROW_GAP = 50;
const RELATIONSHIP_PANEL_PAD = 22;
const RELATIONSHIP_PANEL_HEADER = 42;
const RELATIONSHIP_PARENT_COLORS = [
    "#4f7b68",
    "#b36d4d",
    "#55789a",
    "#a27c3e",
    "#806a99",
    "#43878a",
    "#a45d72",
    "#708348",
    "#6d739f",
    "#9c6d42",
    "#4f7d94",
    "#7d6847"
];
function relationshipParentColorIndex(parentKey) {
    let hash = 0;
    for (const char of parentKey)hash = hash * 31 + char.charCodeAt(0) >>> 0;
    return hash % RELATIONSHIP_PARENT_COLORS.length;
}
function resolvedRelationshipRanks(people) {
    const byId = new Map(people.map((person)=>[
            person.id,
            person
        ]));
    const resolved = new Map();
    let highestKnownRank = 0;
    for (const person of people){
        if (person.rank !== null) {
            resolved.set(person.id, person.rank);
            highestKnownRank = Math.max(highestKnownRank, person.rank);
        }
    }
    for(let pass = 0; pass < people.length + 2; pass += 1){
        let changed = false;
        for (const person of people){
            if (resolved.has(person.id)) continue;
            const spouseRank = person.spouseId === null ? undefined : resolved.get(person.spouseId);
            if (spouseRank !== undefined) {
                resolved.set(person.id, spouseRank);
                changed = true;
                continue;
            }
            const parentRanks = [
                person.fatherId,
                person.motherId
            ].filter((id)=>id !== null && byId.has(id)).map((id)=>resolved.get(id)).filter((rank)=>rank !== undefined);
            if (parentRanks.length > 0) {
                resolved.set(person.id, Math.max(...parentRanks) + 1);
                changed = true;
            }
        }
        if (!changed) break;
    }
    const fallbackRank = highestKnownRank + 1;
    for (const person of people){
        if (!resolved.has(person.id)) resolved.set(person.id, fallbackRank);
    }
    return resolved;
}
function buildRelationshipLayout(people, parentLinks, spouseLinks) {
    const byId = new Map(people.map((person)=>[
            person.id,
            person
        ]));
    const layoutRanks = resolvedRelationshipRanks(people);
    const unionParent = new Map(people.map((person)=>[
            person.id,
            person.id
        ]));
    const findRoot = (id)=>{
        let root = id;
        while(unionParent.get(root) !== root)root = unionParent.get(root);
        let cursor = id;
        while(cursor !== root){
            const next = unionParent.get(cursor);
            unionParent.set(cursor, root);
            cursor = next;
        }
        return root;
    };
    const union = (aId, bId)=>{
        const aRoot = findRoot(aId);
        const bRoot = findRoot(bId);
        if (aRoot !== bRoot) unionParent.set(bRoot, aRoot);
    };
    for (const link of parentLinks){
        for (const parentId of link.parentIds)union(link.childId, parentId);
    }
    for (const link of spouseLinks)union(link.aId, link.bId);
    const grouped = new Map();
    for (const person of people.slice().sort((a, b)=>a.id - b.id)){
        const key = findRoot(person.id);
        const members = grouped.get(key) ?? [];
        members.push(person);
        grouped.set(key, members);
    }
    const componentEntries = [
        ...grouped.entries()
    ].sort(([aKey, a], [bKey, b])=>{
        const aRank = Math.min(...a.map((person)=>layoutRanks.get(person.id)));
        const bRank = Math.min(...b.map((person)=>layoutRanks.get(person.id)));
        const aMin = Math.min(...a.map((person)=>person.id));
        const bMin = Math.min(...b.map((person)=>person.id));
        return aRank - bRank || aMin - bMin || aKey - bKey;
    });
    const components = componentEntries.map(([key, members], index)=>{
        const memberIds = new Set(members.map((person)=>person.id));
        const sorted = members.slice().sort((a, b)=>layoutRanks.get(a.id) - layoutRanks.get(b.id) || a.id - b.id);
        const minDepth = Math.min(...sorted.map((person)=>layoutRanks.get(person.id)));
        const maxDepth = Math.max(...sorted.map((person)=>layoutRanks.get(person.id)));
        const rows = new Map();
        for (const person of sorted){
            const depth = layoutRanks.get(person.id);
            const row = rows.get(depth) ?? [];
            row.push(person);
            rows.set(depth, row);
        }
        const rowUnits = [];
        for (const depth of [
            ...rows.keys()
        ].sort((a, b)=>a - b)){
            const used = new Set();
            const units = [];
            for (const person of rows.get(depth) ?? []){
                if (used.has(person.id)) continue;
                const spouse = person.spouseId === null ? null : byId.get(person.spouseId);
                const canPair = spouse && memberIds.has(spouse.id) && !used.has(spouse.id) && layoutRanks.get(spouse.id) === depth;
                const unit = canPair ? [
                    person,
                    spouse
                ].sort((a, b)=>a.id - b.id) : [
                    person
                ];
                for (const member of unit)used.add(member.id);
                units.push(unit);
            }
            rowUnits.push(units);
        }
        const unitWidth = (unit)=>unit.length * RELATIONSHIP_NODE_WIDTH + (unit.length - 1) * RELATIONSHIP_NODE_GAP;
        const rowWidths = rowUnits.map((units)=>units.reduce((sum, unit)=>sum + unitWidth(unit), 0) + Math.max(0, units.length - 1) * RELATIONSHIP_UNIT_GAP);
        const width = Math.max(250, ...rowWidths.map((rowWidth)=>rowWidth + RELATIONSHIP_PANEL_PAD * 2));
        const height = RELATIONSHIP_PANEL_HEADER + rowUnits.length * RELATIONSHIP_NODE_HEIGHT + Math.max(0, rowUnits.length - 1) * RELATIONSHIP_ROW_GAP + RELATIONSHIP_PANEL_PAD;
        const nodes = [];
        let rowY = RELATIONSHIP_PANEL_HEADER;
        for (const units of rowUnits){
            const rowWidth = units.reduce((sum, unit)=>sum + unitWidth(unit), 0) + Math.max(0, units.length - 1) * RELATIONSHIP_UNIT_GAP;
            let rowX = (width - rowWidth) / 2;
            for (const unit of units){
                for (const person of unit){
                    nodes.push({
                        person,
                        componentKey: index,
                        depth: layoutRanks.get(person.id),
                        x: rowX,
                        y: rowY
                    });
                    rowX += RELATIONSHIP_NODE_WIDTH + RELATIONSHIP_NODE_GAP;
                }
                rowX += RELATIONSHIP_UNIT_GAP - RELATIONSHIP_NODE_GAP;
            }
            rowY += RELATIONSHIP_NODE_HEIGHT + RELATIONSHIP_ROW_GAP;
        }
        return {
            key: index,
            nodes,
            width,
            height,
            x: 0,
            y: 0,
            minDepth,
            maxDepth,
            hasUnranked: sorted.some((person)=>person.rank === null)
        };
    });
    const componentGapX = 38;
    const componentGapY = 34;
    const canvasMargin = 26;
    const rowLimit = 1100;
    const packedRows = [];
    const rankGroups = new Map();
    for (const component of components){
        const group = rankGroups.get(component.minDepth) ?? [];
        group.push(component);
        rankGroups.set(component.minDepth, group);
    }
    for (const rank of [
        ...rankGroups.keys()
    ].sort((a, b)=>a - b)){
        const groupRows = [];
        const group = (rankGroups.get(rank) ?? []).sort((a, b)=>b.width - a.width || b.height - a.height || a.key - b.key);
        for (const component of group){
            const targetRow = groupRows.find((row)=>{
                const rowWidth = row.reduce((sum, entry)=>sum + entry.width, 0) + row.length * componentGapX;
                return rowWidth + component.width <= rowLimit;
            });
            if (targetRow) targetRow.push(component);
            else groupRows.push([
                component
            ]);
        }
        packedRows.push(...groupRows);
    }
    const rowWidths = packedRows.map((row)=>row.reduce((sum, component)=>sum + component.width, 0) + Math.max(0, row.length - 1) * componentGapX);
    const width = Math.max(860, ...rowWidths.map((rowWidth)=>rowWidth + canvasMargin * 2));
    let rowY = canvasMargin;
    for(let rowIndex = 0; rowIndex < packedRows.length; rowIndex += 1){
        const row = packedRows[rowIndex];
        const rowHeight = Math.max(...row.map((component)=>component.height));
        let x = canvasMargin + (width - canvasMargin * 2 - rowWidths[rowIndex]) / 2;
        for (const component of row){
            component.x = x;
            component.y = rowY;
            for (const node of component.nodes){
                node.x += component.x;
                node.y += component.y;
            }
            x += component.width + componentGapX;
        }
        rowY += rowHeight + componentGapY;
    }
    const height = Math.max(360, rowY - componentGapY + canvasMargin);
    components.sort((a, b)=>a.minDepth - b.minDepth || a.key - b.key);
    return {
        nodes: components.flatMap((component)=>component.nodes),
        components,
        width,
        height
    };
}
function relationshipNodeBoundaryPoint(node, towardX, towardY) {
    const centerX = node.x + RELATIONSHIP_NODE_WIDTH / 2;
    const centerY = node.y + RELATIONSHIP_NODE_HEIGHT / 2;
    const deltaX = towardX - centerX;
    const deltaY = towardY - centerY;
    const scaleX = deltaX === 0 ? Number.POSITIVE_INFINITY : RELATIONSHIP_NODE_WIDTH / 2 / Math.abs(deltaX);
    const scaleY = deltaY === 0 ? Number.POSITIVE_INFINITY : RELATIONSHIP_NODE_HEIGHT / 2 / Math.abs(deltaY);
    const scale = Math.min(scaleX, scaleY);
    return {
        x: centerX + deltaX * scale,
        y: centerY + deltaY * scale
    };
}
function renderRelationshipGraph() {
    const allPeople = new Map(game.state.people.map((person)=>[
            person.id,
            person
        ]));
    const currentPeople = game.state.people.filter((person)=>person.status === "同族" || person.status === "尚未同族");
    const displayIds = new Set(currentPeople.map((person)=>person.id));
    for (const person of currentPeople){
        for (const parentId of [
            person.fatherId,
            person.motherId
        ]){
            if (parentId === null) continue;
            const parent = allPeople.get(parentId);
            if (parent?.status === "死亡") displayIds.add(parent.id);
        }
    }
    const displayPeople = game.state.people.filter((person)=>displayIds.has(person.id)).sort((a, b)=>a.id - b.id);
    if (displayPeople.length === 0) {
        relationshipSummary.textContent = "本局当前没有可显示的在世族人或谱系锚点。";
        relationshipGraph.innerHTML = `<div class="relationship-empty">当前没有可显示的人物关系。</div>`;
        relationshipGraphWidth = 860;
        relationshipGraphHeight = 360;
        relationshipZoomValue.textContent = "100%";
        return;
    }
    const parentLinks = displayPeople.flatMap((person)=>{
        const parentIds = [
            person.fatherId,
            person.motherId
        ].filter((id)=>id !== null && displayIds.has(id)).filter((id, index, ids)=>ids.indexOf(id) === index);
        return parentIds.length > 0 ? [
            {
                childId: person.id,
                parentIds
            }
        ] : [];
    });
    const spouseLinks = [];
    const spousePairs = new Set();
    for (const person of displayPeople){
        if (person.spouseId === null || !displayIds.has(person.spouseId)) continue;
        const pair = [
            person.id,
            person.spouseId
        ].sort((a, b)=>a - b);
        const pairKey = pair.join(":");
        if (spousePairs.has(pairKey)) continue;
        spousePairs.add(pairKey);
        spouseLinks.push({
            aId: pair[0],
            bId: pair[1]
        });
    }
    const knowledgeById = new Map();
    for (const card of game.state.knowledge){
        if (card.lost) continue;
        if (card.holderId !== null && displayIds.has(card.holderId)) {
            knowledgeById.set(card.holderId, {
                kind: "holder",
                key: card.key
            });
        }
        for (const heirId of card.heirIds){
            if (heirId !== null && displayIds.has(heirId) && !knowledgeById.has(heirId)) {
                knowledgeById.set(heirId, {
                    kind: "heir",
                    key: card.key
                });
            }
        }
    }
    const layout = buildRelationshipLayout(displayPeople, parentLinks, spouseLinks);
    const layoutById = new Map(layout.nodes.map((node)=>[
            node.person.id,
            node
        ]));
    const anchorCount = displayPeople.filter((person)=>!currentPeople.some((current)=>current.id === person.id)).length;
    relationshipSummary.textContent = [
        `第 ${game.state.generation} 代`,
        SEASON_LABELS[game.season],
        game.state.camp,
        `在世 ${currentPeople.length} 人`,
        `${layout.components.length} 个亲缘组`,
        `${parentLinks.length} 条亲子关系`,
        `${spouseLinks.length} 段当前婚姻`,
        anchorCount > 0 ? `${anchorCount} 个已故谱系锚点` : ""
    ].filter(Boolean).join(" · ");
    const componentMarkup = layout.components.map((component, componentIndex)=>{
        const componentParentLinks = parentLinks.filter((link)=>layoutById.get(link.childId)?.componentKey === component.key);
        const linksByParents = new Map();
        for (const link of componentParentLinks){
            const key = link.parentIds.slice().sort((a, b)=>a - b).join(":");
            const group = linksByParents.get(key) ?? [];
            group.push(link);
            linksByParents.set(key, group);
        }
        const componentParentEdges = [
            ...linksByParents.entries()
        ].map(([parentKey, links])=>{
            const parentNodes = parentKey.split(":").map(Number).map((parentId)=>layoutById.get(parentId)).filter((node)=>Boolean(node)).sort((a, b)=>a.x - b.x);
            const children = links.map((link)=>layoutById.get(link.childId)).filter((node)=>Boolean(node)).sort((a, b)=>a.x - b.x || a.person.id - b.person.id);
            if (parentNodes.length === 0 || children.length === 0) return "";
            const parentCenters = parentNodes.map((node)=>node.x + RELATIONSHIP_NODE_WIDTH / 2);
            const parentBottom = Math.max(...parentNodes.map((node)=>node.y + RELATIONSHIP_NODE_HEIGHT));
            const busY = parentBottom + 9;
            const leftmostCenter = Math.min(...parentCenters);
            const rightmostCenter = Math.max(...parentCenters);
            const busPadding = parentNodes.length > 1 ? 34 : Math.min(54, 16 + Math.max(0, children.length - 1) * 9);
            const busStart = Math.max(parentNodes[0].x + 14, leftmostCenter - busPadding);
            const busEnd = Math.min(parentNodes[parentNodes.length - 1].x + RELATIONSHIP_NODE_WIDTH - 14, rightmostCenter + busPadding);
            const minimumChildTop = Math.min(...children.map((child)=>child.y));
            const availableHeight = Math.max(14, minimumChildTop - busY - 4);
            const laneStep = Math.max(3.5, Math.min(10, availableHeight / (children.length + 1)));
            const colorIndex = relationshipParentColorIndex(parentKey);
            const parentStubs = parentCenters.map((centerX)=>`<path class="relationship-edge ancestry-bus ancestry-color-${colorIndex}" data-parent-key="${parentKey}" d="M ${centerX} ${parentBottom} V ${busY}" />`).join("");
            const parentBus = `<path class="relationship-edge ancestry-bus ancestry-color-${colorIndex}" data-parent-key="${parentKey}" d="M ${busStart} ${busY} H ${busEnd}" />`;
            const branches = children.map((child, index)=>{
                const startX = children.length === 1 ? (busStart + busEnd) / 2 : busStart + (busEnd - busStart) * (index + 0.5) / children.length;
                const laneY = busY + laneStep * (index + 1);
                const targetX = child.x + RELATIONSHIP_NODE_WIDTH / 2;
                return `<path class="relationship-edge ancestry-edge ancestry-color-${colorIndex}" data-child-id="${child.person.id}" data-parent-key="${parentKey}" d="M ${startX} ${busY} V ${laneY} H ${targetX} V ${child.y}" marker-end="url(#relationship-arrow-${colorIndex})" />`;
            }).join("");
            return `${parentStubs}${parentBus}${branches}`;
        }).join("");
        const componentSpouseEdges = spouseLinks.filter((link)=>layoutById.get(link.aId)?.componentKey === component.key && layoutById.get(link.bId)?.componentKey === component.key).map((link)=>{
            const a = layoutById.get(link.aId);
            const b = layoutById.get(link.bId);
            if (!a || !b) return "";
            const aCenterX = a.x + RELATIONSHIP_NODE_WIDTH / 2;
            const aCenterY = a.y + RELATIONSHIP_NODE_HEIGHT / 2;
            const bCenterX = b.x + RELATIONSHIP_NODE_WIDTH / 2;
            const bCenterY = b.y + RELATIONSHIP_NODE_HEIGHT / 2;
            let path = "";
            if (Math.abs(a.y - b.y) < 2) {
                const left = a.x <= b.x ? a : b;
                const right = a.x <= b.x ? b : a;
                const lineY = left.y + RELATIONSHIP_NODE_HEIGHT / 2;
                path = `M ${left.x + RELATIONSHIP_NODE_WIDTH} ${lineY} H ${right.x}`;
            } else {
                const start = relationshipNodeBoundaryPoint(a, bCenterX, bCenterY);
                const end = relationshipNodeBoundaryPoint(b, aCenterX, aCenterY);
                const direction = bCenterX >= aCenterX ? 1 : -1;
                const bend = Math.max(34, Math.min(110, Math.abs(bCenterX - aCenterX) * 0.34));
                path = `M ${start.x} ${start.y} C ${start.x + direction * bend} ${start.y}, ${end.x - direction * bend} ${end.y}, ${end.x} ${end.y}`;
            }
            return `<path class="relationship-edge spouse-edge-outer" data-person-ids="${link.aId}:${link.bId}" d="${path}" /><path class="relationship-edge spouse-edge-core" data-person-ids="${link.aId}:${link.bId}" d="${path}" />`;
        }).join("");
        const nodeMarkup = component.nodes.map((node)=>{
            const person = node.person;
            const isCurrent = person.status === "同族" || person.status === "尚未同族";
            const isPregnant = game.state.pregnancy.some((row)=>row.motherId === person.id && game.person(row.motherId));
            const knowledge = knowledgeById.get(person.id);
            const ageStatus = ageClass(person.age);
            const roleDetail = knowledge ? `${knowledge.kind === "holder" ? "持有" : "传承"} ${KNOWLEDGE_NAMES[knowledge.key]}` : [
                "儿童",
                "成人",
                "长者"
            ].includes(person.roleLabel) ? "" : person.roleLabel.endsWith("知识") ? "" : person.roleLabel;
            const roleLine = roleDetail ? `${ageStatus} · ${roleDetail}` : ageStatus;
            const marker = isPregnant ? "孕期" : person.id === game.state.caregiverId ? "照护" : person.id === game.state.translatorId ? "中间" : "";
            const classes = [
                "relationship-node",
                person.sex === "女" ? "is-female" : "is-male",
                isCurrent ? "is-current" : "is-anchor",
                isPregnant ? "is-pregnant" : "",
                knowledge?.kind === "holder" ? "is-knowledge-holder" : "",
                knowledge?.kind === "heir" ? "is-knowledge-heir" : ""
            ].filter(Boolean).join(" ");
            const rankDescription = person.rank === null ? "" : `第${person.rank}辈，`;
            const statusRank = person.rank === null ? "" : ` · 第${person.rank}辈`;
            const label = `${person.name}，${person.sex}，${person.age.toFixed(2)}岁，${rankDescription}${roleLine}，${isCurrent ? person.status : "已故谱系"}${marker ? `，${marker}` : ""}`;
            return `
        <g class="${classes}" data-person-id="${person.id}" data-rank="${person.rank ?? ""}" data-layout-rank="${node.depth}" data-knowledge-state="${knowledge?.kind ?? ""}" tabindex="0" role="button" aria-pressed="false" aria-label="${escapeHtml(label)}">
          <title>${escapeHtml(label)}</title>
          <rect class="relationship-node-card" x="${node.x}" y="${node.y}" width="${RELATIONSHIP_NODE_WIDTH}" height="${RELATIONSHIP_NODE_HEIGHT}" rx="13" />
          <circle class="relationship-sex-dot" cx="${node.x + 17}" cy="${node.y + 21}" r="5" />
          <text class="relationship-node-name" x="${node.x + 29}" y="${node.y + 27}">${escapeHtml(person.name)}</text>
          <text class="relationship-node-age" x="${node.x + RELATIONSHIP_NODE_WIDTH - 12}" y="${node.y + 24}" text-anchor="end">${person.sex} · ${person.age.toFixed(2)}岁</text>
          <text class="relationship-node-role" x="${node.x + 12}" y="${node.y + 46}">${escapeHtml(roleLine)}</text>
          <text class="relationship-node-status" x="${node.x + 12}" y="${node.y + 62}">${escapeHtml(`${isCurrent ? person.status : "已故谱系"}${statusRank}`)}</text>
          ${marker ? `<text class="relationship-node-marker ${isPregnant ? "pregnant" : ""}" x="${node.x + RELATIONSHIP_NODE_WIDTH - 12}" y="${node.y + 62}" text-anchor="end">${marker}</text>` : ""}
        </g>
      `;
        }).join("");
        return `
      <g class="relationship-family" data-component="${component.key}">
        <rect class="relationship-family-panel" x="${component.x}" y="${component.y}" width="${component.width}" height="${component.height}" rx="19" />
        <text class="relationship-family-title" x="${component.x + 16}" y="${component.y + 25}">亲缘组 ${String(componentIndex + 1).padStart(2, "0")}</text>
        <text class="relationship-family-meta" x="${component.x + component.width - 16}" y="${component.y + 25}" text-anchor="end">${component.nodes.length} 人 · ${component.hasUnranked ? "含未定辈分" : `第${component.minDepth}${component.maxDepth > component.minDepth ? `—${component.maxDepth}` : ""}辈`}</text>
        ${componentParentEdges}
        ${componentSpouseEdges}
        ${nodeMarkup}
      </g>
    `;
    }).join("");
    relationshipGraphWidth = layout.width;
    relationshipGraphHeight = layout.height;
    relationshipGraph.innerHTML = `
    <svg class="relationship-svg" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-labelledby="relationshipGraphTitle relationshipGraphDesc">
      <title id="relationshipGraphTitle">本局实时人物关系图谱</title>
      <desc id="relationshipGraphDesc">${escapeHtml(relationshipSummary.textContent ?? "")}</desc>
      <defs>
        ${RELATIONSHIP_PARENT_COLORS.map((color, index)=>`
          <marker id="relationship-arrow-${index}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 8 4 L 0 8 z" style="fill:${color}" />
          </marker>
        `).join("")}
      </defs>
      ${componentMarkup}
    </svg>
  `;
    applyRelationshipHighlight();
    if (relationshipDialog.open) applyRelationshipZoom();
}
function applyRelationshipHighlight() {
    const nodes = [
        ...relationshipGraph.querySelectorAll(".relationship-node")
    ];
    const visibleIds = new Set(nodes.map((node)=>Number(node.dataset.personId)));
    if (selectedRelationshipPersonId !== null && !visibleIds.has(selectedRelationshipPersonId)) {
        selectedRelationshipPersonId = null;
    }
    relationshipClearSelectionButton.hidden = selectedRelationshipPersonId === null;
    if (selectedRelationshipPersonId === null) {
        for (const node of nodes){
            node.classList.remove("is-selected", "is-related", "is-background");
            node.setAttribute("aria-pressed", "false");
        }
        for (const element of relationshipGraph.querySelectorAll(".is-focused-edge, .is-background-edge, .has-focus, .is-background")){
            element.classList.remove("is-focused-edge", "is-background-edge", "has-focus", "is-background");
        }
        return;
    }
    const selectedId = selectedRelationshipPersonId;
    const selected = game.state.people.find((person)=>person.id === selectedId);
    if (!selected) {
        selectedRelationshipPersonId = null;
        relationshipClearSelectionButton.hidden = true;
        return;
    }
    const parentIds = new Set([
        selected.fatherId,
        selected.motherId
    ].filter((id)=>id !== null));
    const spouseIds = new Set(selected.spouseId === null ? [] : [
        selected.spouseId
    ]);
    const childIds = new Set(game.state.people.filter((person)=>person.fatherId === selected.id || person.motherId === selected.id).map((person)=>person.id));
    const grandchildIds = new Set(game.state.people.filter((person)=>person.fatherId !== null && childIds.has(person.fatherId) || person.motherId !== null && childIds.has(person.motherId)).map((person)=>person.id));
    const relatedIds = new Set([
        selected.id,
        ...parentIds,
        ...spouseIds,
        ...childIds,
        ...grandchildIds
    ]);
    const focusedParentKeys = new Set();
    for (const node of nodes){
        const personId = Number(node.dataset.personId);
        const selectedNode = personId === selected.id;
        const relatedNode = relatedIds.has(personId);
        node.classList.toggle("is-selected", selectedNode);
        node.classList.toggle("is-related", !selectedNode && relatedNode);
        node.classList.toggle("is-background", !relatedNode);
        node.setAttribute("aria-pressed", selectedNode ? "true" : "false");
    }
    for (const edge of relationshipGraph.querySelectorAll(".ancestry-edge")){
        const childId = Number(edge.dataset.childId);
        const parentKey = edge.dataset.parentKey ?? "";
        const edgeParentIds = parentKey.split(":").map(Number);
        const focusesSelected = childId === selected.id || edgeParentIds.includes(selected.id);
        const focusesGrandchild = grandchildIds.has(childId) && edgeParentIds.some((id)=>childIds.has(id));
        const focused = focusesSelected || focusesGrandchild;
        edge.classList.toggle("is-focused-edge", focused);
        edge.classList.toggle("is-background-edge", !focused);
        if (focused) focusedParentKeys.add(parentKey);
    }
    for (const bus of relationshipGraph.querySelectorAll(".ancestry-bus")){
        const parentKey = bus.dataset.parentKey ?? "";
        const parentIdsInGroup = parentKey.split(":").map(Number);
        const focused = focusedParentKeys.has(parentKey) || parentIdsInGroup.includes(selected.id) || parentIdsInGroup.some((id)=>childIds.has(id));
        bus.classList.toggle("is-focused-edge", focused);
        bus.classList.toggle("is-background-edge", !focused);
        if (focused) focusedParentKeys.add(parentKey);
    }
    for (const edge of relationshipGraph.querySelectorAll(".spouse-edge-outer, .spouse-edge-core")){
        const personIds = (edge.dataset.personIds ?? "").split(":").map(Number);
        const focused = personIds.includes(selected.id) && personIds.every((id)=>relatedIds.has(id));
        edge.classList.toggle("is-focused-edge", focused);
        edge.classList.toggle("is-background-edge", !focused);
    }
    for (const family of relationshipGraph.querySelectorAll(".relationship-family")){
        const hasFocus = [
            ...family.querySelectorAll(".relationship-node")
        ].some((node)=>!node.classList.contains("is-background"));
        family.classList.toggle("has-focus", hasFocus);
        family.classList.toggle("is-background", !hasFocus);
    }
}
function selectRelationshipPerson(personId) {
    selectedRelationshipPersonId = selectedRelationshipPersonId === personId ? null : personId;
    applyRelationshipHighlight();
}
function applyRelationshipZoom() {
    const svg = relationshipGraph.querySelector(".relationship-svg");
    if (!svg) return;
    const width = Math.max(280, Math.round(relationshipGraphWidth * relationshipZoom));
    svg.style.width = `${width}px`;
    svg.style.height = "auto";
    relationshipZoomValue.textContent = `${Math.round(relationshipZoom * 100)}%`;
}
function fitRelationshipGraph(includeHeight = true) {
    if (!relationshipDialog.open) return;
    const availableWidth = Math.max(280, relationshipViewport.clientWidth - 4);
    const availableHeight = Math.max(220, relationshipViewport.clientHeight - 4);
    const fitted = includeHeight ? Math.min(1, availableWidth / relationshipGraphWidth, availableHeight / relationshipGraphHeight) : Math.min(1, availableWidth / relationshipGraphWidth);
    relationshipZoom = relationshipViewport.clientWidth < 620 ? Math.max(0.58, fitted) : fitted;
    applyRelationshipZoom();
    relationshipViewport.scrollLeft = 0;
    relationshipViewport.scrollTop = 0;
}
function changeRelationshipZoom(factor) {
    const currentCenterX = relationshipViewport.scrollLeft + relationshipViewport.clientWidth / 2;
    const currentCenterY = relationshipViewport.scrollTop + relationshipViewport.clientHeight / 2;
    relationshipZoom = Math.max(0.35, Math.min(2.4, relationshipZoom * factor));
    applyRelationshipZoom();
    window.requestAnimationFrame(()=>{
        relationshipViewport.scrollLeft = currentCenterX * factor - relationshipViewport.clientWidth / 2;
        relationshipViewport.scrollTop = currentCenterY * factor - relationshipViewport.clientHeight / 2;
    });
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
function run(operation, options = {}) {
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
        if (options.refreshRelationshipsAfter && !game.state.pendingDecision) {
            refreshRelationshipGraphIfOpen();
        }
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
    <button class="meta-chip meta-chip-button relationship-trigger" type="button" data-command="openRelationshipGraph" aria-haspopup="dialog" aria-label="打开本局实时人物关系图谱">
      <span class="relationship-trigger-icon" aria-hidden="true"><i></i><i></i><i></i></span>
      人物关系
    </button>
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
          <strong aria-label="${RESOURCE_LABELS[key]} ${formatNumber(game.state.resources[key])}/${formatNumber(RESOURCE_CAPS[key])}">${formatNumber(game.state.resources[key])}<span class="resource-cap">/${formatNumber(RESOURCE_CAPS[key])}</span></strong>
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
        run(()=>game.resolveDecision(decisionButton.dataset.decision), {
            refreshRelationshipsAfter: true
        });
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
    else if (command === "finishSeason") {
        run(()=>game.finishSeason(), {
            refreshRelationshipsAfter: true
        });
    } else if (command === "exportGame") exportGame();
    else if (command === "openNewGame") startRandomNewGame();
    else if (command === "openRelationshipGraph") openRelationshipGraph();
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
document.querySelector("#closeRelationshipGraph").addEventListener("click", ()=>relationshipDialog.close());
relationshipDialog.addEventListener("close", ()=>{
    selectedRelationshipPersonId = null;
    relationshipClearSelectionButton.hidden = true;
    relationshipGraphDrag = null;
    relationshipViewport.classList.remove("is-dragging");
});
relationshipDialog.addEventListener("click", (event)=>{
    const target = event.target;
    if (target === relationshipDialog) {
        relationshipDialog.close();
        return;
    }
    const zoomButton = target.closest("[data-relationship-zoom]");
    if (!zoomButton) return;
    const action = zoomButton.dataset.relationshipZoom;
    if (action === "in") changeRelationshipZoom(1.16);
    else if (action === "out") changeRelationshipZoom(1 / 1.16);
    else fitRelationshipGraph(true);
});
relationshipClearSelectionButton.addEventListener("click", ()=>{
    selectedRelationshipPersonId = null;
    applyRelationshipHighlight();
});
relationshipGraph.addEventListener("click", (event)=>{
    const node = event.target.closest(".relationship-node");
    if (!node) return;
    selectRelationshipPerson(Number(node.dataset.personId));
});
relationshipGraph.addEventListener("keydown", (event)=>{
    if (event.key !== "Enter" && event.key !== " ") return;
    const node = event.target.closest(".relationship-node");
    if (!node) return;
    event.preventDefault();
    selectRelationshipPerson(Number(node.dataset.personId));
});
relationshipViewport.addEventListener("pointerdown", (event)=>{
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    if (event.target.closest(".relationship-node")) return;
    relationshipGraphDrag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: relationshipViewport.scrollLeft,
        scrollTop: relationshipViewport.scrollTop
    };
    relationshipViewport.setPointerCapture(event.pointerId);
    relationshipViewport.classList.add("is-dragging");
    event.preventDefault();
});
relationshipViewport.addEventListener("pointermove", (event)=>{
    if (!relationshipGraphDrag || relationshipGraphDrag.pointerId !== event.pointerId) return;
    relationshipViewport.scrollLeft = relationshipGraphDrag.scrollLeft - (event.clientX - relationshipGraphDrag.startX);
    relationshipViewport.scrollTop = relationshipGraphDrag.scrollTop - (event.clientY - relationshipGraphDrag.startY);
});
const finishRelationshipDrag = (event)=>{
    if (!relationshipGraphDrag || relationshipGraphDrag.pointerId !== event.pointerId) return;
    relationshipGraphDrag = null;
    relationshipViewport.classList.remove("is-dragging");
    if (relationshipViewport.hasPointerCapture(event.pointerId)) {
        relationshipViewport.releasePointerCapture(event.pointerId);
    }
};
relationshipViewport.addEventListener("pointerup", finishRelationshipDrag);
relationshipViewport.addEventListener("pointercancel", finishRelationshipDrag);
saveState.textContent = "本地自动存档";
recordCurrentEndingAchievement();
render();
const previewQuery = new URLSearchParams(window.location.search);
if (previewQuery.has("relationshipUiTest")) {
    const previewWindow = window;
    previewWindow.__relationshipUiTest = {
        game: ()=>game,
        runFinish: ()=>run(()=>game.finishSeason(), {
                refreshRelationshipsAfter: true
            }),
        runDecision: (id)=>run(()=>game.resolveDecision(id), {
                refreshRelationshipsAfter: true
            })
    };
}
if (previewQuery.has("relationshipPreview")) {
    openRelationshipGraph();
    const focusPersonId = Number(previewQuery.get("relationshipFocus"));
    if (Number.isInteger(focusPersonId) && focusPersonId > 0) {
        window.requestAnimationFrame(()=>selectRelationshipPerson(focusPersonId));
    }
} else {
    if (!previewQuery.has("resourcePreview")) openGameGuide();
}


//# sourceURL=D:\Applications\CodexData\脑洞\web-game\src\app.ts