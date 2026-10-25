import { CAMP_ORDER, EVENT_NAMES, EVENT_TENDENCIES, EVENT_TEXT, HILL_CAMPS, INITIAL_PEOPLE, KNOWLEDGE_EVENT_TYPES, KNOWLEDGE_NAMES, KNOWLEDGE_ORDER, NAME_POOL, RESOURCE_CAPS, RESOURCE_KEYS, RESOURCE_LABELS, SEASONS, SEASON_LABELS, UNEXPECTED_NAMES, UNEXPECTED_TEXT, WATER_CAMPS } from "./data.js";
import { cloneState, createInitialState } from "./state.js";
import { normalizeSeed, pickWithRng, rollSides, shuffleWithRng } from "./rng.js";
const OPENING_SUCCESSOR_NAMES = {
    fire: [
        "石",
        "梾"
    ],
    water: [
        "汀",
        "渚"
    ],
    plant: [
        "葭",
        "汜"
    ],
    story: [
        "麓",
        "槲"
    ],
    care: [
        "菖",
        "芄"
    ]
};
const ROUTE_TEXTS = {
    "水泽共生": "群体把未来押在一片高产湿地。丰盛与依赖同时增长；这一代已经从水中找到自己的位置。",
    "逐潮而居": "贝丘、鱼汛和晾晒架使潮水成为可以预判的日历，人们每季仍回到同一个河口中枢。",
    "行水为家": "几处旧营地保留着火坑和旧路；家不是一座房，而是一条仍有人记得、仍有人接应的水路。",
    "两岸同灶": "两个口音、两套亲属称谓和两种照顾方式在同一堆火边并存。",
    "山脊火种": "群体放弃湿地的高产，带着火、衣物和清晰的边界退向高地。",
    "孩子的火塘": "祖辈、父母、兄姐和族人共同把下一代接住，成功不是人口增长，而是孩子真正活到能教别人的年龄。",
    "孤岸丰年": "粮仓、住所和火塘足以让营地表面繁荣，但长期互助网络仍停留在很浅的层级。"
};
const ROUTE_ORDER = [
    "水泽共生",
    "逐潮而居",
    "行水为家",
    "两岸同灶",
    "山脊火种",
    "孩子的火塘",
    "孤岸丰年"
];
const MAX_HEALTH = 6;
const ACTION_DEFINITIONS = [
    {
        id: "wetland",
        baseId: "wetland",
        label: "湿地采集",
        description: "从浅水湿地取得食物和材料。",
        cost: "无",
        conditions: "任意季节；湖沼、河口；冬季 -1",
        outcomes: "成功食+2材+1；部分各+1；受阻材+1、伤1",
        bonus: "完整植物知识 +1；地点匹配 +1",
        knowledge: "plant"
    },
    {
        id: "fish",
        baseId: "fish",
        label: "捕鱼与贝类",
        description: "沿水网取得食物。",
        cost: "无",
        conditions: "任意季节；河湾、湖沼、河口；冬季 -1",
        outcomes: "成功食+2；部分食+1；受阻食+1材-1",
        bonus: "完整水/木 +1；地点 +1；成功并利用河口可记生计",
        knowledge: "water"
    },
    {
        id: "hunt",
        baseId: "hunt",
        label: "狩猎",
        description: "从陆地资源获取食物、材料与储藏。",
        cost: "无",
        conditions: "任意季节；高丘、橡林；春季 -1",
        outcomes: "成功食+2材+1储+1；部分食+1；受阻食+1、伤1",
        bonus: "地点 +1；看家狗 +1",
        knowledge: null
    },
    {
        id: "harvest",
        baseId: "harvest",
        label: "收获坚果/水生果实",
        description: "秋季高产，并可建立储藏。",
        cost: "无",
        conditions: "任意季节；橡林、湖沼；非秋季 -1",
        outcomes: "成功秋季食+3，其他食+2，并获得储藏；部分亦有储藏",
        bonus: "完整植物 +1；地点 +1",
        knowledge: "plant"
    },
    {
        id: "rice",
        baseId: "rice",
        label: "野生稻管理",
        description: "食物、材料和湿地管理进度。",
        cost: "无",
        conditions: "春、夏、秋；河湾、湖沼",
        outcomes: "成功食+2材+1进度+1；部分食+1进度+1；受阻食+1",
        bonus: "完整植物 +1；地点 +1",
        knowledge: "plant"
    },
    {
        id: "shelter",
        baseId: "shelter",
        label: "修建/修理住所",
        description: "提升住所，并可能恢复凝聚。",
        cost: "材料 1",
        conditions: "任意季节；任意地点；湿地地点 +1",
        outcomes: "成功住+1凝+1；部分住+1；受阻伤1",
        bonus: "完整水/木 +1；湿地地点 +1；成功修复火灾后住所加成",
        knowledge: "water"
    },
    {
        id: "weave",
        baseId: "weave",
        label: "编织/缝制",
        description: "补充衣物与照护物。",
        cost: "材料 1",
        conditions: "任意季节；任意地点",
        outcomes: "成功衣+1照+1；部分衣+1；受阻伤1",
        bonus: "完整水/木 +1；成功计制作进度",
        knowledge: "water"
    },
    {
        id: "storage",
        baseId: "storage",
        label: "储藏",
        description: "把食物转为越冬保障。",
        cost: "食物 2",
        conditions: "任意季节；秋季 +1，其他季 -1",
        outcomes: "成功储+1；部分储+1再耗食1；受阻食-1",
        bonus: "完整植物 +1；地点匹配 +1",
        knowledge: "plant"
    },
    {
        id: "care-community",
        baseId: "care",
        label: "照顾营地",
        description: "组织共同照护。",
        cost: "食物 1",
        conditions: "任意季节；任意地点",
        outcomes: "成功照+1凝+1；部分照+1；受阻凝-1",
        bonus: "完整治疗 +1",
        knowledge: "care"
    },
    {
        id: "care-treat",
        baseId: "care",
        label: "处理伤势",
        description: "由选定执行者处理一名伤者的伤势或感染。",
        cost: "食物 1",
        conditions: "任意季节；人物列表中存在健康不满或有伤势的人",
        outcomes: "成功改善被治疗者伤势或清除感染；部分阻止恶化",
        bonus: "完整治疗 +1",
        knowledge: "care"
    },
    {
        id: "contact",
        baseId: "contact",
        label: "接触邻族",
        description: "扩大网络并建立往来。",
        cost: "材料 1，不足则食物 1",
        conditions: "任意季节；任意地点",
        outcomes: "成功网+1并获材料；部分仅完成试探；受阻凝-1",
        bonus: "族际中间人提供修正；完整故事 +1；网络达到 3 后可提议联盟",
        knowledge: "story"
    },
    {
        id: "craft",
        baseId: "craft",
        label: "制作陶器/木器",
        description: "推进跨代制作。",
        cost: "燃料 1、材料 1",
        conditions: "任意季节；冬季 -1；河湾、湖沼地点 +1",
        outcomes: "成功进度+1凝+1；部分仅地点匹配时计进度；受阻伤1",
        bonus: "完整火/陶或水/木 +1；地点 +1",
        knowledge: null
    },
    {
        id: "fuel",
        baseId: "fuel",
        label: "拾取燃料/整备火塘",
        description: "补充越冬与日常用火。",
        cost: "无",
        conditions: "任意季节；高丘、橡林 +1",
        outcomes: "成功燃+2；部分燃+1；受阻伤1",
        bonus: "完整火/陶 +1；地点 +1",
        knowledge: "fire"
    },
    {
        id: "dog",
        baseId: "dog",
        label: "豢养犬只",
        description: "尝试获得保护储藏和狩猎的狗。",
        cost: "无",
        conditions: "任意季节；全群还没有看家狗",
        outcomes: "成功获得 1 只；部分或受阻不获得",
        bonus: "无知识加成；不受季节影响",
        knowledge: null
    },
    ...KNOWLEDGE_ORDER.map((key)=>({
            id: `train:${key}`,
            baseId: `train:${key}`,
            label: `训练 · ${KNOWLEDGE_NAMES[key]}`,
            description: "不掷骰；两名在世传承人同时 +1。",
            cost: "要求食物 ≥3",
            conditions: "任意季节；当前持有人成年且至少一名传承人在世",
            outcomes: "两名在世传承人各 +1，当前持有人不变",
            bonus: "训练不掷骰，不受季节和地点修正",
            knowledge: key
        }))
];
function emptySeason() {
    return {
        event: null,
        actions: [],
        actionRecords: [],
        unexpected: null,
        unexpectedRecorded: false,
        allianceWindowChecked: false,
        eventUsageFinalized: false,
        currentCared: false,
        childProtectionUsed: false,
        currentCareGap: false,
        currentCrossgroupSuccess: false,
        nonTeachingIncrements: [],
        famine: false,
        zeroFoodHandled: false,
        startNotes: [],
        endNotes: []
    };
}
export class MudWaterGame {
    state;
    constructor(state){
        this.state = state ? cloneState(state) : createInitialState();
        this.repairKnowledgeSlots();
    }
    static newGame(options = {}) {
        return new MudWaterGame(createInitialState(options));
    }
    static fromJSON(raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : cloneState(raw);
        if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.people)) {
            throw new Error("不支持的存档格式");
        }
        if (typeof parsed.shelterBonusDisabled !== "boolean") {
            parsed.shelterBonusDisabled = false;
        }
        if (!Array.isArray(parsed.allianceNewcomerIds)) parsed.allianceNewcomerIds = [];
        if (typeof parsed.allianceIntegrated !== "boolean") parsed.allianceIntegrated = false;
        if (typeof parsed.allianceRescueUsed !== "boolean") parsed.allianceRescueUsed = false;
        if (typeof parsed.allianceCompletedThisGeneration !== "boolean") {
            parsed.allianceCompletedThisGeneration = false;
        }
        parsed.season = {
            ...emptySeason(),
            ...parsed.season ?? {},
            event: parsed.season?.event ? {
                ...parsed.season.event
            } : null,
            unexpected: parsed.season?.unexpected ? {
                ...parsed.season.unexpected
            } : null
        };
        if (parsed.season?.event) {
            if (typeof parsed.season.event.resultText !== "string") parsed.season.event.resultText = "";
            if (typeof parsed.season.event.baseResultText !== "string") {
                parsed.season.event.baseResultText = parsed.season.event.resultText;
            }
            if (typeof parsed.season.event.logId !== "number") parsed.season.event.logId = null;
            if (!parsed.season.event.baseline) parsed.season.event.baseline = null;
        }
        if (parsed.season?.unexpected) {
            if (typeof parsed.season.unexpected.resultText !== "string") parsed.season.unexpected.resultText = "";
            if (!parsed.season.unexpected.baseline) parsed.season.unexpected.baseline = null;
        }
        for (const person of parsed.people){
            if (typeof person.frailtyChoiceHandled !== "boolean") person.frailtyChoiceHandled = false;
            if (person.roleLabel === "人员迁入") person.rank = null;
        }
        parsed.logs = (parsed.logs ?? []).filter((entry)=>{
            if (entry.kind === "event" && entry.title === "事件选择") return false;
            if (entry.kind === "unexpected" && entry.title === "意外选择") return false;
            if (entry.kind === "event" && entry.title in EVENT_TEXT && entry.text === EVENT_TEXT[entry.title]) {
                return false;
            }
            if (entry.kind === "unexpected" && UNEXPECTED_NAMES.includes(entry.title) && entry.text === UNEXPECTED_TEXT[UNEXPECTED_NAMES.indexOf(entry.title)]) {
                return false;
            }
            return true;
        });
        for (const entry of parsed.logs){
            if (entry.kind === "event" && entry.title in EVENT_TEXT && !entry.title.startsWith("春水季事件：") && !entry.title.startsWith("盛夏季事件：") && !entry.title.startsWith("秋收季事件：") && !entry.title.startsWith("冬寒季事件：")) {
                entry.title = `${SEASON_LABELS[entry.season]}事件：${entry.title}`;
            }
            if (entry.kind === "action") entry.text = normalizeLegacyActionText(entry.text);
            if (entry.title === "提前传承") entry.text = normalizeLegacyEarlySuccessionText(entry.text);
        }
        for (const record of parsed.season.actionRecords ?? []){
            record.text = normalizeLegacyActionText(record.text);
        }
        return new MudWaterGame(parsed);
    }
    toJSON() {
        return cloneState(this.state);
    }
    clone() {
        return new MudWaterGame(this.state);
    }
    get season() {
        return SEASONS[this.state.seasonIndex];
    }
    get seasonLabel() {
        return SEASON_LABELS[this.season];
    }
    population() {
        return this.state.people.filter((person)=>[
                "同族",
                "尚未同族"
            ].includes(person.status)).length;
    }
    adults() {
        return this.alivePeople().filter((person)=>person.age >= 10 && person.age < 40 && person.status === "同族");
    }
    alivePeople() {
        return this.state.people.filter((person)=>[
                "同族",
                "尚未同族"
            ].includes(person.status));
    }
    treatablePeople() {
        return this.alivePeople().filter((person)=>person.health < MAX_HEALTH || person.lightInjury || person.heavyInjury || person.infection);
    }
    person(id) {
        if (id === null || id === undefined) return null;
        return this.state.people.find((person)=>person.id === Number(id) && ![
                "死亡",
                "已迁出"
            ].includes(person.status)) ?? null;
    }
    peopleName(id) {
        return this.person(id)?.name ?? "空缺";
    }
    rosterName(id) {
        if (id === null || id === undefined) return "不知名";
        return this.state.people.find((person)=>person.id === Number(id))?.name ?? "不知名";
    }
    knowledge(key) {
        return this.state.knowledge.find((card)=>card.key === key);
    }
    holder(key) {
        return this.person(this.knowledge(key).holderId);
    }
    fullKnowledge(key) {
        const card = this.knowledge(key);
        const holder = this.holder(key);
        return Boolean(holder && holder.age >= 10 && !card.lost && card.level >= 3);
    }
    completeKnowledgeCount() {
        return this.state.knowledge.filter((card)=>!card.lost && card.level >= 3).length;
    }
    log(kind, title, text, tone = "normal") {
        const id = this.state.nextLogId++;
        this.state.logs.push({
            id,
            generation: this.state.generation,
            season: this.season,
            kind,
            title,
            text,
            tone
        });
        if (this.state.logs.length > 500) this.state.logs.splice(0, this.state.logs.length - 500);
        return id;
    }
    roll(sides, label) {
        const result = rollSides(this.state.rngState, sides, label);
        this.state.rngState = result.state;
        return result.roll;
    }
    shuffle(items, label) {
        const result = shuffleWithRng(items, this.state.rngState, label);
        this.state.rngState = result.state;
        return result.items;
    }
    pick(items, label) {
        const result = pickWithRng(items, this.state.rngState, label);
        this.state.rngState = result.state;
        return result.value;
    }
    healthModifier(person) {
        if (person.health >= 6) return 2;
        if (person.health >= 4) return 1;
        if (person.health >= 2) return 0;
        return -1;
    }
    caregiverModifier() {
        return this.person(this.state.caregiverId) ? 1 : 0;
    }
    translatorModifier() {
        return this.person(this.state.translatorId) ? 1 : -1;
    }
    cappedMods(mods) {
        const total = mods.reduce((sum, value)=>sum + value, 0);
        if (total <= 4) return mods;
        const output = mods.slice();
        let excess = total - 4;
        for(let index = output.length - 1; index >= 0 && excess > 0; index -= 1){
            const reduction = Math.min(output[index], excess);
            output[index] -= reduction;
            excess -= reduction;
        }
        return output;
    }
    test(mods, label) {
        const roll = this.roll(6, label);
        const total = roll.value + this.cappedMods(mods).reduce((sum, value)=>sum + value, 0);
        return {
            die: roll.value,
            total,
            result: total <= 2 ? "不利" : total <= 4 ? "部分" : "有利",
            roll
        };
    }
    healthTest(person, label, options = {}) {
        if (person.age < 10 && options.care && !this.person(this.state.caregiverId)) {
            this.state.season.currentCareGap = true;
        }
        const mods = [
            this.healthModifier(person)
        ];
        if (options.care) mods.push(this.caregiverModifier());
        if (options.treatment && this.fullKnowledge("care")) mods.push(1);
        if (options.extra) mods.push(options.extra);
        if (this.hasWetlandContinuity() && [
            "盛夏热病",
            "水华与浊水"
        ].includes(label)) {
            mods.push(1);
        }
        if (this.state.currentTrend === "湿地扩张" && this.state.camp === "芦苇湖沼" && [
            "盛夏热病",
            "水华与浊水",
            "蚊群暴发"
        ].includes(label)) {
            mods.push(-1);
        }
        return this.test(mods, label);
    }
    networkTest(person, label, extra = 0) {
        const mods = [
            this.translatorModifier()
        ];
        if (person) mods.push(this.healthModifier(person) === 2 ? 1 : 0);
        if (this.fullKnowledge("story")) mods.push(1);
        if (this.state.currentTrend === "邻族压力") mods.push(1);
        if (extra) mods.push(extra);
        return this.test(mods, label);
    }
    randomPerson(category, label) {
        let pool = this.alivePeople().filter((person)=>person.status === "同族");
        if (category === "成人") pool = pool.filter((person)=>person.age >= 10 && person.age < 40);
        if (category === "儿童") pool = pool.filter((person)=>person.age < 10);
        if (category === "长者") pool = pool.filter((person)=>person.age >= 40);
        return this.pick(pool, label);
    }
    addResource(key, amount) {
        if (amount < 0) {
            this.damageResource(key, Math.abs(amount), key);
            return -Math.abs(amount);
        }
        const previous = this.state.resources[key];
        if (key === "food") {
            const cap = RESOURCE_CAPS.food;
            const raw = previous + amount;
            this.state.resources.food = Math.min(cap, raw);
            this.state.resources.food = Math.max(0, this.state.resources.food);
            const overflow = Math.max(0, raw - cap);
            if (overflow > 0 && this.effectiveShelter() >= 2) {
                this.addResource("storage", overflow);
            }
        } else {
            this.state.resources[key] = Math.min(RESOURCE_CAPS[key], Math.max(0, previous + amount));
        }
        this.applyStorageFloor();
        return this.state.resources[key] - previous;
    }
    damageResource(key, amount, reason) {
        const previous = this.state.resources[key];
        const next = previous - amount;
        if (key === "food" && next < 0) {
            this.applyNegativeFoodPenalty(reason);
            return;
        }
        const floor = key === "storage" && HILL_CAMPS.includes(this.state.camp) ? 1 : 0;
        this.state.resources[key] = Math.min(RESOURCE_CAPS[key], Math.max(floor, next));
    }
    applyNegativeFoodPenalty(reason) {
        const pool = this.alivePeople().filter((person)=>person.age >= 40 || person.age < 10);
        const victim = this.pick(pool, `${reason}负食物惩罚`);
        if (victim) {
            this.kill(victim.id, "食物负值");
        } else {
            this.groupHurt(1, reason);
            this.addResource("cohesion", -1);
        }
        this.state.resources.food = 0;
        this.state.season.zeroFoodHandled = true;
        this.log("settlement", "食物负值", victim ? `${victim.name}因食物不足以负数死亡。` : "无人可承担额外死亡，全体健康与凝聚下降。");
    }
    applyStorageFloor() {
        if (HILL_CAMPS.includes(this.state.camp)) {
            this.state.resources.storage = Math.max(1, this.state.resources.storage);
        }
        this.state.resources.storage = Math.min(3, Math.max(0, this.state.resources.storage));
    }
    effectiveShelter() {
        return this.state.shelterBonusDisabled ? 0 : this.state.resources.shelter;
    }
    hurt(person, amount, reason, infection = false) {
        if (!this.person(person.id)) return;
        if (person.age >= 40 && person.frailtyCareGeneration === this.state.generation && !person.frailtyCareUsed) {
            person.frailtyCareUsed = true;
            this.log("settlement", "集中照护", `${person.name}抵挡了本次健康损失：${reason}。`);
            return;
        }
        person.health = Math.max(0, person.health - amount);
        if (infection) person.infection = true;
        if (person.health <= 0) this.kill(person.id, reason);
    }
    groupHurt(amount, reason, exemptIds = []) {
        for (const person of this.alivePeople()){
            if (!exemptIds.includes(person.id)) this.hurt(person, amount, reason);
        }
    }
    markWeak(person) {
        if (!this.person(person.id)) return;
        if (person.weak) {
            if (person.deathAge !== null) {
                person.deathAge = Math.max(person.age, person.deathAge - 10);
            }
            person.weak = false;
        } else {
            person.weak = true;
        }
    }
    relatedReactionList(relatives, maxNames = 2) {
        const named = relatives.slice(0, maxNames).map((relative)=>`${relative.label}${relative.person.name}`).join("和");
        return relatives.length > maxNames ? `${named}等人` : named;
    }
    siblingReactionLabel(sibling, deceased) {
        if (sibling.age > deceased.age) return sibling.sex === "男" ? "哥哥" : "姐姐";
        if (sibling.age < deceased.age) return sibling.sex === "男" ? "弟弟" : "妹妹";
        return sibling.sex === "男" ? "兄弟" : "姐妹";
    }
    deathFamilyReaction(person, excludedRelativeIds) {
        const living = this.alivePeople();
        const eligible = (relative)=>relative !== null && relative.id !== person.id && !excludedRelativeIds.has(relative.id);
        const father = this.person(person.fatherId);
        const mother = this.person(person.motherId);
        const parents = [];
        if (eligible(father)) parents.push({
            person: father,
            label: "父亲"
        });
        if (eligible(mother)) parents.push({
            person: mother,
            label: "母亲"
        });
        const siblings = living.filter((relative)=>eligible(relative) && (person.fatherId !== null && relative.fatherId === person.fatherId || person.motherId !== null && relative.motherId === person.motherId));
        const spouse = this.person(person.spouseId);
        const visibleSpouse = eligible(spouse) ? spouse : null;
        const children = living.filter((relative)=>eligible(relative) && relative.age >= 3 && (relative.fatherId === person.id || relative.motherId === person.id));
        const sentences = [];
        const firstSentence = [];
        if (parents.length > 0) {
            firstSentence.push(`${this.relatedReactionList(parents)}一直守在${person.name}留下的空位旁，谁也没有先离开`);
        }
        if (siblings.length > 0) {
            const siblingNames = this.relatedReactionList(siblings.map((sibling)=>({
                    person: sibling,
                    label: this.siblingReactionLabel(sibling, person)
                })));
            firstSentence.push(parents.length > 0 ? `${siblingNames}把火添得更旺，始终没有先走` : `${siblingNames}把火添得更旺，替${person.name}留着原来的位置`);
        }
        if (firstSentence.length > 0) sentences.push(`${firstSentence.join("；")}。`);
        const spouseLabel = visibleSpouse?.sex === "男" ? "丈夫" : "妻子";
        if (visibleSpouse && children.length > 0) {
            const childNames = this.relatedReactionList(children.map((child)=>({
                    person: child,
                    label: child.sex === "男" ? "儿子" : "女儿"
                })));
            sentences.push(`${spouseLabel}${visibleSpouse.name}搂紧${childNames}，没有让人看见自己发抖的手。`);
        } else if (visibleSpouse) {
            sentences.push(`${spouseLabel}${visibleSpouse.name}没有松开${person.name}的衣物，直到火光暗下去。`);
        } else if (children.length > 0) {
            const childNames = this.relatedReactionList(children.map((child)=>({
                    person: child,
                    label: child.sex === "男" ? "儿子" : "女儿"
                })));
            sentences.push(`${childNames}守着${person.name}原来的位置，久久没有离开。`);
        }
        return sentences.join("");
    }
    kill(personId, reason, narrativeOverride = "", title = "死亡", representedRelativeIds = []) {
        const person = this.state.people.find((entry)=>entry.id === personId);
        if (!person || person.status === "死亡") return;
        const excludedRelativeIds = new Set(representedRelativeIds.filter((id)=>id !== null));
        const familyReaction = this.deathFamilyReaction(person, excludedRelativeIds);
        const heldKeys = this.state.knowledge.filter((card)=>card.holderId === person.id && !card.lost).map((card)=>card.key);
        person.status = "死亡";
        person.health = 0;
        if (person.spouseId !== null) {
            const spouse = this.state.people.find((entry)=>entry.id === person.spouseId);
            if (spouse) {
                spouse.spouseId = null;
                spouse.lastPartnerEndGeneration = this.state.generation;
            }
            person.spouseId = null;
        }
        for (const key of [
            "caregiverId",
            "translatorId"
        ]){
            if (this.state[key] === person.id) this.state[key] = null;
        }
        const transitions = this.processKnowledgeOnDeath(person.id);
        this.repairKnowledgeSlots();
        this.refillRoles();
        let narrative = narrativeOverride;
        const successfulTransitions = transitions.filter((entry)=>!entry.lost && entry.successorId !== null);
        if (!narrative && heldKeys.length > 0 && successfulTransitions.length > 0) {
            if (reason === "衰弱知识持有人代末检定") {
                const handovers = successfulTransitions.map((entry)=>`${this.peopleName(entry.successorId)}从日渐衰弱的${person.name}手中接过了${KNOWLEDGE_NAMES[entry.key]}知识`).join("；");
                narrative = `${handovers}；而${person.name}放心地走向了死亡，终年${formatAgeYears(person.age)}岁。`;
            } else if (reason.startsWith("达到隐藏死亡年龄")) {
                const handovers = successfulTransitions.map((entry)=>`${this.peopleName(entry.successorId)}只能匆忙接过${KNOWLEDGE_NAMES[entry.key]}知识、带领族人继续生活`).join("；");
                narrative = `${person.name}在${formatAgeYears(person.deathAge ?? person.age)}岁时猝然离世，${handovers}。`;
            }
        }
        if (!narrative) {
            narrative = person.age >= 40 ? `${person.name}在衰老后静静地走向了冰冷的彼岸。终年${formatAgeYears(person.age)}岁。` : `${person.name}过早地逝去了，只留下终年${formatAgeYears(person.age)}岁的背影。`;
            if (successfulTransitions.length > 0) {
                const handovers = successfulTransitions.map((entry)=>`${this.peopleName(entry.successorId)}接任${KNOWLEDGE_NAMES[entry.key]}`).join("、");
                narrative += ` ${handovers}。`;
            }
            if (transitions.some((entry)=>entry.lost)) {
                const lost = transitions.filter((entry)=>entry.lost).map((entry)=>KNOWLEDGE_NAMES[entry.key]).join("、");
                narrative += ` ${lost}失去传承。`;
            }
        }
        this.log("settlement", title, `${narrative.trim()}${familyReaction}`, "danger");
        if (this.population() === 0) {
            this.setEnding("最后一堆火·熄灭");
        }
    }
    relatedWithinThree(a, b) {
        const ancestors = (person, depth)=>{
            const result = new Set();
            let frontier = [
                person.fatherId,
                person.motherId
            ].filter((value)=>value !== null);
            for(let level = 0; level < depth; level += 1){
                const next = [];
                for (const id of frontier){
                    result.add(id);
                    const ancestor = this.state.people.find((entry)=>entry.id === id);
                    if (ancestor) {
                        if (ancestor.fatherId !== null) next.push(ancestor.fatherId);
                        if (ancestor.motherId !== null) next.push(ancestor.motherId);
                    }
                }
                frontier = next;
            }
            return result;
        };
        const aAncestors = ancestors(a, 3);
        const bAncestors = ancestors(b, 3);
        if (aAncestors.has(b.id) || bAncestors.has(a.id)) return true;
        return [
            ...aAncestors
        ].some((id)=>bAncestors.has(id));
    }
    usedKnowledgeIds() {
        const used = new Set();
        for (const card of this.state.knowledge){
            if (card.holderId !== null && !card.lost) used.add(card.holderId);
            for (const id of card.heirIds)if (id !== null) used.add(id);
        }
        return used;
    }
    compareHeirLongevity(a, b) {
        const aRemaining = a.deathAge === null ? Number.POSITIVE_INFINITY : Math.max(0, a.deathAge - a.age);
        const bRemaining = b.deathAge === null ? Number.POSITIVE_INFINITY : Math.max(0, b.deathAge - b.age);
        if (aRemaining !== bRemaining) {
            if (aRemaining === Number.POSITIVE_INFINITY) return -1;
            if (bRemaining === Number.POSITIVE_INFINITY) return 1;
            return bRemaining - aRemaining;
        }
        return a.age - b.age || a.id - b.id;
    }
    chooseHeirCandidate(key) {
        const card = this.knowledge(key);
        const used = this.usedKnowledgeIds();
        const candidates = this.alivePeople().filter((person)=>person.status === "同族" && person.id !== card.holderId && !used.has(person.id));
        if (candidates.length === 0) return null;
        const adults = candidates.filter((person)=>person.age >= 10 && person.age < 40);
        const pool = adults.length > 0 ? adults : candidates;
        return pool.slice().sort((a, b)=>this.compareHeirLongevity(a, b))[0] ?? null;
    }
    fillKnowledgeHeirs(card) {
        if (card.lost || card.holderId === null) {
            card.heirIds = [
                null,
                null
            ];
            card.heirLevels = [
                0,
                0
            ];
            return;
        }
        for(let index = 0; index < 2; index += 1){
            const current = card.heirIds[index];
            if (current !== null && this.person(current)) continue;
            const replacement = this.chooseHeirCandidate(card.key);
            card.heirIds[index] = replacement?.id ?? null;
            card.heirLevels[index] = replacement ? 1 : 0;
        }
    }
    repairKnowledgeSlots() {
        const formerHeirs = [];
        for (const card of this.state.knowledge){
            if (card.lost || card.holderId === null || !this.person(card.holderId)) {
                formerHeirs.push(...card.heirIds.filter((id)=>id !== null));
                card.lost = true;
                card.holderId = null;
                card.level = 0;
                card.heirIds = [
                    null,
                    null
                ];
                card.heirLevels = [
                    0,
                    0
                ];
            } else {
                this.fillKnowledgeHeirs(card);
            }
        }
        const occupied = this.usedKnowledgeIds();
        for (const id of formerHeirs){
            const person = this.person(id);
            if (person && !occupied.has(id)) {
                person.roleLabel = person.age >= 40 ? "长者" : person.age >= 10 ? "成人" : "儿童";
            }
        }
        for (const person of this.alivePeople()){
            if (!occupied.has(person.id) && person.roleLabel.endsWith("知识")) {
                person.roleLabel = person.age >= 40 ? "长者" : person.age >= 10 ? "成人" : "儿童";
            }
        }
    }
    processKnowledgeOnDeath(personId) {
        const transitions = [];
        for (const card of this.state.knowledge){
            if (card.holderId !== personId) continue;
            const heirs = card.heirIds.map((id, index)=>({
                    id,
                    index,
                    level: card.heirLevels[index]
                })).filter((entry)=>entry.id !== null && this.person(entry.id) !== null);
            if (heirs.length === 0) {
                card.holderId = null;
                card.level = 0;
                card.lost = true;
                card.heirIds = [
                    null,
                    null
                ];
                card.heirLevels = [
                    0,
                    0
                ];
                transitions.push({
                    key: card.key,
                    successorId: null,
                    successorLevel: 0,
                    lost: true
                });
                continue;
            }
            heirs.sort((a, b)=>{
                if (b.level !== a.level) return b.level - a.level;
                const aPerson = this.person(a.id);
                const bPerson = this.person(b.id);
                if (!aPerson || !bPerson) return a.id - b.id;
                const aAdult = aPerson.age >= 10 ? 1 : 0;
                const bAdult = bPerson.age >= 10 ? 1 : 0;
                return bAdult - aAdult || this.compareHeirLongevity(aPerson, bPerson);
            });
            const promoted = heirs[0];
            card.holderId = promoted.id;
            card.level = promoted.level;
            card.heirIds[promoted.index] = null;
            card.heirLevels[promoted.index] = 0;
            this.fillKnowledgeHeirs(card);
            transitions.push({
                key: card.key,
                successorId: promoted.id,
                successorLevel: promoted.level,
                lost: false
            });
        }
        return transitions;
    }
    validRoleIds() {
        const holders = new Set(this.state.knowledge.filter((card)=>!card.lost && card.holderId !== null).map((card)=>card.holderId));
        return this.adults().filter((person)=>!holders.has(person.id)).map((person)=>person.id);
    }
    refillRoles() {
        const valid = this.validRoleIds();
        if (valid.length === 0) {
            if (this.state.caregiverId !== null && !this.person(this.state.caregiverId)) this.state.caregiverId = null;
            if (this.state.translatorId !== null && !this.person(this.state.translatorId)) this.state.translatorId = null;
            return;
        }
        if (this.state.caregiverId === null || !this.person(this.state.caregiverId)) {
            this.state.caregiverId = this.pick(valid, "重抽主要照护者");
        }
        if (this.state.translatorId === null || !this.person(this.state.translatorId)) {
            this.state.translatorId = this.pick(valid, "重抽族际中间人");
        }
    }
    experientialLearningCopy(name, source, key) {
        return `${name}切身经历了${source}，顿悟并融会贯通了${KNOWLEDGE_NAMES[key]}知识。`;
    }
    learnFromEvent(key, source) {
        if (this.state.season.nonTeachingIncrements.includes(key)) return null;
        const card = this.knowledge(key);
        const heirs = card.heirIds.map((id, index)=>({
                id,
                index
            })).filter((entry)=>entry.id !== null && this.person(entry.id) !== null);
        if (heirs.length === 0) return null;
        const learners = heirs.filter((entry)=>card.heirLevels[entry.index] < 3);
        if (learners.length === 0) return null;
        for (const learner of learners){
            card.heirLevels[learner.index] = Math.min(3, card.heirLevels[learner.index] + 1);
        }
        this.state.season.nonTeachingIncrements.push(key);
        const names = learners.map((learner)=>this.peopleName(learner.id)).join("与");
        return this.experientialLearningCopy(names, source, key);
    }
    learnFromRelatedAction(keys, actor, source) {
        for (const key of keys){
            if (this.state.season.nonTeachingIncrements.includes(key)) continue;
            const card = this.knowledge(key);
            if (card.lost) continue;
            const index = card.heirIds.findIndex((id)=>id === actor.id);
            if (index < 0 || card.heirLevels[index] >= 3) continue;
            card.heirLevels[index] += 1;
            this.state.season.nonTeachingIncrements.push(key);
            return `${actor.name}在${source}中实际参与，把${KNOWLEDGE_NAMES[key]}提升到 ${card.heirLevels[index]}。`;
        }
        return null;
    }
    markCrossgroupSuccess() {
        this.state.season.currentCrossgroupSuccess = true;
        this.state.counters.crossgroupSuccessCount += 1;
    }
    addNewcomer(age, reason) {
        const used = new Set(this.state.people.map((person)=>person.name));
        const name = NAME_POOL.find((candidate)=>!used.has(candidate)) ?? `新人${this.state.nextPersonId}`;
        const sex = this.roll(2, `${reason}性别`).value === 1 ? "男" : "女";
        const person = {
            id: this.state.nextPersonId++,
            name,
            sex,
            age,
            rank: null,
            fatherId: null,
            motherId: null,
            spouseId: null,
            roleLabel: "人员迁入",
            status: "尚未同族",
            health: 6,
            lightInjury: false,
            heavyInjury: false,
            infection: false,
            weak: false,
            frail: false,
            deathAge: null,
            earlyDeath: false,
            removeTurn: null,
            bornGeneration: null,
            bornSeason: null,
            tribeFromTurn: this.state.turn + 3,
            lastPartnerEndGeneration: null,
            frailtyCareGeneration: null,
            frailtyCareUsed: false,
            frailtyChoiceHandled: false
        };
        this.state.people.push(person);
        this.log("migration", "人员迁入", `${person.name}（${age}岁，${sex}）因${reason}加入，尚未同族。`);
        return person;
    }
    reinforceWeakestKnowledge(reason) {
        if (this.state.season.nonTeachingIncrements.length > 0) return null;
        const ranked = this.state.knowledge.slice().sort((a, b)=>{
            const aStatus = a.lost || a.holderId === null ? 0 : a.level < 3 ? 1 : 2;
            const bStatus = b.lost || b.holderId === null ? 0 : b.level < 3 ? 1 : 2;
            if (aStatus !== bStatus) return aStatus - bStatus;
            if (a.level !== b.level) return a.level - b.level;
            return KNOWLEDGE_ORDER.indexOf(a.key) - KNOWLEDGE_ORDER.indexOf(b.key);
        });
        const card = ranked[0];
        if (card.lost || card.holderId === null) {
            const newcomer = this.alivePeople().filter((person)=>person.status === "尚未同族").at(-1);
            if (!newcomer) return null;
            card.lost = false;
            card.holderId = newcomer.id;
            card.level = 1;
            card.heirIds = [
                null,
                null
            ];
            card.heirLevels = [
                0,
                0
            ];
            this.fillKnowledgeHeirs(card);
            this.state.season.nonTeachingIncrements.push(card.key);
            return `${this.experientialLearningCopy(newcomer.name, reason, card.key)}这份知识因此暂由${newcomer.name}持有，熟练度为 1。`;
        }
        const heirIndex = card.heirLevels[0] <= card.heirLevels[1] ? 0 : 1;
        if (card.heirIds[heirIndex] === null || card.heirLevels[heirIndex] >= 3) return null;
        card.heirLevels[heirIndex] += 1;
        this.state.season.nonTeachingIncrements.push(card.key);
        return this.experientialLearningCopy(this.peopleName(card.heirIds[heirIndex]), reason, card.key);
    }
    isAdjacent(a, b) {
        return Math.abs(CAMP_ORDER.indexOf(a) - CAMP_ORDER.indexOf(b)) === 1;
    }
    moveCamp(destination, options = {}) {
        if (this.state.campMigratedThisSeason) {
            return {
                ok: false,
                message: "本季已经完成过营地迁徙。"
            };
        }
        if (!options.special && !this.isAdjacent(this.state.camp, destination)) {
            return {
                ok: false,
                message: "普通营地迁徙只能前往相邻地点。"
            };
        }
        const foodCost = options.foodCost ?? 2;
        if (this.state.resources.food < foodCost) {
            return {
                ok: false,
                message: `食物不足 ${foodCost}，无法迁徙。`
            };
        }
        this.state.resources.food = Math.max(0, this.state.resources.food - foodCost);
        this.state.resources.storage = Math.max(0, this.state.resources.storage - 1);
        this.state.resources.shelter = Math.max(0, this.state.resources.shelter - 1);
        const oldCamp = this.state.camp;
        this.state.camp = destination;
        this.state.campMigratedThisSeason = true;
        this.state.eventMigrationUsed = Boolean(options.event);
        this.state.counters.totalMigrations += 1;
        this.state.history.migrationsByGeneration[String(this.state.generation)] = (this.state.history.migrationsByGeneration[String(this.state.generation)] ?? 0) + 1;
        if (!this.state.history.campsVisited.includes(destination)) {
            this.state.history.campsVisited.push(destination);
        }
        this.applyStorageFloor();
        this.log("migration", "营地迁徙", `${oldCamp} → ${destination}，支付食物 ${foodCost}；储藏与住所各 -1。`);
        this.state.lastMessage = `营地从${oldCamp}迁到${destination}。`;
        return {
            ok: true,
            message: this.state.lastMessage
        };
    }
    getMigrationOptions() {
        return CAMP_ORDER.filter((camp)=>camp !== this.state.camp).map((camp)=>{
            const adjacent = this.isAdjacent(this.state.camp, camp);
            const freeOak = camp === "橡树林坡" && adjacent && this.state.season.event?.modifiers.freeOakMigration;
            const foodCost = freeOak ? 0 : 2;
            const available = adjacent && !this.state.campMigratedThisSeason && this.state.resources.food >= foodCost;
            const reason = !adjacent ? "不相邻" : this.state.campMigratedThisSeason ? "本季已迁徙" : this.state.resources.food < foodCost ? `食物不足 ${foodCost}` : "可迁徙";
            return {
                camp,
                label: camp,
                available,
                reason,
                foodCost
            };
        });
    }
    migrate(destination) {
        if (this.state.phase !== "migration") {
            return {
                ok: false,
                message: "当前不在营地迁徙步骤。"
            };
        }
        const option = this.getMigrationOptions().find((entry)=>entry.camp === destination);
        if (!option?.available) return {
            ok: false,
            message: option?.reason ?? "无法迁徙。"
        };
        const result = this.moveCamp(destination, {
            foodCost: option.foodCost
        });
        if (result.ok) this.setPhase("action");
        return result;
    }
    skipMigration() {
        if (this.state.phase !== "migration") return {
            ok: false,
            message: "当前不在营地迁徙步骤。"
        };
        this.setPhase("action");
        this.state.lastMessage = "本季不迁徙。";
        return {
            ok: true,
            message: this.state.lastMessage
        };
    }
    setPhase(phase) {
        this.state.phase = phase;
    }
    decision(kind, title, body, options, context) {
        this.state.pendingDecision = {
            kind,
            title,
            body,
            options,
            context
        };
    }
    option(id, label, detail, disabled = false, disabledReason = "") {
        return {
            id,
            label,
            detail,
            disabled,
            disabledReason
        };
    }
    clearDecision() {
        this.state.pendingDecision = null;
    }
    addActionResource(ledger, source, key, amount) {
        const delta = amount >= 0 ? this.addResource(key, amount) : (()=>{
            const before = this.state.resources[key];
            this.damageResource(key, -amount, "行动结算");
            return this.state.resources[key] - before;
        })();
        ledger[source] ??= {};
        ledger[source][key] = roundAge((ledger[source][key] ?? 0) + delta);
        return delta;
    }
    netResourceSummary(ledger) {
        const totals = new Map();
        for (const changes of Object.values(ledger)){
            for (const [key, amount] of Object.entries(changes ?? {})){
                totals.set(key, roundAge((totals.get(key) ?? 0) + amount));
            }
        }
        const parts = RESOURCE_KEYS.filter((key)=>Math.abs(totals.get(key) ?? 0) > 0.0001).map((key)=>{
            const amount = totals.get(key);
            return `${RESOURCE_LABELS[key]} ${amount > 0 ? "+" : ""}${formatNumber(amount)}`;
        });
        return parts.length > 0 ? `${parts.join("、")}。` : "";
    }
    snapshotProgress() {
        return {
            camp: this.state.camp,
            resources: {
                ...this.state.resources
            },
            people: this.state.people.map((person)=>({
                    id: person.id,
                    name: person.name,
                    health: person.health,
                    status: person.status
                })),
            knowledge: this.state.knowledge.map((card)=>({
                    key: card.key,
                    holderId: card.holderId,
                    level: card.level,
                    heirIds: [
                        ...card.heirIds
                    ],
                    heirLevels: [
                        ...card.heirLevels
                    ],
                    lost: card.lost
                }))
        };
    }
    progressSummary(before) {
        const after = this.snapshotProgress();
        const parts = [];
        if (before.camp !== after.camp) parts.push(`营地 ${before.camp} → ${after.camp}`);
        for (const key of RESOURCE_KEYS){
            const delta = roundAge(after.resources[key] - before.resources[key]);
            if (delta !== 0) parts.push(`${RESOURCE_LABELS[key]} ${delta > 0 ? "+" : ""}${formatNumber(delta)}`);
        }
        const beforePeople = new Map(before.people.map((person)=>[
                person.id,
                person
            ]));
        for (const person of after.people){
            const old = beforePeople.get(person.id);
            if (!old) {
                parts.push(`${person.name}加入名册`);
                continue;
            }
            if (old.status !== "死亡" && person.status === "死亡") parts.push(`${person.name}死亡`);
            else if (old.status !== "已迁出" && person.status === "已迁出") parts.push(`${person.name}迁出`);
            if (old.health !== person.health) {
                const delta = person.health - old.health;
                parts.push(`${person.name}健康 ${delta > 0 ? "+" : ""}${delta}`);
            }
        }
        const beforeKnowledge = new Map(before.knowledge.map((card)=>[
                card.key,
                card
            ]));
        for (const card of after.knowledge){
            const old = beforeKnowledge.get(card.key);
            if (!old) continue;
            if (old.level !== card.level) {
                parts.push(`${KNOWLEDGE_NAMES[card.key]}熟练度 ${old.level} → ${card.level}`);
            } else if (old.heirIds.join(",") !== card.heirIds.join(",") || old.heirLevels.join(",") !== card.heirLevels.join(",")) {
                const heirText = card.heirIds.map((id, index)=>`${this.peopleName(id)} ${card.heirLevels[index]}`).join("、");
                parts.push(`${KNOWLEDGE_NAMES[card.key]}传承位更新为 ${heirText}`);
            }
        }
        return parts.join("；") || "没有资源、健康或知识变化";
    }
    beginSeason() {
        if (this.state.phase !== "ready") {
            return {
                ok: false,
                message: "请先完成当前季节的待办步骤。"
            };
        }
        this.state.turn = (this.state.generation - 1) * 4 + this.state.seasonIndex;
        this.state.season = emptySeason();
        this.state.campMigratedThisSeason = false;
        this.state.eventMigrationUsed = false;
        this.clearDecision();
        const notes = [];
        const population = this.population();
        const pregnant = this.state.pregnancy.filter((row)=>this.person(row.motherId)).length;
        const base = Math.max(1, 1 + 0.5 * Math.floor((population - 24) / 6));
        const cost = base + (pregnant >= 5 ? 1 : 0);
        const availableFood = this.state.resources.food;
        const fromStorage = Math.min(1, this.state.resources.storage, Math.max(0, cost - availableFood));
        if (fromStorage > 0) {
            this.state.resources.storage -= fromStorage;
            notes.push(`从储藏补足 ${fromStorage}。`);
        }
        const afterFood = availableFood + fromStorage - cost;
        if (afterFood < 0) {
            this.state.resources.food = 0;
            this.state.season.famine = true;
            this.state.season.zeroFoodHandled = true;
            this.groupHurt(1, "季初饥荒");
            this.addResource("cohesion", -1);
            notes.push("食物仍不足：全体健康 -1、凝聚 -1。");
        } else {
            this.state.resources.food = afterFood;
            notes.push(`固定食物消耗 ${cost}。`);
        }
        if (this.season === "winter") {
            if (this.state.resources.fuel > 0) {
                this.state.resources.fuel -= 1;
                notes.push("冬季额外消耗燃料 1。");
            } else {
                this.groupHurt(1, "冬季无燃料");
                notes.push("燃料为 0：全体健康 -1。");
            }
        }
        if (this.state.currentTrend === "邻族压力" && this.state.resources.network === 0) {
            this.addResource("cohesion", -1);
            notes.push("邻族压力且网络为 0：凝聚 -1。");
        }
        if (this.state.currentTrend === "海侵与咸水" && this.state.camp === "河口浅滩") {
            this.addResource("food", -1);
            if (this.season === "winter") {
                if (this.state.resources.material > 0) {
                    this.addResource("material", -1);
                    notes.push("海侵趋势使河口过冬多耗材料 1。");
                } else {
                    this.addResource("fuel", -1);
                    notes.push("海侵趋势使河口过冬多耗燃料 1。");
                }
            }
        }
        this.state.season.startNotes = notes;
        this.log("system", `${SEASON_LABELS[this.season]}开始`, notes.join(" "));
        if (this.state.phase === "ended") return {
            ok: true,
            message: this.state.ending?.title ?? "游戏结束"
        };
        this.drawEvent();
        if (this.state.phase === "ended") return {
            ok: true,
            message: this.state.ending?.title ?? "游戏结束"
        };
        return {
            ok: true,
            message: this.state.pendingDecision?.title ?? this.state.season.event?.name ?? "季节开始"
        };
    }
    drawEvent() {
        const season = this.season;
        let deck = Array.from({
            length: 10
        }, (_, index)=>index + 1);
        if (season === "autumn" && (this.state.generation <= 2 || this.state.counters.actualAlliances === 0)) {
            deck = deck.filter((card)=>card !== 9);
        }
        const tendency = EVENT_TENDENCIES.filter((entry)=>entry.season === season && entry.camps.includes(this.state.camp)).flatMap((entry)=>entry.cards);
        deck.push(...tendency);
        const card = this.pick(deck, `${SEASON_LABELS[season]}地点加权事件`);
        const name = EVENT_NAMES[season][card - 1];
        this.state.season.event = {
            id: `${season}-${card}`,
            card,
            name,
            season,
            text: EVENT_TEXT[name] ?? name,
            resultText: "",
            baseResultText: "",
            logId: null,
            resolved: false,
            modifiers: {
                fishingBonus: 0,
                wetlandBonus: 0,
                wetlandMaterialBonus: 0,
                wildRiceBonus: 0,
                wildRiceProgressBonus: 0,
                weaveDiscount: false,
                huntBonus: 0,
                harvestBonus: 0,
                birdFishingBonus: false,
                freeOakMigration: false
            },
            choiceToken: null,
            baseline: this.snapshotProgress()
        };
        this.resolveEvent(season, card, name);
    }
    finishEvent(resultTextOverride, supplement = "") {
        if (!this.state.season.event || this.state.season.event.resolved) return;
        const event = this.state.season.event;
        event.resolved = true;
        let resultText = event.baseline ? this.progressSummary(event.baseline) : "事件已结算";
        if (resultText === "没有资源、健康或知识变化" && Object.values(event.modifiers).some((value)=>value !== 0 && value !== false)) {
            resultText = "事件效果已生效，将在本季行动中结算";
        }
        if (resultTextOverride) {
            resultText = resultTextOverride;
        } else if (supplement) {
            resultText = resultText === "没有资源、健康或知识变化" ? supplement : `${resultText}；${supplement}`;
        }
        event.resultText = resultText;
        event.baseResultText = event.resultText;
        event.logId = this.log("event", `${SEASON_LABELS[event.season]}事件：${event.name}`, event.resultText);
        this.clearDecision();
        if (this.state.phase === "ended") return;
        this.setPhase("migration");
        this.state.lastMessage = "事件已结算，可以选择是否迁徙。";
    }
    startEventDecision(token, title, body, options) {
        if (this.state.season.event) {
            this.state.season.event.choiceToken = token;
            this.state.season.event.resolved = false;
        }
        this.decision("event", title, body, options, {
            token
        });
        this.setPhase("eventDecision");
    }
    wearForWater(reason) {
        if (this.state.resources.material > 0 && this.state.resources.clothes <= 1) {
            this.addResource("material", -1);
            return;
        }
        if (this.state.resources.clothes > 0) {
            this.addResource("clothes", -1);
            return;
        }
        const victim = this.randomPerson(null, `${reason}衣物损失`);
        if (victim) this.hurt(victim, 1, reason);
    }
    resolveEvent(season, card, name) {
        const mods = this.state.season.event.modifiers;
        let learning = "";
        if (season === "spring") {
            if (card === 1) {
                if (WATER_CAMPS.includes(this.state.camp)) {
                    this.startEventDecision("spring-flood", "春汛来袭", "水边营地必须立即承担损失，或迁往高丘。", [
                        this.option("lose-food", "失去食物 1", "保留住所。"),
                        this.option("lose-shelter", "失去住所 1", "保留食物。"),
                        this.option("migrate-high", "迁往高丘", "标准迁徙费用；本季不再移动。", this.state.resources.food < 2 || this.state.campMigratedThisSeason, "食物不足 2 或本季已迁徙")
                    ]);
                } else {
                    mods.fishingBonus += 1;
                    this.finishEvent();
                }
                return;
            }
            if (card === 2) {
                if (WATER_CAMPS.includes(this.state.camp)) mods.fishingBonus += 1;
                else this.addResource("cohesion", 1);
                this.finishEvent();
                return;
            }
            if (card === 3) {
                if (this.state.camp === "芦苇湖沼") {
                    mods.wetlandBonus += 1;
                    mods.wetlandMaterialBonus += 1;
                } else {
                    mods.weaveDiscount = true;
                }
                this.finishEvent();
                return;
            }
            if (card === 4) {
                const victim = this.randomPerson(null, "湿热病随机人物");
                if (victim) {
                    const result = this.healthTest(victim, "湿热病", {
                        care: true
                    });
                    this.markWeak(victim);
                    if (result.result === "不利") this.hurt(victim, 1, "湿热病");
                    if (result.result === "部分") {
                        this.hurt(victim, 1, "湿热病");
                        this.addResource("care", 1);
                    }
                }
                this.finishEvent();
                return;
            }
            if (card === 5) {
                const person = this.randomPerson("成人", "陌生人到来随机成人");
                const result = this.networkTest(person, "陌生人到来");
                if (result.result === "不利") this.addResource("cohesion", -1);
                if (result.result === "部分") this.addResource("material", 1);
                if (result.result === "有利") {
                    this.addResource("network", 1);
                    this.markCrossgroupSuccess();
                }
                this.finishEvent();
                return;
            }
            if (card === 6) {
                if (WATER_CAMPS.includes(this.state.camp)) {
                    this.startEventDecision("river-collapse", "河岸坍塌", "住所或材料将受损，也可以直接迁往高丘。", [
                        this.option("lose-material", "失去材料 1", "保留住所。", this.state.resources.material < 1, "材料不足"),
                        this.option("lose-shelter", "失去住所 1", "保留材料。"),
                        this.option("migrate-high", "迁往高丘", "标准迁徙费用；本季不再移动。", this.state.resources.food < 2 || this.state.campMigratedThisSeason, "食物不足 2 或本季已迁徙")
                    ]);
                } else {
                    this.finishEvent("万幸，我们远离了喜怒不定的河流，没有造成损失。");
                }
                return;
            }
            if (card === 7) {
                const hunter = this.randomPerson("成人", "幼兽出现随机猎人");
                if (hunter) {
                    const result = this.test([
                        this.healthModifier(hunter),
                        this.caregiverModifier(),
                        this.state.resources.dog > 0 ? 1 : 0
                    ], "幼兽出现狩猎");
                    if (result.result === "有利") this.addResource("food", 2);
                    if (result.result === "部分") this.addResource("food", 1);
                    if (result.result === "不利") {
                        this.addResource("food", 1);
                        this.markWeak(hunter);
                        this.hurt(hunter, 1, "幼兽出现");
                        hunter.lightInjury = true;
                    }
                }
                this.finishEvent();
                return;
            }
            if (card === 8) {
                const person = this.randomPerson("成人", "邻族借道随机成人");
                const result = this.networkTest(person, "邻族借道");
                if (result.result === "不利") this.addResource("cohesion", -1);
                else if (result.result === "有利") {
                    this.addResource("network", 1);
                    this.markCrossgroupSuccess();
                } else this.addResource("material", 1);
                this.finishEvent();
                return;
            }
            if (card === 9) {
                if (this.state.resources.storage >= 1) {
                    this.startEventDecision("food-shortage", "春末缺食", "可以动用 1 点储藏，或直接失去 1 食物。", [
                        this.option("use-storage", "使用储藏 1", "避免食物损失。"),
                        this.option("lose-food", "失去食物 1", "保留储藏。")
                    ]);
                } else {
                    this.damageResource("food", 1, "春末缺食");
                    if (this.state.resources.food === 0) this.groupHurt(1, "春末缺食");
                    this.finishEvent();
                }
                return;
            }
            if (card === 10) {
                if ([
                    "河湾营地",
                    "芦苇湖沼"
                ].includes(this.state.camp)) {
                    mods.wildRiceBonus += 1;
                    mods.wildRiceProgressBonus += 1;
                } else {
                    this.addResource("food", 1);
                }
                this.finishEvent();
                return;
            }
        }
        if (season === "summer") {
            if (card === 1) {
                if (this.state.camp === "芦苇湖沼") {
                    mods.wetlandBonus += 1;
                    mods.wetlandMaterialBonus += 1;
                } else {
                    this.addResource("food", 1);
                }
            } else if (card === 2) {
                const victim = this.randomPerson(null, "盛夏热病随机人物");
                if (victim) {
                    const result = this.healthTest(victim, "盛夏热病", {
                        care: true,
                        extra: this.effectiveShelter() >= 2 ? 1 : 0
                    });
                    this.markWeak(victim);
                    if (result.result !== "有利") this.hurt(victim, 1, "盛夏热病");
                    if (result.result === "部分") this.addResource("care", 1);
                }
            } else if (card === 3) {
                if (WATER_CAMPS.includes(this.state.camp)) {
                    this.startEventDecision("storm", "雷暴与洪水", "水边营地必须选择一种应对方式。", [
                        this.option("migrate-high", "迁往高丘", "支付标准迁徙费用，本季不再移动。", this.state.resources.food < 2 || this.state.campMigratedThisSeason, "食物不足 2 或本季已迁徙"),
                        this.option("reinforce", "材料 2 加固", "避免本次洪水损失。", this.state.resources.material < 2, "材料不足 2"),
                        this.option("endure", "留在原地硬扛", "住所 >1 时住所 -1；否则食物 -1。随后衣物 -1，或耗材料 1 修补。")
                    ]);
                    return;
                }
                this.addResource("fuel", -1);
            } else if (card === 4) {
                if ([
                    "芦苇湖沼",
                    "河口浅滩"
                ].includes(this.state.camp)) {
                    this.addResource("food", 2);
                    mods.birdFishingBonus = true;
                } else {
                    this.addResource("material", 1);
                }
            } else if (card === 5) {
                const victim = this.randomPerson(null, "水华与浊水随机人物");
                if (victim) {
                    const result = this.healthTest(victim, "水华与浊水", {
                        extra: this.fullKnowledge("water") ? 1 : 0
                    });
                    this.markWeak(victim);
                    if (result.result === "不利") {
                        this.hurt(victim, 1, "水华与浊水");
                        this.damageResource("food", 1, "水华与浊水");
                    } else if (result.result === "部分") {
                        this.damageResource("food", 1, "水华与浊水");
                    }
                }
            } else if (card === 6) {
                const exempt = [];
                if (this.fullKnowledge("care")) {
                    const protectedPerson = this.randomPerson(null, "蚊群治疗保护");
                    if (protectedPerson) exempt.push(protectedPerson.id);
                }
                const pool = this.alivePeople().filter((person)=>person.status === "同族" && !exempt.includes(person.id));
                if (this.effectiveShelter() >= 2) {
                    const targets = this.shuffle(pool, "蚊群目标").slice(0, this.hasWetlandContinuity() ? 1 : 2);
                    for (const person of targets)this.hurt(person, 1, "蚊群暴发");
                } else {
                    const targets = this.hasWetlandContinuity() ? this.shuffle(pool, "蚊群湿地保护").slice(0, 2) : pool;
                    for (const person of targets)this.hurt(person, 1, "蚊群暴发");
                }
            } else if (card === 7) {
                if (this.fullKnowledge("water")) this.addResource("material", -1);
                else this.addResource("food", -1);
                if ([
                    "河湾营地",
                    "芦苇湖沼"
                ].includes(this.state.camp)) mods.fishingBonus += 1;
                learning = this.learnFromEvent("water", "鱼群缺氧") ?? "";
            } else if (card === 8) {
                if (this.state.camp === "河口浅滩") {
                    this.startEventDecision("summer-estuary-surge", "河口咸潮", "留在河口会同时失去 1 食物和 1 住所；也可以支付迁徙费用前往湖沼。", [
                        this.option("remain", "留在河口", "食物 -1、住所 -1。"),
                        this.option("migrate-inland", "迁往芦苇湖沼", "支付标准迁徙费用，本季不再移动。", this.state.resources.food < 2 || this.state.campMigratedThisSeason, "食物不足 2 或本季已迁徙")
                    ]);
                    return;
                }
                this.addResource("material", 1);
                this.finishEvent(undefined, "营地不在河口，咸潮没有直接影响我们的水源和住处。");
                return;
            } else if (card === 9) {
                const person = this.randomPerson("成人", "外来者避雨随机成人");
                const result = this.networkTest(person, "外来者避雨");
                if (result.result === "不利") this.addResource("cohesion", -1);
                else if (result.result === "有利") {
                    this.addResource("network", 1);
                    this.addResource("material", 1);
                    this.markCrossgroupSuccess();
                } else this.addResource("material", 1);
                learning = this.learnFromEvent("story", "外来者避雨") ?? "";
            } else if (card === 10) {
                if (this.fullKnowledge("fire")) this.addResource("fuel", -1);
                else {
                    this.addResource("shelter", -1);
                    this.addResource("material", -1);
                }
                if (this.state.camp === "橡树林坡") this.addResource("food", -1);
                learning = this.learnFromEvent("fire", "雷击起火") ?? "";
                this.finishEvent(undefined, learning ?? "");
                return;
            }
            this.finishEvent(undefined, learning);
            return;
        }
        if (season === "autumn") {
            if (card === 1) {
                if (this.state.camp === "橡树林坡") mods.harvestBonus += 2;
                else if (this.isAdjacent(this.state.camp, "橡树林坡")) mods.freeOakMigration = true;
            } else if (card === 2) {
                if (HILL_CAMPS.includes(this.state.camp)) mods.huntBonus += 2;
                else this.addResource("food", 1);
            } else if (card === 3) {
                this.offerStorageDamage("储藏受潮");
                return;
            } else if (card === 4) {
                if (this.state.resources.network >= 1) {
                    const person = this.randomPerson("成人", "秋社换工随机成人");
                    const result = this.test([
                        this.translatorModifier(),
                        this.caregiverModifier()
                    ], "秋社换工");
                    if (result.result === "不利") this.addResource("cohesion", -1);
                    if (result.result === "部分") this.addResource("material", 1);
                    if (result.result === "有利") {
                        this.addResource("material", 1);
                        this.addResource("cohesion", 1);
                        this.markCrossgroupSuccess();
                    }
                } else {
                    this.addResource(this.state.resources.care < RESOURCE_CAPS.care ? "care" : "material", 1);
                }
            } else if (card === 5) {
                if (HILL_CAMPS.includes(this.state.camp)) {
                    const result = this.test([
                        this.fullKnowledge("fire") ? 1 : 0,
                        this.caregiverModifier()
                    ], "用火管理");
                    if (result.result === "不利") this.addResource("fuel", -1);
                    if (result.result === "部分") this.addResource("food", 1);
                    if (result.result === "有利") this.addResource("food", 2);
                }
            } else if (card === 6) {
                if (this.state.resources.dog === 0 && this.state.resources.network < 2) {
                    this.damageResource("food", 1, "野猪拱橡林");
                } else if (this.state.resources.network >= 2 && this.state.resources.dog === 0) {
                    this.addResource("material", -1);
                }
            } else if (card === 7) {
                if (WATER_CAMPS.includes(this.state.camp)) {
                    this.addResource("food", 2);
                    if (this.fullKnowledge("water")) this.addResource("food", 1);
                } else {
                    this.addResource("food", 1);
                }
            } else if (card === 8) {
                this.offerStorageDamage("虫蛀储藏");
                return;
            } else if (card === 9) {
                if (this.state.counters.actualAlliances === 0) {
                    this.finishEvent();
                    return;
                }
                this.startEventDecision("contract-break", "盟约破裂", "必须选择保留关系、保住物资，或接收一名迁入者。", [
                    this.option("keep-network", "付资源保网络", "支付食物 1 或材料 1；凝聚 -1。", this.state.resources.food < 1 && this.state.resources.material < 1, "没有可支付资源"),
                    this.option("keep-goods", "保物资", "网络 -1、凝聚 -1。"),
                    this.option("accept-person", "接收人员", "支付食物 1、网络 -1；1 名 15 岁成人迁入。", this.state.resources.food < 1 || this.population() >= 39, "食物不足或人口已达到 39")
                ]);
                return;
            } else if (card === 10) {
                this.damageResource("food", 1, "早霜");
                this.addResource("fuel", -1);
                if (this.effectiveShelter() + this.state.resources.clothes <= 2) this.groupHurt(1, "早霜");
                if (this.fullKnowledge("plant")) this.addResource("food", 1);
                learning = this.learnFromEvent("plant", "早霜") ?? "";
                this.finishEvent(undefined, learning);
                return;
            }
            this.finishEvent();
            return;
        }
        if (season === "winter") {
            if (card === 1) {
                this.damageResource("food", 1, "冷脉冲");
                const victim = this.randomPerson(null, "冷脉冲随机人物");
                if (victim) {
                    const result = this.healthTest(victim, "冷脉冲", {
                        extra: this.effectiveShelter() + this.state.resources.clothes >= 3 ? 1 : 0
                    });
                    this.markWeak(victim);
                    if (result.result === "部分") this.damageResource("food", 1, "冷脉冲");
                    if (result.result === "不利") this.hurt(victim, 1, "冷脉冲");
                }
            } else if (card === 2) {
                if (this.state.resources.material > 0) {
                    this.startEventDecision("fuel-shortage", "燃料短缺", "可以用 1 材料替代燃料，或直接失去 1 燃料。", [
                        this.option("use-material", "改耗材料 1", "保留燃料；若住所与衣物合计 ≤2，仍全体健康 -1。"),
                        this.option("lose-fuel", "失去燃料 1", "保留材料；若住所与衣物合计 ≤2，仍全体健康 -1。")
                    ]);
                    return;
                }
                this.addResource("fuel", -1);
                if (this.effectiveShelter() + this.state.resources.clothes <= 2) this.groupHurt(1, "燃料短缺");
            } else if (card === 3) {
                this.addResource("care", -1);
                const elder = this.randomPerson("长者", "老辈病重随机长者");
                if (elder) {
                    const result = this.healthTest(elder, "老辈病重", {
                        care: true
                    });
                    this.markWeak(elder);
                    if (result.result !== "有利") this.hurt(elder, 1, "老辈病重");
                    if (result.result === "不利") {
                        const child = this.randomPerson("儿童", "老辈病重随机儿童");
                        if (child) this.hurt(child, 1, "老辈病重");
                    }
                }
            } else if (card === 4) {
                const child = this.randomPerson("儿童", "孩子发烧随机儿童");
                if (child) {
                    let result = this.healthTest(child, "孩子发烧", {
                        care: true
                    });
                    if (result.result === "不利" && this.hasChildCareContinuity() && !this.state.season.childProtectionUsed) {
                        this.state.season.childProtectionUsed = true;
                        result = this.healthTest(child, "孩子发烧重掷", {
                            care: true
                        });
                    }
                    this.markWeak(child);
                    if (result.result === "不利") {
                        this.hurt(child, 1, "孩子发烧");
                        this.damageResource("food", 1, "孩子发烧");
                    } else if (result.result === "部分") {
                        this.damageResource("food", 1, "孩子发烧");
                    } else {
                        this.addResource("care", 1);
                    }
                    learning = this.learnFromEvent("care", "孩子发烧") ?? "";
                }
            } else if (card === 5) {
                if (this.state.camp === "河口浅滩") {
                    this.startEventDecision("winter-incursion", "海侵与咸水", "选择失去 1 食物或 1 住所；也可以支付迁徙费用前往湖沼。", [
                        this.option("lose-food", "失去食物 1", "保留住所。"),
                        this.option("lose-shelter", "失去住所 1", "保留食物。"),
                        this.option("migrate-inland", "迁往芦苇湖沼", "支付标准迁徙费用，本季不再移动。", this.state.resources.food < 2 || this.state.campMigratedThisSeason, "食物不足 2 或本季已迁徙")
                    ]);
                    return;
                }
                this.addResource("material", 1);
            } else if (card === 6) {
                this.addResource("shelter", -1);
                if (this.effectiveShelter() <= 1) {
                    const exempt = [];
                    if (this.state.resources.clothes >= 2) {
                        const lucky = this.randomPerson(null, "冻雨衣物保护");
                        if (lucky) exempt.push(lucky.id);
                    }
                    this.groupHurt(1, "冻雨", exempt);
                }
            } else if (card === 7) {
                if (HILL_CAMPS.includes(this.state.camp)) {
                    const hunter = this.randomPerson("成人", "鹿群越冬随机猎人");
                    if (hunter) {
                        const result = this.test([
                            this.healthModifier(hunter),
                            this.state.resources.dog > 0 ? 1 : 0
                        ], "鹿群越冬狩猎");
                        if (result.result === "有利") this.addResource("food", 2);
                        if (result.result === "部分") this.addResource("food", 1);
                        if (result.result === "不利") {
                            this.addResource("food", 1);
                            this.hurt(hunter, 1, "鹿群越冬");
                        }
                    }
                }
            } else if (card === 8) {
                this.addResource("fuel", -1);
                if (!this.fullKnowledge("fire")) {
                    if (this.state.season.currentCared) {
                        this.startEventDecision("fire-bank", "火塘熄灭", "本季已经照顾过营地，可以改失凝聚保住住所。", [
                            this.option("lose-shelter", "失去住所 1", "保留凝聚。"),
                            this.option("lose-cohesion", "失去凝聚 1", "保住住所。")
                        ]);
                        return;
                    }
                    this.addResource("shelter", -1);
                }
                learning = this.learnFromEvent("fire", "火塘熄灭") ?? "";
                this.finishEvent(undefined, learning);
                return;
            } else if (card === 9) {
                const canAvoid = this.state.resources.food >= 1 && Boolean(this.person(this.state.caregiverId) || this.person(this.state.translatorId));
                if (canAvoid) {
                    this.startEventDecision("food-dispute", "食物分配争执", "可以拿出 1 食物维持凝聚。", [
                        this.option("pay-food", "支付食物 1", "凝聚不降。"),
                        this.option("accept-dispute", "不支付", "凝聚 -1；若凝聚力≤2，再随机伤一人。")
                    ]);
                    return;
                }
                this.addResource("cohesion", -1);
                if (this.state.resources.cohesion <= 2) {
                    const victim = this.randomPerson(null, "食物分配争执");
                    if (victim) this.hurt(victim, 1, "食物分配争执");
                }
            } else if (card === 10) {
                this.startEventDecision("neighbor-aid", "邻族求援", "给出食物可以扩大网络，也可以拒绝。", [
                    this.option("give-food", "给出食物 1", "网络 +1；若本季尚未学习，再强化一项最薄弱知识。", this.state.resources.food < 1, "食物不足"),
                    this.option("refuse", "拒绝", "凝聚 -1。")
                ]);
                return;
            }
            this.finishEvent(undefined, learning);
        }
    }
    offerStorageDamage(reason) {
        if (this.effectiveShelter() >= 2 && this.state.resources.food >= 1) {
            this.startEventDecision("storage-damage", reason, "较好住所能让你改失 1 食物，保住储藏。", [
                this.option("lose-storage", "失去储藏 1", "若没有储藏则失去材料 1。"),
                this.option("lose-food", "改为失去食物 1", "避免储藏或材料损失。")
            ]);
            return;
        }
        if (this.state.resources.storage > 0) this.addResource("storage", -1);
        else this.addResource("material", -1);
        this.finishEvent();
    }
    hasChildCareContinuity() {
        const history = this.state.history.care;
        return Boolean(this.person(this.state.caregiverId) && history.length >= 2 && history.at(-1) >= 2 && history.at(-2) >= 2);
    }
    hasWetlandContinuity() {
        return this.state.camp === "芦苇湖沼" && this.state.previousCamp === "芦苇湖沼";
    }
    resolveDecision(optionId) {
        const pending = this.state.pendingDecision;
        if (!pending) return {
            ok: false,
            message: "当前没有待选项。"
        };
        const option = pending.options.find((item)=>item.id === optionId);
        if (!option || option.disabled) return {
            ok: false,
            message: option?.disabledReason ?? "选项不可用。"
        };
        if (pending.kind === "event") return this.resolveEventChoice(optionId);
        if (pending.kind === "unexpected") return this.resolveUnexpectedChoice(optionId);
        if (pending.kind === "alliance") return this.resolveAllianceChoice(optionId);
        if (pending.kind === "frailty") return this.resolveFrailtyChoice(optionId);
        if (pending.kind === "survival") return this.resolveSurvivalChoice(optionId);
        if (pending.kind === "ending") return this.resolveEndingChoice(optionId);
        return {
            ok: false,
            message: "未知待选项。"
        };
    }
    resolveEventChoice(optionId) {
        const token = this.state.season.event?.choiceToken;
        let message = "";
        let learning = "";
        if (token === "spring-flood" || token === "river-collapse") {
            if (optionId === "lose-food") {
                this.damageResource("food", 1, this.state.season.event?.name ?? "水灾");
            } else if (optionId === "lose-material") {
                this.addResource("material", -1);
            } else if (optionId === "lose-shelter") {
                this.addResource("shelter", -1);
            } else if (optionId === "migrate-high") {
                const moved = this.moveCamp("高丘营地", {
                    foodCost: 2,
                    event: "water-event",
                    special: true
                });
                if (!moved.ok) return moved;
            }
            message = "水边损失已经结算。";
        } else if (token === "storm") {
            if (optionId === "migrate-high") {
                const moved = this.moveCamp("高丘营地", {
                    foodCost: 2,
                    event: "storm",
                    special: true
                });
                if (!moved.ok) return moved;
            } else if (optionId === "reinforce") {
                this.addResource("material", -2);
            } else {
                if (this.state.resources.shelter > 1) this.addResource("shelter", -1);
                else this.damageResource("food", 1, "雷暴与洪水");
                this.wearForWater("雷暴与洪水");
            }
            message = "雷暴与洪水已经处理。";
        } else if (token === "summer-estuary-surge") {
            if (optionId === "migrate-inland") {
                const moved = this.moveCamp("芦苇湖沼", {
                    foodCost: 2,
                    event: "surge"
                });
                if (!moved.ok) return moved;
            } else {
                this.damageResource("food", 1, "咸潮");
                this.addResource("shelter", -1);
            }
            message = "咸潮已经处理。";
        } else if (token === "winter-incursion") {
            if (optionId === "migrate-inland") {
                const moved = this.moveCamp("芦苇湖沼", {
                    foodCost: 2,
                    event: "surge"
                });
                if (!moved.ok) return moved;
            } else if (optionId === "lose-food") {
                this.damageResource("food", 1, "海侵与咸水");
            } else {
                this.addResource("shelter", -1);
            }
            message = "海侵损失已经处理。";
        } else if (token === "estuary-surge") {
            if (optionId === "migrate-inland") {
                const moved = this.moveCamp("芦苇湖沼", {
                    foodCost: 2,
                    event: "surge"
                });
                if (!moved.ok) return moved;
            } else if (this.state.season.event?.season === "winter") {
                if (optionId === "lose-food") this.damageResource("food", 1, "海侵与咸水");
                else this.addResource("shelter", -1);
            } else {
                this.damageResource("food", 1, "咸潮");
                this.addResource("shelter", -1);
            }
            message = "旧存档中的咸潮裁定已经处理。";
        } else if (token === "food-shortage") {
            if (optionId === "use-storage") this.addResource("storage", -1);
            else {
                this.damageResource("food", 1, "春末缺食");
                if (this.state.resources.food === 0) {
                    this.groupHurt(1, "春末缺食");
                    this.addResource("cohesion", -1);
                }
            }
            message = "春末缺食已经处理。";
        } else if (token === "storage-damage") {
            if (optionId === "lose-food") this.damageResource("food", 1, this.state.season.event?.name ?? "储藏受损");
            else if (this.state.resources.storage > 0) this.addResource("storage", -1);
            else this.addResource("material", -1);
            message = "储藏损失已经处理。";
        } else if (token === "contract-break") {
            if (optionId === "keep-network") {
                if (this.state.resources.material >= 1) this.addResource("material", -1);
                else this.addResource("food", -1);
                this.addResource("cohesion", -1);
            } else if (optionId === "keep-goods") {
                this.addResource("network", -1);
                this.addResource("cohesion", -1);
            } else if (optionId === "accept-person") {
                this.addResource("food", -1);
                this.addResource("network", -1);
                const newcomer = this.addNewcomer(15, "盟约破裂");
                this.state.allianceNewcomerIds.push(newcomer.id);
                this.markCrossgroupSuccess();
                learning = this.reinforceWeakestKnowledge("人员迁入") ?? "";
            }
            message = "盟约破裂已经处理。";
        } else if (token === "fuel-shortage") {
            if (optionId === "use-material") this.addResource("material", -1);
            else this.addResource("fuel", -1);
            if (this.effectiveShelter() + this.state.resources.clothes <= 2) this.groupHurt(1, "燃料短缺");
            message = "燃料短缺已经处理。";
        } else if (token === "fire-bank") {
            if (optionId === "lose-cohesion") this.addResource("cohesion", -1);
            else this.addResource("shelter", -1);
            message = "火塘损失已经处理。";
        } else if (token === "food-dispute") {
            if (optionId === "pay-food") this.addResource("food", -1);
            else {
                this.addResource("cohesion", -1);
                if (this.state.resources.cohesion <= 2) {
                    const victim = this.randomPerson(null, "食物分配争执");
                    if (victim) this.hurt(victim, 1, "食物分配争执");
                }
            }
            message = "食物分配争执已经处理。";
        } else if (token === "neighbor-aid") {
            if (optionId === "give-food") {
                this.addResource("food", -1);
                this.addResource("network", 1);
                learning = this.reinforceWeakestKnowledge("邻族求援") ?? "";
                if (learning) message = learning;
                this.markCrossgroupSuccess();
            } else {
                this.addResource("cohesion", -1);
            }
            message ||= "邻族求援已经处理。";
        }
        this.finishEvent(undefined, learning);
        return {
            ok: true,
            message
        };
    }
    seasonAllows(actionId) {
        if (actionId === "rice") return this.season !== "winter";
        return true;
    }
    locationAllows(actionId) {
        const camp = this.state.camp;
        if (actionId === "wetland") return [
            "芦苇湖沼",
            "河口浅滩"
        ].includes(camp);
        if (actionId === "fish") return WATER_CAMPS.includes(camp);
        if (actionId === "hunt") return HILL_CAMPS.includes(camp);
        if (actionId === "harvest") return [
            "橡树林坡",
            "芦苇湖沼"
        ].includes(camp);
        if (actionId === "rice") return [
            "河湾营地",
            "芦苇湖沼"
        ].includes(camp);
        return true;
    }
    locationMatch(actionId) {
        if (actionId === "wetland") return [
            "芦苇湖沼",
            "河口浅滩"
        ].includes(this.state.camp);
        if (actionId === "fish") return WATER_CAMPS.includes(this.state.camp);
        if (actionId === "hunt") return HILL_CAMPS.includes(this.state.camp);
        if (actionId === "harvest") return [
            "橡树林坡",
            "芦苇湖沼"
        ].includes(this.state.camp);
        if (actionId === "rice") return [
            "河湾营地",
            "芦苇湖沼"
        ].includes(this.state.camp);
        if (actionId === "shelter") return WATER_CAMPS.includes(this.state.camp);
        if (actionId === "craft") return [
            "河湾营地",
            "芦苇湖沼"
        ].includes(this.state.camp);
        if (actionId === "fuel") return HILL_CAMPS.includes(this.state.camp);
        return false;
    }
    baseActionId(actionId) {
        if (actionId.startsWith("train:")) return "train";
        if (actionId === "care-community" || actionId === "care-treat") return "care";
        return actionId;
    }
    actionUsed(baseId) {
        return this.state.season.actions.some((id)=>this.baseActionId(id) === baseId);
    }
    actionReason(actionId) {
        if (this.actionUsed(this.baseActionId(actionId))) return "本季已使用这张行动卡";
        if (actionId === "care-treat" && this.treatablePeople().length === 0) {
            return "人物列表中没有健康不满或有伤势的人";
        }
        if (!this.seasonAllows(actionId)) return "当前季节不可用";
        if (!this.locationAllows(actionId)) return "当前营地不可用";
        if (actionId === "shelter" && this.state.resources.material < 1) return "材料不足 1";
        if (actionId === "weave" && this.state.resources.material < (this.state.season.event?.modifiers.weaveDiscount ? 0 : 1)) return "材料不足";
        if (actionId === "storage" && this.state.resources.food < 2) return "食物不足 2";
        if ([
            "care-community",
            "care-treat"
        ].includes(actionId) && this.state.resources.food < 1) return "食物不足 1";
        if (actionId === "contact" && this.state.resources.material < 1 && this.state.resources.food < 1) return "没有食物或材料可支付";
        if (actionId === "craft" && (this.state.resources.fuel < 1 || this.state.resources.material < 1)) return "燃料或材料不足";
        if (actionId === "dog" && this.state.resources.dog > 0) return "已经有看家狗";
        if (actionId.startsWith("train:")) {
            const key = actionId.split(":")[1];
            const card = this.knowledge(key);
            const holder = this.holder(key);
            if (this.state.resources.food < 3) return "训练要求食物 ≥3";
            if (!holder || holder.age < 10) return "当前持有人不能主持训练";
            if (card.lost) return "知识已经失传";
            if (!card.heirIds.some((id)=>id !== null && this.person(id))) return "没有在世传承人";
        }
        return "";
    }
    availableActions() {
        return ACTION_DEFINITIONS.map((def)=>{
            const reason = this.actionReason(def.id);
            return {
                id: def.id,
                label: def.label,
                description: def.description,
                available: reason === "",
                reason,
                cost: def.cost,
                conditions: def.conditions,
                outcomes: def.outcomes,
                bonus: def.bonus,
                knowledge: def.knowledge,
                mode: def.id.startsWith("care-") ? def.id.split("-")[1] : undefined
            };
        });
    }
    availableKnowledgeForAction(actionId) {
        return this.actionKnowledgeKeys(actionId).filter((key)=>this.fullKnowledge(key));
    }
    actionKnowledgeKeys(actionId) {
        if (actionId === "craft") return [
            "fire",
            "water"
        ];
        if (actionId.startsWith("train:")) return [
            actionId.split(":")[1]
        ];
        const def = ACTION_DEFINITIONS.find((entry)=>entry.id === actionId);
        return def?.knowledge ? [
            def.knowledge
        ] : [];
    }
    actorCandidatesForAction(actionId) {
        if (actionId.startsWith("train:")) {
            const holder = this.holder(actionId.split(":")[1]);
            return holder ? [
                holder
            ] : [];
        }
        const keys = this.actionKnowledgeKeys(actionId);
        if (keys.length > 0) {
            const orderedIds = [];
            for (const key of keys){
                const card = this.knowledge(key);
                if (card.holderId !== null) orderedIds.push(card.holderId);
                for (const id of card.heirIds)if (id !== null) orderedIds.push(id);
            }
            const seen = new Set();
            const candidates = orderedIds.filter((id)=>{
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            }).map((id)=>this.person(id)).filter((person)=>Boolean(person && person.status === "同族"));
            if (candidates.length > 0) return candidates;
        }
        const adults = this.adults();
        return adults.length > 0 ? adults : this.alivePeople();
    }
    performAction(request) {
        if (![
            "action",
            "secondAction"
        ].includes(this.state.phase)) {
            return {
                ok: false,
                message: "当前不在行动步骤。"
            };
        }
        const definition = ACTION_DEFINITIONS.find((entry)=>entry.id === request.actionId);
        if (!definition) return {
            ok: false,
            message: "未知行动。"
        };
        const reason = this.actionReason(request.actionId);
        if (reason) return {
            ok: false,
            message: reason
        };
        if (request.actionId.startsWith("train:")) {
            return this.performTraining(request.actionId.split(":")[1]);
        }
        const candidates = this.actorCandidatesForAction(request.actionId);
        const actor = request.actorId ? this.person(request.actorId) : this.pick(candidates, `${definition.label}随机执行者`);
        if (!actor) return {
            ok: false,
            message: "请选择一名在世执行者。"
        };
        let treatmentTarget = null;
        if (request.actionId === "care-treat") {
            const targetId = request.targetId ?? this.treatablePeople()[0]?.id ?? null;
            treatmentTarget = this.person(targetId);
            if (!treatmentTarget || !this.treatablePeople().some((person)=>person.id === treatmentTarget.id)) {
                return {
                    ok: false,
                    message: "请选择一名健康不满或有伤势的被治疗者。"
                };
            }
        }
        const ledger = {};
        if (request.actionId === "shelter") this.addActionResource(ledger, "cost", "material", -1);
        if (request.actionId === "weave") {
            const cost = this.state.season.event?.modifiers.weaveDiscount ? 0 : 1;
            if (cost) this.addActionResource(ledger, "cost", "material", -cost);
        }
        if (request.actionId === "storage") this.addActionResource(ledger, "cost", "food", -2);
        if ([
            "care-community",
            "care-treat"
        ].includes(request.actionId)) {
            this.addActionResource(ledger, "cost", "food", -1);
        }
        if (request.actionId === "contact") {
            if (this.state.resources.material >= 1) this.addActionResource(ledger, "cost", "material", -1);
            else this.addActionResource(ledger, "cost", "food", -1);
        }
        if (request.actionId === "craft") {
            this.addActionResource(ledger, "cost", "fuel", -1);
            this.addActionResource(ledger, "cost", "material", -1);
        }
        const knowledgeKey = request.knowledgeKey && this.availableKnowledgeForAction(request.actionId).includes(request.knowledgeKey) ? request.knowledgeKey : null;
        const mods = [];
        if (knowledgeKey && this.fullKnowledge(knowledgeKey)) mods.push(1);
        if (this.locationMatch(definition.baseId)) mods.push(1);
        if ([
            "wetland",
            "fish",
            "craft"
        ].includes(definition.baseId) && this.season === "winter") {
            mods.push(-1);
        }
        if (definition.baseId === "hunt" && this.season === "spring") mods.push(-1);
        if (definition.baseId === "harvest" && this.season !== "autumn") mods.push(-1);
        if (definition.baseId === "storage") mods.push(this.season === "autumn" ? 1 : -1);
        if (definition.baseId === "hunt" && this.state.resources.dog > 0) mods.push(1);
        if (definition.baseId === "contact") {
            mods.push(this.translatorModifier());
            if (this.state.currentTrend === "邻族压力") mods.push(1);
        }
        if (actor.heavyInjury) mods.push(-2);
        else if (actor.lightInjury) mods.push(-1);
        const roll = this.roll(6, `${definition.label}行动`);
        const total = roll.value + this.cappedMods(mods).reduce((sum, value)=>sum + value, 0);
        const result = total <= 2 ? "受阻" : total <= 4 ? "部分成功" : "成功";
        if (roll.value === 1) this.addActionResource(ledger, "natural1", "cohesion", -1);
        const texts = [];
        let openContactAlliance = false;
        const multiplierBonus = this.state.season.event?.modifiers;
        if (request.actionId === "fish") {
            if (result === "受阻") {
                this.addActionResource(ledger, "base", "food", 1);
                this.addActionResource(ledger, "base", "material", -1);
                texts.push("捕鱼受阻。");
            } else if (result === "部分成功") {
                this.addActionResource(ledger, "base", "food", 1);
                texts.push("捕鱼部分成功。");
            } else {
                this.addActionResource(ledger, "base", "food", 2);
                if (knowledgeKey === "water" && this.fullKnowledge("water")) {
                    this.addActionResource(ledger, "base", "food", 1);
                }
                texts.push("捕鱼成功。");
            }
            if (multiplierBonus?.fishingBonus) {
                this.addActionResource(ledger, "event", "food", multiplierBonus.fishingBonus);
            }
            if (multiplierBonus?.birdFishingBonus) {
                this.addActionResource(ledger, "event", "food", 1);
                this.addActionResource(ledger, "event", "material", 1);
            }
            if (this.state.currentTrend === "湿地扩张" && this.state.camp === "芦苇湖沼") {
                this.addActionResource(ledger, "trend", "food", 1);
            }
            if (roll.value === 6) this.addActionResource(ledger, "natural6", "food", 1);
            if (this.state.camp === "河口浅滩" && result === "成功") {
                this.state.counters.estuaryLivelihoodSuccesses += 1;
            }
        } else if (request.actionId === "wetland") {
            if (result === "受阻") {
                this.addActionResource(ledger, "base", "material", 1);
                this.hurt(actor, 1, "湿地采集");
                texts.push("湿地采集受阻，执行者健康 -1。");
            } else if (result === "部分成功") {
                this.addActionResource(ledger, "base", "food", 1);
                this.addActionResource(ledger, "base", "material", 1);
                texts.push("湿地采集部分成功。");
            } else {
                this.addActionResource(ledger, "base", "food", 2);
                this.addActionResource(ledger, "base", "material", 1);
                texts.push("湿地采集成功。");
            }
            if (multiplierBonus?.wetlandBonus) {
                this.addActionResource(ledger, "event", "food", multiplierBonus.wetlandBonus);
            }
            if (multiplierBonus?.wetlandMaterialBonus) {
                this.addActionResource(ledger, "event", "material", multiplierBonus.wetlandMaterialBonus);
            }
            if (this.state.currentTrend === "湿地扩张" && this.state.camp === "芦苇湖沼") {
                this.addActionResource(ledger, "trend", "food", 1);
            }
            if (roll.value === 6) this.addActionResource(ledger, "natural6", "food", 1);
            if (this.state.camp === "河口浅滩" && result === "成功") {
                this.state.counters.estuaryLivelihoodSuccesses += 1;
            }
        } else if (request.actionId === "hunt") {
            if (result === "受阻") {
                this.addActionResource(ledger, "base", "food", 1);
                this.hurt(actor, 1, "狩猎");
                actor.lightInjury = true;
                texts.push("狩猎受阻，执行者健康 -1并轻伤。");
            } else if (result === "部分成功") {
                this.addActionResource(ledger, "base", "food", 1);
                texts.push("狩猎部分成功。");
            } else {
                this.addActionResource(ledger, "base", "food", 2);
                this.addActionResource(ledger, "base", "material", 1);
                this.addActionResource(ledger, "base", "storage", 1);
                texts.push("狩猎成功。");
            }
            if (multiplierBonus?.huntBonus) {
                this.addActionResource(ledger, "event", "food", multiplierBonus.huntBonus);
            }
            if (roll.value === 6) this.addActionResource(ledger, "natural6", "food", 1);
            if (this.state.season.event?.name === "野猪拱橡林" && result !== "成功") {
                this.hurt(actor, 1, "捕猎野猪");
                actor.lightInjury = true;
            }
        } else if (request.actionId === "harvest") {
            if (result === "受阻") {
                this.addActionResource(ledger, "base", "food", 1);
                if (this.state.resources.cohesion > 1) {
                    this.addActionResource(ledger, "base", "cohesion", -1);
                    texts.push("收获受阻，凝聚力下降。");
                } else {
                    this.hurt(actor, 1, "收获受阻");
                    texts.push("收获受阻，执行者健康 -1。");
                }
            } else if (result === "部分成功") {
                this.addActionResource(ledger, "base", "food", this.season === "autumn" ? 2 : 1);
                this.addActionResource(ledger, "base", "storage", 1);
                texts.push("收获部分成功。");
            } else {
                this.addActionResource(ledger, "base", "food", this.season === "autumn" ? 3 : 2);
                this.addActionResource(ledger, "base", "material", 1);
                this.addActionResource(ledger, "base", "storage", 1);
                texts.push("收获成功。");
            }
            if (multiplierBonus?.harvestBonus) {
                this.addActionResource(ledger, "event", "food", multiplierBonus.harvestBonus);
            }
            if (roll.value === 6) this.addActionResource(ledger, "natural6", "food", 1);
        } else if (request.actionId === "rice") {
            if (result === "受阻") {
                this.addActionResource(ledger, "base", "food", 1);
                texts.push("野生稻管理受阻。");
            } else if (result === "部分成功") {
                this.addActionResource(ledger, "base", "food", 1);
                this.state.counters.wildRiceProgress += 1;
                texts.push("野生稻管理部分成功，湿地管理进度 +1。");
            } else {
                this.addActionResource(ledger, "base", "food", 2);
                this.addActionResource(ledger, "base", "material", 1);
                this.state.counters.wildRiceProgress += 1;
                texts.push("野生稻管理成功，湿地管理进度 +1。");
            }
            if (multiplierBonus?.wildRiceBonus) {
                this.addActionResource(ledger, "event", "food", multiplierBonus.wildRiceBonus);
            }
            if (multiplierBonus?.wildRiceProgressBonus) {
                this.state.counters.wildRiceProgress += multiplierBonus.wildRiceProgressBonus;
            }
            if (roll.value === 6) this.addActionResource(ledger, "natural6", "food", 1);
        } else if (request.actionId === "shelter") {
            if (result === "受阻") {
                this.hurt(actor, 1, "修屋");
                texts.push("材料已经消耗，执行者健康 -1。");
            } else {
                this.addActionResource(ledger, "base", "shelter", 1);
                if (result === "成功") {
                    this.state.shelterBonusDisabled = false;
                    this.addActionResource(ledger, "base", "cohesion", 1);
                }
                texts.push(result === "成功" ? "住所修复成功，凝聚力恢复。" : "住所修复部分成功。");
            }
            if (roll.value === 6) this.addActionResource(ledger, "natural6", "shelter", 1);
        } else if (request.actionId === "weave") {
            if (result === "受阻") {
                this.hurt(actor, 1, "编织失败");
                texts.push("材料已经消耗，执行者健康 -1。");
            } else {
                this.addActionResource(ledger, "base", "clothes", 1);
                if (result === "成功") {
                    this.addActionResource(ledger, "base", "care", 1);
                    this.state.counters.craftProgress += 1;
                    texts.push("编织成功，制作进度 +1。");
                } else {
                    texts.push("编织部分成功。");
                }
            }
            if (roll.value === 6) this.addActionResource(ledger, "natural6", "clothes", 1);
        } else if (request.actionId === "storage") {
            if (result === "受阻") {
                this.addActionResource(ledger, "base", "food", -1);
                texts.push("储藏受阻。");
            } else {
                this.addActionResource(ledger, "base", "storage", 1);
                if (result === "部分成功") {
                    this.addActionResource(ledger, "base", "food", -1);
                    texts.push("储藏部分成功。");
                } else {
                    texts.push("储藏成功。");
                }
            }
            if (roll.value === 6) this.addActionResource(ledger, "natural6", "storage", 1);
        } else if (request.actionId === "care-community") {
            if (result === "受阻") {
                this.addActionResource(ledger, "base", "cohesion", -1);
                texts.push("照顾受阻。");
            } else {
                this.addActionResource(ledger, "base", "care", 1);
                if (result === "成功") this.addActionResource(ledger, "base", "cohesion", 1);
                texts.push(result === "成功" ? "照顾成功，凝聚力提高。" : "照顾部分成功。");
            }
            if (roll.value === 6) this.addActionResource(ledger, "natural6", "care", 1);
            this.state.season.currentCared = true;
        } else if (request.actionId === "care-treat") {
            const target = treatmentTarget;
            if (result === "成功") {
                if (target.infection) target.infection = false;
                if (target.heavyInjury) {
                    target.heavyInjury = false;
                    target.lightInjury = true;
                } else if (target.lightInjury) {
                    target.lightInjury = false;
                }
                if (target.health < MAX_HEALTH) target.health += 1;
                texts.push(`治疗成功，${target.name}的伤势改善。`);
            } else if (result === "部分成功") {
                texts.push(`${target.name}的伤势没有恶化。`);
            } else {
                texts.push(`${target.name}的治疗没有进展。`);
            }
            this.state.season.currentCared = true;
        } else if (request.actionId === "contact") {
            if (result === "受阻") {
                this.addActionResource(ledger, "base", "cohesion", -1);
                texts.push("接触受阻。");
            } else if (result === "部分成功") {
                texts.push("接触部分成功，只完成了初步试探。");
            } else {
                this.addActionResource(ledger, "base", "network", 1);
                this.addActionResource(ledger, "base", "material", 1);
                this.markCrossgroupSuccess();
                texts.push("接触成功，并记录跨群体成功往来。");
                if (this.state.resources.network >= 3 && !this.state.allianceCompletedThisGeneration) {
                    openContactAlliance = true;
                    texts.push("网络已满，可以提出联盟。");
                }
            }
            if (roll.value === 6) this.addActionResource(ledger, "natural6", "material", 1);
        } else if (request.actionId === "craft") {
            if (result === "受阻") {
                this.hurt(actor, 1, "制作失败");
                texts.push("燃料和材料已经消耗，执行者健康 -1。");
            } else {
                if (result === "成功" || [
                    "河湾营地",
                    "芦苇湖沼"
                ].includes(this.state.camp)) {
                    this.state.counters.craftProgress += 1;
                }
                if (result === "成功") this.addActionResource(ledger, "base", "cohesion", 1);
                texts.push(result === "成功" ? "制作成功，制作进度 +1，凝聚力提高。" : "制作部分成功，制作进度 +1。");
            }
            if (roll.value === 6) this.addActionResource(ledger, "natural6", "material", 1);
        } else if (request.actionId === "fuel") {
            if (result === "受阻") {
                this.hurt(actor, 1, "整备火塘");
                texts.push("没有获得燃料，执行者健康 -1。");
            } else {
                this.addActionResource(ledger, "base", "fuel", result === "成功" ? 2 : 1);
                texts.push(result === "成功" ? "整备火塘成功。" : "整备火塘部分成功。");
            }
            if (roll.value === 6) this.addActionResource(ledger, "natural6", "fuel", 1);
        } else if (request.actionId === "dog") {
            if (result === "成功") {
                this.addActionResource(ledger, "base", "dog", 1);
                texts.push("获得 1 只看家狗。");
            } else {
                texts.push("本次没有获得看家狗。");
            }
        }
        const relatedKeys = definition.baseId === "craft" ? [
            "fire",
            "water"
        ] : this.actionKnowledgeKeys(request.actionId);
        const learning = this.learnFromRelatedAction(relatedKeys, actor, definition.label);
        if (learning) texts.push(learning);
        const resourceSummary = this.netResourceSummary(ledger);
        if (resourceSummary) texts.push(resourceSummary);
        const record = {
            actionId: request.actionId,
            actionLabel: definition.label,
            actorId: actor.id,
            targetId: treatmentTarget?.id ?? null,
            knowledgeKey,
            roll: roll.value,
            total,
            result,
            text: texts.join(" ")
        };
        this.state.season.actions.push(request.actionId);
        this.state.season.actionRecords.push(record);
        this.log("action", `${definition.label} · ${result}`, `${actor.name}执行${treatmentTarget ? `，治疗${treatmentTarget.name}` : ""}。${texts.join(" ")}`);
        this.state.lastMessage = `${definition.label}${result}。${texts.join(" ")}`;
        if (this.state.phase === "ended") return {
            ok: true,
            message: this.state.lastMessage
        };
        if (openContactAlliance) {
            const resumePhase = this.state.phase === "secondAction" ? "secondAction" : "action";
            this.openContactAllianceDecision(resumePhase);
            return {
                ok: true,
                message: this.state.lastMessage,
                rolls: [
                    roll
                ]
            };
        }
        if (this.season === "autumn" && this.state.phase === "action") {
            this.setPhase("secondAction");
        } else {
            this.finishActionPhase();
        }
        return {
            ok: true,
            message: this.state.lastMessage,
            rolls: [
                roll
            ]
        };
    }
    performTraining(key) {
        const card = this.knowledge(key);
        const holder = this.holder(key);
        const heirs = card.heirIds.map((id, index)=>({
                id,
                index
            })).filter((entry)=>entry.id !== null && this.person(entry.id) !== null);
        if (!holder || card.lost || heirs.length === 0) {
            return {
                ok: false,
                message: "训练条件不成立。"
            };
        }
        const parts = heirs.map((entry)=>{
            card.heirLevels[entry.index] = Math.min(3, card.heirLevels[entry.index] + 1);
            return `${this.peopleName(entry.id)} ${card.heirLevels[entry.index]}`;
        });
        const actionId = `train:${key}`;
        this.state.season.actions.push(actionId);
        this.state.season.actionRecords.push({
            actionId,
            actionLabel: `训练 · ${KNOWLEDGE_NAMES[key]}`,
            actorId: holder.id,
            knowledgeKey: key,
            roll: null,
            total: null,
            result: "不掷骰",
            text: parts.join("；")
        });
        this.log("action", `训练 ${KNOWLEDGE_NAMES[key]}`, `${holder.name}指导传承人：${parts.join("；")}。`);
        this.state.lastMessage = `训练完成：${parts.join("；")}。`;
        if (this.season === "autumn" && this.state.phase === "action") this.setPhase("secondAction");
        else this.finishActionPhase();
        return {
            ok: true,
            message: this.state.lastMessage
        };
    }
    skipSecondAction() {
        if (this.state.phase !== "secondAction") return {
            ok: false,
            message: "当前不是秋季第二行动步骤。"
        };
        this.finishActionPhase();
        return {
            ok: true,
            message: this.state.lastMessage
        };
    }
    finishActionPhase() {
        this.finalizeEventUsage();
        if (this.season === "autumn" && !this.state.season.allianceWindowChecked) {
            this.state.season.allianceWindowChecked = true;
            if (this.canOpenAllianceWindow()) {
                this.openAutumnAllianceDecision();
                return;
            }
        }
        this.triggerUnexpected();
    }
    finalizeEventUsage() {
        const event = this.state.season.event;
        if (!event || this.state.season.eventUsageFinalized) return;
        this.state.season.eventUsageFinalized = true;
        const actions = new Set(this.state.season.actionRecords.map((record)=>record.actionId));
        const used = [];
        const unused = [];
        const check = (active, actionIds, label)=>{
            if (!active) return;
            if (actionIds.some((id)=>actions.has(id))) used.push(label);
            else unused.push(label);
        };
        check(event.modifiers.fishingBonus !== 0, [
            "fish"
        ], "捕鱼加成");
        check(event.modifiers.wetlandBonus !== 0 || event.modifiers.wetlandMaterialBonus !== 0, [
            "wetland"
        ], "湿地采集加成");
        check(event.modifiers.wildRiceBonus !== 0 || event.modifiers.wildRiceProgressBonus !== 0, [
            "rice"
        ], "野生稻加成");
        check(event.modifiers.weaveDiscount, [
            "weave"
        ], "编织省材料");
        check(event.modifiers.huntBonus !== 0, [
            "hunt"
        ], "狩猎加成");
        check(event.modifiers.harvestBonus !== 0, [
            "harvest"
        ], "收获加成");
        if (event.modifiers.birdFishingBonus) {
            if (actions.has("fish")) {
                used.push("水鸟繁殖的捕鱼加成");
            } else {
                const delta = this.addResource("material", 1);
                used.push(`未捕鱼，改得材料 ${delta > 0 ? "+" : ""}${formatNumber(delta)}`);
            }
        }
        if (event.modifiers.freeOakMigration) {
            if (event.baseline && event.baseline.camp !== "橡树林坡" && this.state.camp === "橡树林坡") {
                used.push("迁往橡林免食物");
            } else {
                unused.push("迁往橡林免食物");
            }
        }
        const hasDeferredEffect = Object.values(event.modifiers).some((value)=>value !== 0 && value !== false);
        if (!hasDeferredEffect) {
            event.resultText = event.baseResultText || event.resultText;
        } else {
            const pieces = [];
            if (used.length > 0) pieces.push(`已利用：${used.join("、")}`);
            if (unused.length > 0) pieces.push(`未利用：${unused.join("、")}`);
            if (pieces.length === 0) pieces.push("本季没有执行可受该事件加成的行动");
            const base = event.baseResultText === "事件效果已生效，将在本季行动中结算" ? "" : event.baseResultText;
            event.resultText = [
                base,
                `行动完成后：${pieces.join("；")}`
            ].filter(Boolean).join("；");
        }
        if (event.logId !== null) {
            const log = this.state.logs.find((entry)=>entry.id === event.logId);
            if (log) log.text = event.resultText;
        }
    }
    canOpenAllianceWindow() {
        return Boolean(this.state.resources.network === 3 && this.state.generation >= 3 && this.state.resources.cohesion >= 3 && this.person(this.state.translatorId) && (this.state.season.currentCrossgroupSuccess || this.state.history.crossgroup.at(-1)) && (this.state.resources.food >= 3 || this.state.resources.material >= 2) && !this.state.allianceCompletedThisGeneration);
    }
    openAllianceOptions(prefix) {
        const options = [];
        for (const mode of [
            "in",
            "out",
            "both"
        ]){
            const base = mode === "in" ? "人员迁入" : mode === "out" ? "人员迁出" : "双边居";
            const modeName = mode === "in" ? "人员迁入" : mode === "out" ? "人员迁出" : "双边居";
            if (prefix === "contact-alliance") {
                options.push(this.option(`contact-alliance-${mode}`, modeName, "成功接触已满足提议条件；选择后直接完成联盟。"));
            } else {
                options.push(this.option(`propose-${mode}-food`, `提出${base}，付食物`, "测试网络与凝聚；5+ 完成联盟。", this.state.resources.food < 1, "食物不足"), this.option(`propose-${mode}-material`, `提出${base}，付材料`, "测试网络与凝聚；5+ 完成联盟。", this.state.resources.material < 1, "材料不足"));
            }
        }
        return options;
    }
    openAutumnAllianceDecision() {
        const options = this.openAllianceOptions("propose");
        options.push(this.option("exchange-food", "只做交换，付食物", "换得材料 1，并记录成功往来。", this.state.resources.food < 1, "食物不足"), this.option("exchange-material", "只做交换，付材料", "换得食物 1，并记录成功往来。", this.state.resources.material < 1, "材料不足"), this.option("skip", "暂不结盟", "不支付资源，也不扣凝聚。"));
        this.decision("alliance", "秋季结盟窗口", "网络已满，对方愿意听取提议。窗口出现本身不算联盟。", options, {
            source: "autumn",
            resumePhase: "unexpected"
        });
        this.setPhase("allianceDecision");
    }
    openContactAllianceDecision(resumePhase) {
        const options = this.openAllianceOptions("contact-alliance");
        options.push(this.option("skip", "暂不结盟", "保留已经取得的网络与物资，不建立实际联盟。"));
        this.decision("alliance", "接触邻族后的联盟提议", "成功接触且网络已满，可以提出人员迁入、人员迁出或双边居。", options, {
            source: "contact",
            resumePhase
        });
        this.setPhase("allianceDecision");
    }
    triggerUnexpected() {
        const unexpected = this.state.pendingUnexpected;
        if (!unexpected || unexpected.triggerTurn !== this.state.turn) {
            this.setPhase("seasonEnd");
            this.state.lastMessage = "本季全部行动已经完成，可以结束季节。";
            return;
        }
        if (unexpected.card === 1 && !HILL_CAMPS.includes(this.state.camp)) {
            this.state.season.unexpected = null;
            this.state.season.unexpectedRecorded = true;
            this.clearDecision();
            this.setPhase("seasonEnd");
            this.state.lastMessage = "猎人受伤只会在高丘或橡林狩猎时触发；本季未发生。";
            return;
        }
        this.state.season.unexpected = {
            card: unexpected.card,
            name: unexpected.name,
            text: UNEXPECTED_TEXT[unexpected.card - 1],
            resultText: "",
            triggered: true,
            baseline: this.snapshotProgress()
        };
        this.resolveUnexpected(unexpected.card);
    }
    recordUnexpected(resultText = "") {
        if (this.state.season.unexpected) {
            const unexpected = this.state.season.unexpected;
            const diff = unexpected.baseline ? this.progressSummary(unexpected.baseline) : "意外卡已结算";
            unexpected.resultText = resultText ? `${resultText}${diff === "没有资源、健康或知识变化" ? "" : `；${diff}`}` : diff;
            this.log("unexpected", `本季意外：${unexpected.name}`, unexpected.resultText);
        }
        this.state.season.unexpectedRecorded = true;
        this.clearDecision();
        if (this.state.phase !== "ended") {
            this.setPhase("seasonEnd");
            this.state.lastMessage = "意外卡已结算，可以结束季节。";
        }
    }
    resolveUnexpected(card) {
        if (card === 1) {
            if (!HILL_CAMPS.includes(this.state.camp)) {
                this.recordUnexpected("当前不在高丘或橡林，本次猎人受伤没有触发。");
                return;
            }
            const hunter = this.randomPerson("成人", "猎人受伤随机猎人");
            if (!hunter) {
                this.recordUnexpected();
                return;
            }
            if (this.state.resources.care >= 2) {
                this.decision("unexpected", "猎人受伤", `${hunter.name}在狩猎中受伤。良好照护可以改为损失食物。`, [
                    this.option("pay-food", "用照护替代", "失去食物 1，不让猎人受伤。"),
                    this.option("injure", "让猎人承担", `${hunter.name}健康 -1并轻伤。`)
                ], {
                    card,
                    hunterId: hunter.id
                });
                this.setPhase("unexpectedDecision");
            } else {
                this.hurt(hunter, 1, "猎人受伤");
                hunter.lightInjury = true;
                this.recordUnexpected();
            }
            return;
        }
        if (card === 2) {
            if (this.state.resources.dog <= 0 && this.state.resources.network >= 2) {
                this.addResource("material", -1);
            } else if (this.state.resources.dog <= 0) {
                this.damageResource("food", 1, "野猪闯营地");
            }
            this.decision("unexpected", "野猪闯营地", "物资损失已经处理。请选择营地接下来如何应对；只有完成具体轮守与修补，凝聚力才不下降。", [
                this.option("calm", "安排轮守并修补围栏", "清点损失、修复围栏并安排整夜轮守；凝聚力不下降。"),
                this.option("accept", "不额外安抚", "凝聚 -1。")
            ], {
                card
            });
            this.setPhase("unexpectedDecision");
            return;
        }
        if (card === 3) {
            if (this.fullKnowledge("fire")) this.addResource("fuel", -1);
            else {
                this.addResource("shelter", -1);
                this.damageResource("food", 1, "营地失火");
            }
            this.state.shelterBonusDisabled = true;
            this.recordUnexpected();
            return;
        }
        if (card === 4) {
            if (!WATER_CAMPS.includes(this.state.camp)) {
                this.recordUnexpected("当前不在水网营地，本次意外没有触发");
                return;
            }
            if (this.fullKnowledge("water")) {
                this.addResource("material", -1);
                const learning = this.learnFromEvent("water", "独木舟翻覆");
                this.recordUnexpected(learning ?? "");
                return;
            }
            this.decision("unexpected", "独木舟翻覆", "选择失去食物或材料，并有一人健康 -1。", [
                this.option("lose-food", "失去食物 1", "仍有一人健康 -1。"),
                this.option("lose-material", "失去材料 1", "仍有一人健康 -1。", this.state.resources.material < 1, "材料不足")
            ], {
                card
            });
            this.setPhase("unexpectedDecision");
            return;
        }
        if (card === 5) {
            const elder = this.randomPerson("长者", "老人跌倒随机长者");
            if (elder) {
                this.hurt(elder, 1, "老人跌倒");
                elder.lightInjury = true;
                if (elder.frail) elder.heavyInjury = true;
            }
            this.recordUnexpected();
            return;
        }
        if (card === 6) {
            if (!this.person(this.state.caregiverId)) this.state.season.currentCareGap = true;
            const child = this.randomPerson("儿童", "孩子走失随机儿童");
            if (child) {
                let result = this.test([
                    this.translatorModifier(),
                    this.caregiverModifier()
                ], "孩子走失");
                if (result.result === "不利" && this.hasChildCareContinuity() && !this.state.season.childProtectionUsed) {
                    this.state.season.childProtectionUsed = true;
                    result = this.test([
                        this.translatorModifier(),
                        this.caregiverModifier()
                    ], "孩子走失重掷");
                }
                if (result.result === "不利") {
                    this.kill(child.id, "孩子走失");
                    this.damageResource("food", 1, "孩子走失");
                    this.addResource("cohesion", -1);
                } else if (result.result === "部分") {
                    this.damageResource("food", 1, "孩子走失");
                } else {
                    this.addResource("care", 1);
                    this.addResource("cohesion", 1);
                }
            } else {
                const adult = this.randomPerson("成人", "无儿童时走失替代");
                if (adult) this.hurt(adult, 1, "孩子走失替代");
            }
            const learning = child ? this.learnFromEvent("story", "孩子走失") : null;
            this.recordUnexpected(learning ?? "");
            return;
        }
        if (card === 7) {
            const victim = this.randomPerson(null, "蛇咬随机人物");
            if (victim) {
                this.markWeak(victim);
                this.hurt(victim, 1, "蛇咬与感染", true);
                if (this.fullKnowledge("care")) {
                    victim.infection = false;
                    victim.lightInjury = true;
                }
                if (this.state.resources.shelter === 0 || this.state.resources.clothes === 0) {
                    this.hurt(victim, 1, "蛇咬后缺住所衣物");
                }
            }
            const learning = victim ? this.learnFromEvent("care", "蛇咬与感染") : null;
            this.recordUnexpected(learning ?? "");
            return;
        }
        if (card === 8) {
            if (this.state.resources.dog > 0) {
                this.recordUnexpected("看家狗赶走了前来翻找储藏的动物，因此没有损失。");
                return;
            }
            if (this.effectiveShelter() >= 2 && this.state.resources.food >= 1) {
                this.decision("unexpected", "储藏被动物翻找", "较好住所能让你选择损失食物，保住储藏。", [
                    this.option("lose-storage", "失去储藏 1", "无储藏时失食物 1。"),
                    this.option("lose-food", "改为失去食物 1", "保住储藏。")
                ], {
                    card
                });
                this.setPhase("unexpectedDecision");
            } else if (this.state.resources.storage > 0) {
                this.addResource("storage", -1);
                this.recordUnexpected();
            } else {
                this.damageResource("food", 1, "储藏被动物翻找");
                this.recordUnexpected();
            }
        }
    }
    resolveUnexpectedChoice(optionId) {
        const pending = this.state.pendingDecision;
        const card = Number(pending?.context?.card ?? this.state.season.unexpected?.card ?? 0);
        let message = "";
        if (card === 1) {
            const hunter = this.person(Number(pending?.context?.hunterId));
            if (optionId === "pay-food") {
                this.addResource("food", -1);
                message = "照护替代受伤";
            } else if (hunter) {
                this.hurt(hunter, 1, "猎人受伤");
                hunter.lightInjury = true;
                message = `${hunter.name}承担受伤后果`;
            }
        } else if (card === 2) {
            if (optionId === "accept") {
                this.addResource("cohesion", -1);
                message = "未进行额外安抚";
            } else {
                message = "安排轮守并修补围栏，凝聚力不下降";
            }
        } else if (card === 4) {
            if (optionId === "lose-food") this.addResource("food", -1);
            else this.addResource("material", -1);
            const victim = this.randomPerson(null, "独木舟翻覆随机人物");
            if (victim) this.hurt(victim, 1, "独木舟翻覆");
            message = "选定独木舟损失类型";
        } else if (card === 8) {
            if (optionId === "lose-food") this.addResource("food", -1);
            else if (this.state.resources.storage > 0) this.addResource("storage", -1);
            else this.addResource("food", -1);
            message = "选定储藏损失类型";
        }
        const learning = card === 4 ? this.learnFromEvent("water", "独木舟翻覆") : null;
        this.recordUnexpected([
            message,
            learning
        ].filter(Boolean).join("；"));
        return {
            ok: true,
            message
        };
    }
    resolveAllianceChoice(optionId) {
        const pending = this.state.pendingDecision;
        const source = String(pending?.context?.source ?? "autumn");
        const resumePhase = String(pending?.context?.resumePhase ?? "unexpected");
        if (optionId === "skip") {
            this.clearDecision();
            this.resumeAfterAlliance(source, resumePhase);
            return {
                ok: true,
                message: "暂不结盟。"
            };
        }
        const beforeChoice = this.snapshotProgress();
        const isContactAlliance = optionId.startsWith("contact-alliance-");
        let paid = "";
        if (!isContactAlliance && optionId.endsWith("-food")) {
            if (this.state.resources.food < 1) return {
                ok: false,
                message: "食物不足。"
            };
            this.addResource("food", -1);
            paid = "食物";
        } else if (!isContactAlliance && optionId.endsWith("-material")) {
            if (this.state.resources.material < 1) return {
                ok: false,
                message: "材料不足。"
            };
            this.addResource("material", -1);
            paid = "材料";
        }
        let message = "";
        if (optionId.startsWith("exchange-")) {
            if (optionId === "exchange-food") this.addResource("material", 1);
            else this.addResource("food", 1);
            this.markCrossgroupSuccess();
            message = `支付${paid}完成交换，并记录跨群体成功往来。`;
        } else if (isContactAlliance) {
            const mode = optionId.includes("-in") ? "in" : optionId.includes("-out") ? "out" : "both";
            this.completeAlliance(mode, "接触邻族后的联盟提议");
            message = "联盟完成，人员与知识流动已经结算。";
        } else {
            const mode = optionId.includes("-in-") ? "in" : optionId.includes("-out-") ? "out" : "both";
            const extra = this.state.currentTrend === "邻族压力" ? 1 : 0;
            const result = this.test([
                this.translatorModifier(),
                this.state.resources.cohesion >= 4 ? 1 : 0,
                extra
            ], "秋季结盟提议");
            if (result.result === "不利") {
                this.addResource("cohesion", -1);
                message = "结盟失败，凝聚力 -1。";
            } else if (result.result === "部分") {
                const resource = paid === "食物" ? "material" : "food";
                this.addResource(resource, 1);
                this.markCrossgroupSuccess();
                message = "只完成交换，没有建立联盟；记录一次成功往来。";
            } else {
                this.completeAlliance(mode, "秋季结盟窗口");
                message = "联盟完成，人员与知识流动已经结算。";
            }
        }
        const changes = this.progressSummary(beforeChoice);
        message = `${message.replace(/。$/, "")}；实际变化：${changes}${changes.endsWith("。") ? "" : "。"}`;
        this.clearDecision();
        this.log("system", source === "contact" ? "接触邻族后的联盟提议" : "秋季结盟窗口", message);
        this.resumeAfterAlliance(source, resumePhase);
        return {
            ok: true,
            message
        };
    }
    resumeAfterAlliance(source, resumePhase) {
        if (source === "contact") {
            if (resumePhase === "action" && this.season === "autumn") {
                this.setPhase("secondAction");
                this.state.lastMessage = "联盟提议已经处理，秋收还可以执行第二张行动卡。";
            } else {
                this.finishActionPhase();
            }
            return;
        }
        this.triggerUnexpected();
    }
    completeAlliance(mode, reason) {
        this.state.allianceCompletedThisGeneration = true;
        this.state.counters.actualAlliances += 1;
        this.markCrossgroupSuccess();
        if (mode === "in" || mode === "both") {
            const newcomer = this.addNewcomer(15, reason);
            this.state.allianceNewcomerIds.push(newcomer.id);
        }
        if (mode === "out" || mode === "both") {
            const candidates = this.adults().filter((person)=>person.id !== this.state.caregiverId && person.id !== this.state.translatorId);
            const outgoing = this.pick(candidates, `${reason}迁出者`);
            if (outgoing) {
                outgoing.status = "已迁出";
                if (outgoing.spouseId !== null) {
                    const spouse = this.person(outgoing.spouseId);
                    if (spouse) {
                        spouse.spouseId = null;
                        spouse.lastPartnerEndGeneration = this.state.generation;
                    }
                    outgoing.spouseId = null;
                }
                this.addResource("material", 1);
                this.processKnowledgeOnDeath(outgoing.id);
                this.repairKnowledgeSlots();
            }
        }
        if (mode === "both") this.state.allianceIntegrated = true;
        this.reinforceWeakestKnowledge(reason);
    }
    integrateNewcomers() {
        for (const person of this.state.people){
            if (person.status === "尚未同族" && person.tribeFromTurn !== null && this.state.turn >= person.tribeFromTurn) {
                person.status = "同族";
                person.tribeFromTurn = null;
                if (this.state.allianceNewcomerIds.includes(person.id)) {
                    this.state.allianceIntegrated = true;
                }
                this.log("migration", "人员入族", `${person.name}完成两个完整季节，开始视为同族。`);
            }
        }
        this.repairKnowledgeSlots();
    }
    finishSeason() {
        if (this.state.phase !== "seasonEnd") {
            return {
                ok: false,
                message: "请先完成本季事件和行动。"
            };
        }
        const beforeChildren = new Set(this.state.people.filter((person)=>person.age < 10 && [
                "同族",
                "尚未同族"
            ].includes(person.status)).map((person)=>person.id));
        for (const person of this.alivePeople()){
            person.age = roundAge(person.age + 1.25);
            if (person.age >= 10 && person.deathAge === null) {
                const life = this.roll(6, `${person.name}寿命第一骰`).value + this.roll(6, `${person.name}寿命第二骰`).value;
                const table = {
                    2: 8,
                    3: 8,
                    4: 9,
                    5: 12,
                    6: 12,
                    7: 17,
                    8: 22,
                    9: 22,
                    10: 32,
                    11: 35,
                    12: 45
                };
                person.deathAge = 10 + table[life];
            }
            if (beforeChildren.has(person.id) && person.age >= 10) {
                this.state.counters.childrenReachedTen += 1;
            }
        }
        for (const person of this.alivePeople().slice()){
            if (person.deathAge !== null && person.age >= person.deathAge) {
                this.kill(person.id, `达到隐藏死亡年龄 ${person.deathAge}`);
            } else if (person.deathAge !== null && person.deathAge - person.age < 5) {
                person.frail = true;
            }
        }
        for (const person of this.alivePeople().slice()){
            if (person.infection) {
                const result = this.test([
                    this.caregiverModifier(),
                    this.fullKnowledge("care") ? 1 : 0
                ], `${person.name}感染结算`);
                if (result.result === "不利") this.kill(person.id, "感染");
                else if (result.result === "部分") this.hurt(person, 1, "感染");
                else person.infection = false;
            }
        }
        if (this.state.phase === "ended") return {
            ok: true,
            message: this.state.ending?.title ?? "游戏结束"
        };
        const frailtyIds = this.alivePeople().filter((person)=>person.age >= 40 && person.frail && !person.frailtyChoiceHandled).map((person)=>person.id);
        if (frailtyIds.length > 0) {
            this.startFrailtyQueue(frailtyIds);
            const current = this.person(frailtyIds[0]);
            return {
                ok: true,
                message: current ? `${current.name}逐渐有些力不从心，恐怕行将就木。` : "有长者逐渐衰弱，请处理照护或提前传承。"
            };
        }
        return this.completeSeasonEndAfterFrailty();
    }
    startFrailtyQueue(ids) {
        const valid = ids.filter((id)=>this.person(id)?.frail);
        if (valid.length === 0) {
            this.completeSeasonEndAfterFrailty();
            return;
        }
        const current = this.person(valid[0]);
        const holderCard = this.state.knowledge.find((card)=>card.holderId === current.id);
        const canTransfer = Boolean(holderCard && holderCard.heirIds.some((id)=>id !== null && this.person(id)));
        this.decision("frailty", `${current.name}逐渐有些力不从心，恐怕行将就木。`, "只能选择一次。集中照护只保护当前这一代。", [
            this.option("care", "集中照护", "支付食物 1；抵挡本代第一次健康损失，并跳过代末衰弱死亡骰。", this.state.resources.food < 1, "食物不足 1"),
            this.option("transfer", "提前传承", holderCard ? "熟练度最高的传承人 +1 并立即接任。" : "仅当前知识持有人可选择。", !canTransfer, "当前不是知识持有人或没有在世传承人"),
            this.option("normal", "维持原样", "不支付资源，继续按衰弱规则结算。")
        ], {
            ids: valid.join(","),
            currentId: current.id
        });
        this.setPhase("frailtyDecision");
    }
    resolveFrailtyChoice(optionId) {
        const pending = this.state.pendingDecision;
        const currentId = Number(pending?.context?.currentId);
        const ids = String(pending?.context?.ids ?? "").split(",").map(Number).filter(Boolean);
        const person = this.person(currentId);
        if (!person) return {
            ok: false,
            message: "该长者已经不在世。"
        };
        person.frailtyChoiceHandled = true;
        if (optionId === "care") {
            this.addResource("food", -1);
            person.frailtyCareGeneration = this.state.generation;
            person.frailtyCareUsed = false;
        } else if (optionId === "transfer") {
            const card = this.state.knowledge.find((entry)=>entry.holderId === person.id);
            if (!card) return {
                ok: false,
                message: "该长者不是知识持有人。"
            };
            const heir = card.heirIds.map((id, index)=>({
                    id,
                    index,
                    level: card.heirLevels[index]
                })).filter((entry)=>entry.id !== null && this.person(entry.id)).sort((a, b)=>{
                if (b.level !== a.level) return b.level - a.level;
                const aPerson = this.person(a.id);
                const bPerson = this.person(b.id);
                if (!aPerson || !bPerson) return a.id - b.id;
                const aAdult = aPerson.age >= 10 ? 1 : 0;
                const bAdult = bPerson.age >= 10 ? 1 : 0;
                return bAdult - aAdult || this.compareHeirLongevity(aPerson, bPerson);
            })[0];
            if (!heir) return {
                ok: false,
                message: "没有可接任的传承人。"
            };
            card.heirLevels[heir.index] = Math.min(3, card.heirLevels[heir.index] + 1);
            card.holderId = heir.id;
            card.level = card.heirLevels[heir.index];
            card.heirIds[heir.index] = null;
            card.heirLevels[heir.index] = 0;
            this.fillKnowledgeHeirs(card);
            this.log("settlement", "提前传承", `${person.name}日渐衰弱，于是把毕生积累的${KNOWLEDGE_NAMES[card.key]}知识叮嘱给${this.peopleName(heir.id)}。`);
        }
        const remaining = ids.slice(1);
        if (remaining.length > 0) {
            this.startFrailtyQueue(remaining);
            return {
                ok: true,
                message: "继续处理下一名衰弱长者。"
            };
        }
        this.clearDecision();
        return this.completeSeasonEndAfterFrailty();
    }
    completeSeasonEndAfterFrailty() {
        for (const person of this.alivePeople().slice()){
            if (person.earlyDeath && person.removeTurn !== null && person.removeTurn <= this.state.turn) {
                const fatherName = this.rosterName(person.fatherId);
                const motherName = this.rosterName(person.motherId);
                const narrative = `${person.name}没能挺过${this.seasonLabel}。${person.name}的父亲${fatherName}和母亲${motherName}抱着小小的${person.name}悲痛欲绝。`;
                this.kill(person.id, "早夭", narrative, "早夭", [
                    person.fatherId,
                    person.motherId
                ]);
            }
        }
        if (this.state.phase === "ended") return {
            ok: true,
            message: this.state.ending?.title ?? "游戏结束"
        };
        const birthResult = this.deliverBirths();
        const moved = this.passiveMigration();
        const conception = this.pairAndConceive(birthResult.motherIds);
        if (this.state.resources.food <= 0 && !this.state.season.famine && !this.state.season.zeroFoodHandled) {
            this.groupHurt(1, "季末食物为0");
            this.addResource("cohesion", -1);
            this.state.season.zeroFoodHandled = true;
        }
        for (const person of this.alivePeople().slice()){
            if (person.health <= 0) this.kill(person.id, "季末健康为0");
        }
        if (this.state.phase === "ended") return {
            ok: true,
            message: this.state.ending?.title ?? "游戏结束"
        };
        if (this.state.resources.cohesion <= 0 && this.population() > 0) {
            this.decision("survival", "凝聚力归零", "可以结束为“分火而行”，或保留一半人口并恢复至 2 凝聚力继续。", [
                this.option("split", "分火而行", "以当前知识状态结束本群故事。"),
                this.option("continue", "继续生活", "随机保留一半人口，凝聚力恢复至 2；不记录结局。")
            ], {
                resume: "advance"
            });
            this.setPhase("survivalDecision");
            return {
                ok: true,
                message: `季节结束：出生 ${birthResult.names.length} 人，迁出 ${moved} 人，受孕 ${conception} 对。`
            };
        }
        this.completeSeasonAdvance();
        return {
            ok: true,
            message: `季节结束：出生 ${birthResult.names.length} 人，迁出 ${moved} 人，受孕 ${conception} 对。`
        };
    }
    resolveSurvivalChoice(optionId) {
        if (optionId === "split") {
            this.setEnding("分火而行");
            return {
                ok: true,
                message: this.state.ending?.title ?? "分火而行"
            };
        }
        const people = this.shuffle(this.alivePeople().filter((person)=>person.status === "同族"), "凝聚归零继续生活");
        const keep = Math.max(1, Math.floor(people.length / 2));
        const leaving = people.slice(keep);
        const leavingIds = new Set(leaving.map((person)=>person.id));
        for (const person of leaving){
            const spouseId = person.spouseId;
            person.status = "已迁出";
            person.spouseId = null;
            if (spouseId !== null) {
                const spouse = this.person(spouseId);
                if (spouse) {
                    spouse.spouseId = null;
                    spouse.lastPartnerEndGeneration = this.state.generation;
                }
            }
        }
        const lostKnowledge = [];
        for (const card of this.state.knowledge){
            if (card.holderId !== null && leavingIds.has(card.holderId)) {
                card.lost = true;
                card.holderId = null;
                card.level = 0;
                lostKnowledge.push(KNOWLEDGE_NAMES[card.key]);
            }
        }
        this.repairKnowledgeSlots();
        this.refillRoles();
        this.state.resources.cohesion = 2;
        this.clearDecision();
        const lossText = lostKnowledge.length > 0 ? ` ${lostKnowledge.join("、")}随原持有人离开，已经失去传承。` : "";
        this.log("system", "继续生活", `保留 ${keep} 人，凝聚力恢复至 2。${lossText}`);
        this.completeSeasonAdvance();
        return {
            ok: true,
            message: `保留一半人口后继续；当前人口 ${this.population()}。`
        };
    }
    childGenerationRank(mother, father) {
        const parentRanks = [
            mother.rank,
            father.rank
        ].filter((rank)=>rank !== null);
        return parentRanks.length > 0 ? Math.max(...parentRanks) + 1 : null;
    }
    canPairByGeneration(a, b) {
        if (a.rank === null || b.rank === null) return Math.abs(a.age - b.age) <= 10;
        return a.rank === b.rank;
    }
    deliverBirths() {
        const due = this.state.pregnancy.filter((preg)=>preg.dueTurn === this.state.turn && this.person(preg.motherId));
        if (due.length === 0) return {
            names: [],
            motherIds: []
        };
        const riskMother = this.state.resources.food <= 0 ? this.pick(due, "无粮分娩承受者")?.motherId ?? null : null;
        let caregiverSaveUsed = false;
        const names = [];
        const motherIds = [];
        for (const pregnancy of due){
            const mother = this.person(pregnancy.motherId);
            const father = this.person(pregnancy.fatherId);
            if (!mother || !father) continue;
            const risk = mother.id === riskMother;
            const sex = this.roll(100, "新生儿性别").value <= 43 ? "男" : "女";
            let newName = "";
            const used = new Set(this.state.people.map((person)=>person.name));
            newName = NAME_POOL.find((name)=>!used.has(name)) ?? `新生${this.state.nextPersonId}`;
            const child = {
                id: this.state.nextPersonId++,
                name: newName,
                sex,
                age: 0,
                rank: this.childGenerationRank(mother, father),
                fatherId: father.id,
                motherId: mother.id,
                spouseId: null,
                roleLabel: "儿童",
                status: "同族",
                health: 6,
                lightInjury: false,
                heavyInjury: false,
                infection: false,
                weak: false,
                frail: false,
                deathAge: null,
                earlyDeath: false,
                removeTurn: this.state.turn + 1,
                bornGeneration: this.state.generation,
                bornSeason: this.season,
                tribeFromTurn: null,
                lastPartnerEndGeneration: null,
                frailtyCareGeneration: null,
                frailtyCareUsed: false,
                frailtyChoiceHandled: false
            };
            const difficult = this.roll(20, `${mother.name}难产`).value;
            const motherDied = difficult <= (risk ? 10 : 1);
            let survival = this.roll(6, `${newName}儿童存活`).value;
            let threshold = risk ? 4 : 2;
            let early = survival <= threshold;
            if (early && !caregiverSaveUsed && this.person(this.state.caregiverId)) {
                caregiverSaveUsed = true;
                survival = this.roll(6, `${newName}照护重掷`).value;
                early = survival <= 1;
            }
            child.earlyDeath = early;
            this.state.people.push(child);
            if (motherDied) {
                const narrative = `${mother.name}在分娩时历经磨难，她很勇敢，可她终究没能熬过这一关，族人们沉默地守着篝火，她的配偶${father.name}已泣不成声。${mother.name}，死于难产，终年${formatAgeYears(mother.age)}岁。`;
                this.kill(mother.id, `难产 d20=${difficult}`, narrative, "死亡", [
                    father.id
                ]);
            }
            this.log("settlement", `新生儿：${newName}`, motherDied ? `${father.name}为新生儿取名${newName}。` : `${mother.name}平安诞下${sex}婴，她和配偶${father.name}决定把孩子取名${newName}。`, motherDied ? "warning" : "normal");
            names.push(`${newName}${motherDied ? "（母亡）" : ""}`);
            motherIds.push(mother.id);
        }
        this.state.pregnancy = this.state.pregnancy.filter((preg)=>preg.dueTurn !== this.state.turn && this.person(preg.motherId));
        return {
            names,
            motherIds
        };
    }
    passiveMigration() {
        if (this.population() < 39) return 0;
        const protectedIds = new Set();
        for (const card of this.state.knowledge){
            if (card.holderId !== null) protectedIds.add(card.holderId);
            for (const id of card.heirIds)if (id !== null) protectedIds.add(id);
        }
        if (this.state.caregiverId !== null) protectedIds.add(this.state.caregiverId);
        if (this.state.translatorId !== null) protectedIds.add(this.state.translatorId);
        const candidates = this.alivePeople().filter((person)=>person.sex === "男" && person.age >= 10 && person.age < 40 && !protectedIds.has(person.id));
        const chosen = this.pick(candidates, "离家远行");
        if (!chosen) return 0;
        chosen.status = "已迁出";
        if (chosen.spouseId !== null) {
            const spouse = this.person(chosen.spouseId);
            if (spouse) {
                spouse.spouseId = null;
                spouse.lastPartnerEndGeneration = this.state.generation;
            }
            chosen.spouseId = null;
        }
        if (this.state.resources.storage > 0) this.addResource("storage", -0.5);
        else this.addResource("food", -0.5);
        this.log("migration", "离家远行", `${chosen.name}因人口达到 39 迁往邻族。`);
        return 1;
    }
    pairAndConceive(birthMotherIds) {
        const previousPostpartum = new Set(this.state.postpartumIds);
        const currentPostpartum = new Set(birthMotherIds);
        const singles = this.alivePeople().filter((person)=>person.status === "同族" && person.spouseId === null && person.age >= 13 && person.age < 40 && (person.lastPartnerEndGeneration === null || person.lastPartnerEndGeneration < this.state.generation));
        const used = new Set();
        for (const male of singles.filter((person)=>person.sex === "男").sort((a, b)=>a.id - b.id)){
            if (used.has(male.id)) continue;
            const female = singles.find((person)=>!used.has(person.id) && person.sex === "女" && this.canPairByGeneration(male, person) && !this.relatedWithinThree(male, person));
            if (female) {
                male.spouseId = female.id;
                female.spouseId = male.id;
                used.add(male.id);
                used.add(female.id);
                this.log("settlement", "配对", `${male.name}与${female.name}组成夫妻。`);
            }
        }
        const pregnant = new Set(this.state.pregnancy.filter((preg)=>this.person(preg.motherId)).map((preg)=>preg.motherId));
        const seenPairs = new Set();
        let conceived = 0;
        for (const person of this.alivePeople()){
            if (person.sex === "男" || person.spouseId === null) continue;
            const pair = [
                person.id,
                person.spouseId
            ].sort((a, b)=>a - b);
            const key = pair.join("-");
            if (seenPairs.has(key)) continue;
            seenPairs.add(key);
            const left = this.person(pair[0]);
            const right = this.person(pair[1]);
            const male = left?.sex === "男" ? left : right?.sex === "男" ? right : null;
            const female = left?.sex === "女" ? left : right?.sex === "女" ? right : null;
            if (!male || !female || male.status !== "同族" || female.status !== "同族" || male.age < 13 || male.age >= 40 || female.age < 13 || female.age >= 40 || pregnant.has(female.id) || previousPostpartum.has(female.id) || currentPostpartum.has(female.id)) continue;
            const dueTurn = this.state.turn + 1;
            const dueGeneration = Math.floor(dueTurn / 4) + 1;
            const birthKey = `${key}:${dueGeneration}`;
            if ((this.state.birthCounts[birthKey] ?? 0) >= 2) continue;
            const foodMod = this.state.resources.food >= 5 ? 1 : this.state.resources.food <= 1 ? -1 : 0;
            const careMod = this.state.resources.care >= 2 ? 1 : this.state.resources.care === 0 ? -1 : 0;
            const roll = this.roll(6, `${male.name}与${female.name}受孕`).value;
            const threshold = this.state.generation <= 3 ? 7 : 5;
            if (roll + foodMod + careMod >= threshold) {
                this.state.pregnancy.push({
                    motherId: female.id,
                    fatherId: male.id,
                    dueTurn,
                    dueGeneration
                });
                this.state.birthCounts[birthKey] = (this.state.birthCounts[birthKey] ?? 0) + 1;
                pregnant.add(female.id);
                conceived += 1;
                this.log("settlement", "即将迎接新生命", `${female.name}与${male.name}孕育了新生命，她将在本季末分娩。`);
            }
        }
        this.state.postpartumIds = [
            ...currentPostpartum
        ];
        return conceived;
    }
    completeSeasonAdvance() {
        if (this.state.phase === "ended") return;
        if (this.season === "winter") {
            this.endGeneration();
            return;
        }
        this.state.seasonIndex += 1;
        this.state.turn = (this.state.generation - 1) * 4 + this.state.seasonIndex;
        this.setPhase("ready");
        this.state.lastMessage = `${SEASON_LABELS[this.season]}即将开始。`;
        this.integrateNewcomers();
    }
    endGeneration() {
        for (const card of this.state.knowledge){
            const holder = this.person(card.holderId);
            if (holder && holder.frail && holder.frailtyCareGeneration !== this.state.generation && this.roll(6, `${holder.name}代末衰弱死亡检定`).value === 1) {
                this.kill(holder.id, "衰弱知识持有人代末检定");
            }
        }
        if (this.state.phase === "ended") return;
        if (!this.state.allianceRescueUsed && this.population() > 0 && this.population() < 20 && this.state.resources.network >= 2 && this.state.counters.actualAlliances > 0) {
            const count = this.population() >= 18 ? 1 : 2;
            const newcomers = Array.from({
                length: count
            }, ()=>this.addNewcomer(15, "联盟救援迁入"));
            this.state.allianceRescueUsed = true;
            for (const newcomer of newcomers)this.state.allianceNewcomerIds.push(newcomer.id);
            this.reinforceWeakestKnowledge("联盟救援迁入");
            this.log("migration", "联盟救援迁入", `${newcomers.map((row)=>row.name).join("、")}加入群体。`);
        }
        this.state.history.campHistory.push(this.state.camp);
        this.state.history.crossgroup.push(this.state.season.currentCrossgroupSuccess);
        this.state.history.alliances.push(this.state.allianceCompletedThisGeneration);
        this.state.history.network.push(this.state.resources.network);
        this.state.history.food.push(this.state.resources.food);
        this.state.history.storage.push(this.state.resources.storage);
        this.state.history.shelter.push(this.state.resources.shelter);
        this.state.history.care.push(this.state.resources.care);
        this.state.history.careGaps.push(this.state.season.currentCareGap);
        if (this.state.camp === "河口浅滩") {
            this.state.counters.estuaryGenerations += 1;
            this.state.history.estuaryGenerations += 1;
        }
        const allLost = this.state.knowledge.every((card)=>card.lost || card.holderId === null);
        this.state.counters.allLostStreak = allLost ? this.state.counters.allLostStreak + 1 : 0;
        this.state.counters.noNetworkStreak = this.state.resources.network === 0 ? this.state.counters.noNetworkStreak + 1 : 0;
        this.state.history.generations.push({
            generation: this.state.generation,
            camp: this.state.camp,
            population: this.population(),
            resources: {
                ...this.state.resources
            },
            care: this.state.resources.care,
            network: this.state.resources.network,
            completeKnowledge: this.completeKnowledgeCount(),
            careGap: this.state.season.currentCareGap,
            crossgroupSuccess: this.state.season.currentCrossgroupSuccess,
            actualAlliance: this.state.allianceCompletedThisGeneration
        });
        if (this.population() === 0) {
            this.setEnding("最后一堆火·熄灭");
            return;
        }
        if (this.population() < 12) {
            const adults = this.alivePeople().filter((person)=>person.age >= 10);
            this.setEnding(this.population() >= 2 && adults.length > 0 ? "分火而行" : "最后一堆火·残火无人接");
            return;
        }
        if (this.state.generation >= 6) {
            if (this.baseHE()) {
                this.setEnding(this.evidenceCount() >= 2 ? "真HE：水有去处，人也有去处" : "HE：新的生活方式站稳");
                return;
            }
            const candidates = this.routeCandidates();
            if (candidates.length > 0) {
                this.state.endingCandidates = candidates;
                this.decision("ending", "生活路线已经出现", "达到条件的非 HE 路线只是候选。选择一个作为本代结局，或宣布继续生活。", [
                    ...candidates.map((route)=>this.option(route, route, ROUTE_TEXTS[route] ?? route)),
                    this.option("continue", "继续生活", "保留全部进度，进入下一代。")
                ]);
                this.setPhase("endingChoice");
                return;
            }
            if (this.state.counters.allLostStreak >= 2 && this.state.counters.noNetworkStreak >= 2) {
                this.state.endingCandidates = [
                    "最后一堆火·还活着，但没人记得路"
                ];
                this.decision("ending", "路已经失传", "五张知识全部失传，网络也连续两代为零。", [
                    this.option("最后一堆火·还活着，但没人记得路", "结束为最后一堆火", "接受这一代的故事终点。"),
                    this.option("continue", "继续生活", "保留当前状态进入下一代。")
                ]);
                this.setPhase("endingChoice");
                return;
            }
        }
        this.advanceGeneration();
    }
    baseHEConditions() {
        return {
            重复营地: this.state.previousCamp === this.state.camp,
            储藏: this.state.resources.storage >= 2,
            湿地管理: this.state.counters.wildRiceProgress >= 2,
            制作: this.state.counters.craftProgress >= 2,
            训练: this.state.knowledge.every((card)=>!card.lost && card.holderId !== null),
            网络: this.state.resources.network === 3
        };
    }
    baseHE() {
        const conditions = Object.values(this.baseHEConditions()).filter(Boolean).length;
        const resourcesPositive = RESOURCE_KEYS.filter((key)=>key !== "dog").every((key)=>this.state.resources[key] >= 1);
        return conditions >= 5 && this.completeKnowledgeCount() >= 2 && resourcesPositive;
    }
    evidenceCount() {
        const knowledgeTransfer = this.state.knowledge.some((card)=>!card.lost && card.level >= 3 && card.heirIds.some((id, index)=>id !== null && card.heirLevels[index] >= 2 && this.person(id)));
        const alliance = this.state.counters.actualAlliances > 0 && this.state.resources.network === 3 && Boolean(this.person(this.state.translatorId));
        const resilient = [
            this.state.resources.food >= 3,
            this.state.resources.storage >= 2,
            this.state.resources.shelter >= 2,
            this.state.resources.care >= 2
        ].filter(Boolean).length >= 3;
        return [
            knowledgeTransfer,
            alliance,
            resilient
        ].filter(Boolean).length;
    }
    adultStoryNarrator() {
        const card = this.knowledge("story");
        return [
            card.holderId,
            ...card.heirIds
        ].some((id)=>{
            const person = this.person(id);
            if (!person || person.age < 10 || person.status !== "同族") return false;
            if (id === card.holderId) return card.level >= 2;
            const index = card.heirIds.indexOf(id);
            return index >= 0 && card.heirLevels[index] >= 2;
        });
    }
    routeCandidates() {
        const routes = [];
        const resources = this.state.resources;
        const complete = new Set(this.state.knowledge.filter((card)=>!card.lost && card.level >= 3).map((card)=>card.key));
        const nonLost = this.state.knowledge.filter((card)=>!card.lost).length;
        const population = this.population();
        if (this.state.camp === "芦苇湖沼" && this.state.previousCamp === "芦苇湖沼" && this.knowledge("water").level > 0 && this.knowledge("plant").level > 0 && (complete.has("water") || complete.has("plant")) && this.state.counters.wildRiceProgress >= 2 && resources.storage >= 2 && resources.shelter >= 2 && population >= 12 && resources.food >= 1) routes.push("水泽共生");
        if (this.state.camp === "河口浅滩" && this.state.previousCamp === "河口浅滩" && this.state.counters.estuaryGenerations >= 3 && this.state.counters.estuaryLivelihoodSuccesses >= 1 && complete.has("water") && resources.network >= 2 && resources.food >= 4 && this.state.counters.crossgroupSuccessCount >= 2 && population >= 12) routes.push("逐潮而居");
        const camps = this.state.history.campHistory;
        const recentNoRepeat = camps.length >= 3 && camps.at(-1) !== camps.at(-2) && camps.at(-2) !== camps.at(-3);
        if (recentNoRepeat && this.state.counters.totalMigrations >= 3 && WATER_CAMPS.every((camp)=>this.state.history.campsVisited.includes(camp)) && !this.state.history.campsVisited.some((camp)=>HILL_CAMPS.includes(camp)) && complete.has("water") && this.adultStoryNarrator() && nonLost >= 3 && resources.network >= 2 && population >= 12 && resources.food >= 1) routes.push("行水为家");
        if (this.state.counters.actualAlliances >= 3 && resources.network === 3 && Boolean(this.person(this.state.translatorId)) && (complete.has("story") || resources.care >= 2) && this.state.allianceIntegrated && population >= 12 && resources.food >= 1) routes.push("两岸同灶");
        if (this.state.camp !== "河湾营地" && this.state.camp !== "芦苇湖沼" && this.state.camp !== "河口浅滩" && this.state.previousCamp !== null && HILL_CAMPS.includes(this.state.previousCamp) && HILL_CAMPS.includes(this.state.camp) && this.state.counters.wildRiceProgress <= 1 && complete.has("fire") && resources.fuel >= 6 && resources.shelter >= 2 && resources.clothes >= 2 && resources.network >= 1 && population >= 12 && resources.food >= 1) routes.push("山脊火种");
        const careRecent = [
            ...this.state.history.care.slice(-3, -1),
            resources.care
        ];
        const careGapRecent = [
            ...this.state.history.careGaps.slice(-2, -1),
            this.state.season.currentCareGap
        ];
        if (careRecent.filter((value)=>value >= 2).length >= 2 && !this.knowledge("care").lost && !this.knowledge("story").lost && (complete.has("care") || complete.has("story")) && this.state.counters.childrenReachedTen >= 5 && !careGapRecent.some(Boolean) && Boolean(this.person(this.state.caregiverId)) && population >= 12 && resources.food >= 1) routes.push("孩子的火塘");
        if (this.state.generation >= 8) {
            const recent = this.state.history.generations.slice(-3, -1);
            const richNow = resources.food >= 8 && resources.storage === 3 && resources.shelter >= 3;
            const richCount = recent.filter((snapshot)=>snapshot.resources.food >= 8 && snapshot.resources.storage === 3 && snapshot.resources.shelter >= 3).length + (richNow ? 1 : 0);
            const lowNow = resources.network <= 1;
            const lowCount = recent.filter((snapshot)=>snapshot.network <= 1).length + (lowNow ? 1 : 0);
            if (richCount >= 2 && lowCount >= 2 && this.state.counters.actualAlliances === 0 && complete.has("story") && population >= 12 && resources.food >= 1) routes.push("孤岸丰年");
        }
        return routes;
    }
    resolveEndingChoice(optionId) {
        if (optionId === "continue") {
            this.clearDecision();
            this.state.endingCandidates = [];
            this.advanceGeneration();
            return {
                ok: true,
                message: `进入第 ${this.state.generation} 代。`
            };
        }
        this.setEnding(optionId);
        return {
            ok: true,
            message: this.state.ending?.title ?? optionId
        };
    }
    setEnding(id) {
        let title = id;
        let text = ROUTE_TEXTS[id] ?? "";
        if (id === "HE：新的生活方式站稳") {
            text = "群体已经形成能够跨代维持的生活方式。生活站住了，但仍保留着下一次坏年景的脆弱。";
        } else if (id.startsWith("真HE")) {
            title = "真HE：水有去处，人也有去处";
            text = "水仍会改道，但群体保留了多条生活路线；知识有人接，关系有人来，坏年景也有缓冲。";
        } else if (id === "分火而行") {
            const knowledgeLeft = this.state.knowledge.some((card)=>!card.lost);
            title = knowledgeLeft ? "分火而行·带着火走" : "分火而行·散成足迹";
            text = knowledgeLeft ? "群体不再以原来的规模共同生活，但仍有人带着知识、火与旧路走向别处。" : "最后的成员分开了；连可以带走的知识也只剩零散记忆。";
        } else if (id === "最后一堆火·残火无人接") {
            text = "人数太少，也再没有能带队的人；最后几处火塘逐个冷下去。";
        } else if (id === "最后一堆火·熄灭") {
            text = "已经没有任何在世成员。属于这个群体的火塘熄灭了。";
        } else if (id === "最后一堆火·还活着，但没人记得路") {
            text = "人还在，但五张知识都已失传，外部网络也连续两代消失。";
        }
        this.state.ending = {
            id,
            title,
            text,
            generation: this.state.generation,
            routeCandidates: [
                ...this.state.endingCandidates
            ]
        };
        this.clearDecision();
        this.setPhase("ended");
        this.state.lastMessage = title;
        this.log("ending", title, text);
    }
    advanceGeneration() {
        this.state.previousCamp = this.state.camp;
        this.state.generation += 1;
        this.state.seasonIndex = 0;
        this.state.turn = (this.state.generation - 1) * 4;
        this.state.allianceCompletedThisGeneration = false;
        this.state.allianceRescueUsed = false;
        this.state.endingCandidates = [];
        this.state.season = emptySeason();
        this.state.pendingDecision = null;
        for (const person of this.alivePeople()){
            person.frailtyCareGeneration = null;
            person.frailtyCareUsed = false;
        }
        this.integrateNewcomers();
        if (this.state.generation % 2 === 0) {
            const trendCard = this.roll(3, "长期趋势");
            this.state.currentTrend = [
                "海侵与咸水",
                "湿地扩张",
                "邻族压力"
            ][trendCard.value - 1];
            this.log("system", "长期趋势", `第${this.state.generation}代趋势为「${this.state.currentTrend}」。`);
        }
        const seasonRoll = this.roll(4, `第${this.state.generation}代意外触发季节`);
        const triggerSeason = seasonRoll.value - 1;
        const deck = triggerSeason === 3 ? [
            1,
            2,
            3,
            4,
            5,
            6,
            8,
            8
        ] : [
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8
        ];
        const cardRoll = this.roll(deck.length, `第${this.state.generation}代意外卡`);
        const card = deck[cardRoll.value - 1];
        this.state.pendingUnexpected = {
            card,
            name: UNEXPECTED_NAMES[card - 1],
            triggerTurn: (this.state.generation - 1) * 4 + triggerSeason
        };
        this.setPhase("ready");
        this.state.lastMessage = `进入第 ${this.state.generation} 代。${this.state.currentTrend ? `长期趋势：${this.state.currentTrend}。` : ""}`;
        this.log("system", "进入下一代", this.state.lastMessage);
    }
}
function normalizeLegacyActionText(text) {
    let normalized = text.replace(/骰 \d+，总值 \d+。/g, "").replace(/\s{2,}/g, " ").trim();
    const marker = "实际资源变化——";
    const markerIndex = normalized.lastIndexOf(marker);
    if (markerIndex < 0) return normalized;
    const narrative = normalized.slice(0, markerIndex).trim();
    const legacySummary = normalized.slice(markerIndex + marker.length);
    const totals = new Map();
    for (const match of legacySummary.matchAll(/(食物|燃料|材料|凝聚力|照护|网络|住所|衣物|储藏|看家狗) ([+-]\d+(?:\.\d+)?)/g)){
        const key = RESOURCE_KEYS.find((entry)=>RESOURCE_LABELS[entry] === match[1]);
        if (key) totals.set(key, roundAge((totals.get(key) ?? 0) + Number(match[2])));
    }
    const parts = RESOURCE_KEYS.filter((key)=>Math.abs(totals.get(key) ?? 0) > 0.0001).map((key)=>{
        const amount = totals.get(key);
        return `${RESOURCE_LABELS[key]} ${amount > 0 ? "+" : ""}${formatNumber(amount)}`;
    });
    const summary = parts.length > 0 ? `${parts.join("、")}。` : "";
    normalized = [
        narrative,
        summary
    ].filter(Boolean).join(" ");
    return normalized;
}
function normalizeLegacyEarlySuccessionText(text) {
    const match = text.match(/^(.+?)把(.+?)交给(.+?)。$/);
    return match ? `${match[1]}日渐衰弱，于是把毕生积累的${match[2]}知识叮嘱给${match[3]}。` : text;
}
function roundAge(age) {
    return Math.round(age * 100) / 100;
}
function formatAgeYears(age) {
    return String(roundAge(age));
}
function formatNumber(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}


//# sourceURL=D:\Applications\CodexData\脑洞\web-game\src\engine\game.ts