import { INITIAL_KNOWLEDGE, INITIAL_PEOPLE, KNOWLEDGE_ORDER } from "./data.js";
import { normalizeSeed, rollSides } from "./rng.js";
const INITIAL_RESOURCES = {
    food: 6,
    fuel: 5,
    material: 5,
    cohesion: 5,
    care: 3,
    network: 1,
    shelter: 2,
    clothes: 2,
    storage: 1,
    dog: 0
};
function emptySeason() {
    return {
        event: null,
        actions: [],
        actionRecords: [],
        unexpected: null,
        unexpectedRecorded: false,
        allianceWindowChecked: false,
        currentCared: false,
        childProtectionUsed: false,
        currentCareGap: false,
        currentCrossgroupSuccess: false,
        nonTeachingIncrements: [],
        famine: false,
        zeroFoodHandled: false,
        shelterBonusDisabled: false,
        startNotes: [],
        endNotes: []
    };
}
function createPeople() {
    return INITIAL_PEOPLE.map((person)=>({
            ...person,
            status: "同族",
            health: 6,
            lightInjury: false,
            heavyInjury: false,
            infection: false,
            weak: false,
            frail: false,
            earlyDeath: false,
            removeTurn: null,
            bornGeneration: null,
            bornSeason: null,
            tribeFromTurn: null,
            lastPartnerEndGeneration: null,
            frailtyCareGeneration: null,
            frailtyCareUsed: false,
            frailtyChoiceHandled: false
        }));
}
function createKnowledge() {
    return INITIAL_KNOWLEDGE.map((seed)=>({
            key: seed.key,
            name: seed.key === "fire" ? "火/陶" : seed.key === "water" ? "水/木" : seed.key === "plant" ? "植物/季节" : seed.key === "story" ? "故事/亲属" : "治疗/草药",
            holderId: seed.holderId,
            level: 3,
            heirIds: [
                ...seed.heirIds
            ],
            heirLevels: [
                1,
                1
            ],
            lost: false
        }));
}
function drawUnexpected(seed, generation, maxTurn) {
    let rngState = seed;
    const seasonRoll = rollSides(rngState, 4, `第${generation}代意外触发季节`);
    rngState = seasonRoll.state;
    const triggerSeasonIndex = seasonRoll.roll.value - 1;
    const deck = triggerSeasonIndex === 3 ? [
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
    const cardRoll = rollSides(rngState, deck.length, `第${generation}代意外卡`);
    rngState = cardRoll.state;
    return {
        rngState,
        card: deck[cardRoll.roll.value - 1],
        triggerTurn: Math.min(maxTurn, (generation - 1) * 4 + triggerSeasonIndex)
    };
}
export function createInitialState(options = {}) {
    const seed = normalizeSeed(options.seed ?? 20290000);
    const unexpected = drawUnexpected(seed, 1, 3);
    return {
        version: 1,
        seed,
        rngState: unexpected.rngState,
        generation: 1,
        seasonIndex: 0,
        turn: 0,
        phase: "ready",
        camp: "河湾营地",
        previousCamp: null,
        shelterBonusDisabled: false,
        resources: {
            ...INITIAL_RESOURCES
        },
        people: createPeople(),
        nextPersonId: 25,
        knowledge: createKnowledge(),
        caregiverId: options.caregiverId ?? 19,
        translatorId: options.translatorId ?? 21,
        allianceCompletedThisGeneration: false,
        allianceNewcomerIds: [],
        allianceIntegrated: false,
        allianceRescueUsed: false,
        pregnancy: [],
        postpartumIds: [],
        birthCounts: {},
        currentTrend: null,
        pendingUnexpected: {
            card: unexpected.card,
            name: [
                "猎人受伤",
                "野猪闯营地",
                "营地失火",
                "独木舟翻覆",
                "老人跌倒",
                "孩子走失",
                "蛇咬与感染",
                "储藏被动物翻找"
            ][unexpected.card - 1],
            triggerTurn: unexpected.triggerTurn
        },
        campMigratedThisSeason: false,
        eventMigrationUsed: false,
        pendingDecision: null,
        season: emptySeason(),
        logs: [],
        nextLogId: 1,
        counters: {
            wildRiceProgress: 0,
            craftProgress: 0,
            actualAlliances: 0,
            totalMigrations: 0,
            estuaryGenerations: 0,
            estuaryLivelihoodSuccesses: 0,
            crossgroupSuccessCount: 0,
            childrenReachedTen: 0,
            allLostStreak: 0,
            noNetworkStreak: 0
        },
        history: {
            campsVisited: [
                "河湾营地"
            ],
            campHistory: [],
            migrationsByGeneration: {},
            estuaryGenerations: 0,
            crossgroup: [
                false,
                false
            ],
            alliances: [
                false,
                false
            ],
            network: [],
            food: [],
            storage: [],
            shelter: [],
            care: [],
            careGaps: [],
            generations: []
        },
        ending: null,
        endingCandidates: [],
        lastMessage: "春天尚未开始。"
    };
}
export function cloneState(value) {
    return JSON.parse(JSON.stringify(value));
}
export function ensureKnowledgeShape(state) {
    state.knowledge = KNOWLEDGE_ORDER.map((key)=>{
        return state.knowledge.find((card)=>card.key === key);
    });
}


//# sourceURL=D:\Applications\CodexData\脑洞\web-game\src\engine\state.ts