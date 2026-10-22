export const SEASONS = [
    "spring",
    "summer",
    "autumn",
    "winter"
];
export const SEASON_LABELS = {
    spring: "春水季",
    summer: "盛夏季",
    autumn: "秋收季",
    winter: "冬寒季"
};
export const CAMP_ORDER = [
    "高丘营地",
    "橡树林坡",
    "河湾营地",
    "芦苇湖沼",
    "河口浅滩"
];
export const WATER_CAMPS = [
    "河湾营地",
    "芦苇湖沼",
    "河口浅滩"
];
export const HILL_CAMPS = [
    "高丘营地",
    "橡树林坡"
];
export const RESOURCE_LABELS = {
    food: "食物",
    fuel: "燃料",
    material: "材料",
    cohesion: "凝聚力",
    care: "照护",
    network: "网络",
    shelter: "住所",
    clothes: "衣物",
    storage: "储藏",
    dog: "看家狗"
};
export const RESOURCE_KEYS = Object.keys(RESOURCE_LABELS);
export const RESOURCE_CAPS = {
    food: 13,
    fuel: 6,
    material: 6,
    cohesion: 6,
    care: 3,
    network: 3,
    shelter: 5,
    clothes: 3,
    storage: 3,
    dog: 1
};
export const KNOWLEDGE_ORDER = [
    "fire",
    "water",
    "plant",
    "story",
    "care"
];
export const KNOWLEDGE_NAMES = {
    fire: "火/陶",
    water: "水/木",
    plant: "植物/季节",
    story: "故事/亲属",
    care: "治疗/草药"
};
export const INITIAL_PEOPLE = [
    {
        id: 1,
        name: "闻",
        sex: "女",
        age: 45,
        rank: 1,
        fatherId: null,
        motherId: null,
        spouseId: null,
        roleLabel: "故事/亲属知识",
        deathAge: 55
    },
    {
        id: 2,
        name: "燧",
        sex: "男",
        age: 32,
        rank: 2,
        fatherId: null,
        motherId: 1,
        spouseId: 3,
        roleLabel: "火/陶知识",
        deathAge: 44
    },
    {
        id: 3,
        name: "澜",
        sex: "女",
        age: 30,
        rank: 2,
        fatherId: null,
        motherId: null,
        spouseId: 2,
        roleLabel: "水/木知识",
        deathAge: 46
    },
    {
        id: 4,
        name: "汐",
        sex: "女",
        age: 5,
        rank: 3,
        fatherId: 2,
        motherId: 3,
        spouseId: null,
        roleLabel: "儿童",
        deathAge: null
    },
    {
        id: 5,
        name: "禾",
        sex: "女",
        age: 26,
        rank: 2,
        fatherId: null,
        motherId: 1,
        spouseId: 6,
        roleLabel: "植物/季节知识",
        deathAge: 48
    },
    {
        id: 6,
        name: "疗",
        sex: "男",
        age: 24,
        rank: 2,
        fatherId: null,
        motherId: null,
        spouseId: 5,
        roleLabel: "治疗/草药知识",
        deathAge: 54
    },
    {
        id: 7,
        name: "岚",
        sex: "男",
        age: 3,
        rank: 3,
        fatherId: 6,
        motherId: 5,
        spouseId: null,
        roleLabel: "儿童",
        deathAge: null
    },
    {
        id: 8,
        name: "苇",
        sex: "男",
        age: 4,
        rank: 3,
        fatherId: 22,
        motherId: 21,
        spouseId: null,
        roleLabel: "儿童",
        deathAge: null
    },
    {
        id: 9,
        name: "榆",
        sex: "女",
        age: 5,
        rank: 3,
        fatherId: 17,
        motherId: 18,
        spouseId: null,
        roleLabel: "儿童",
        deathAge: null
    },
    {
        id: 10,
        name: "粟",
        sex: "女",
        age: 8,
        rank: 3,
        fatherId: 20,
        motherId: 19,
        spouseId: null,
        roleLabel: "儿童",
        deathAge: null
    },
    {
        id: 11,
        name: "泥",
        sex: "男",
        age: 9,
        rank: 3,
        fatherId: 22,
        motherId: 21,
        spouseId: null,
        roleLabel: "儿童",
        deathAge: null
    },
    {
        id: 12,
        name: "舟",
        sex: "男",
        age: 1,
        rank: 3,
        fatherId: 15,
        motherId: 16,
        spouseId: null,
        roleLabel: "儿童",
        deathAge: null
    },
    {
        id: 13,
        name: "石",
        sex: "男",
        age: 13,
        rank: 2,
        fatherId: null,
        motherId: null,
        spouseId: 14,
        roleLabel: "成人",
        deathAge: 33
    },
    {
        id: 14,
        name: "梾",
        sex: "女",
        age: 14,
        rank: 2,
        fatherId: null,
        motherId: null,
        spouseId: 13,
        roleLabel: "成人",
        deathAge: 39
    },
    {
        id: 15,
        name: "菖",
        sex: "男",
        age: 14,
        rank: 2,
        fatherId: null,
        motherId: null,
        spouseId: 16,
        roleLabel: "成人",
        deathAge: 38
    },
    {
        id: 16,
        name: "汀",
        sex: "女",
        age: 16,
        rank: 2,
        fatherId: null,
        motherId: null,
        spouseId: 15,
        roleLabel: "成人",
        deathAge: 44
    },
    {
        id: 17,
        name: "渚",
        sex: "男",
        age: 18,
        rank: 2,
        fatherId: null,
        motherId: null,
        spouseId: 18,
        roleLabel: "成人",
        deathAge: 44
    },
    {
        id: 18,
        name: "麓",
        sex: "女",
        age: 20,
        rank: 2,
        fatherId: null,
        motherId: null,
        spouseId: 17,
        roleLabel: "成人",
        deathAge: 44
    },
    {
        id: 19,
        name: "汜",
        sex: "女",
        age: 22,
        rank: 2,
        fatherId: null,
        motherId: null,
        spouseId: 20,
        roleLabel: "成人",
        deathAge: 42
    },
    {
        id: 20,
        name: "槲",
        sex: "男",
        age: 23,
        rank: 2,
        fatherId: null,
        motherId: null,
        spouseId: 19,
        roleLabel: "成人",
        deathAge: 41
    },
    {
        id: 21,
        name: "葭",
        sex: "女",
        age: 25,
        rank: 2,
        fatherId: null,
        motherId: null,
        spouseId: 22,
        roleLabel: "成人",
        deathAge: 47
    },
    {
        id: 22,
        name: "芄",
        sex: "男",
        age: 32,
        rank: 2,
        fatherId: null,
        motherId: null,
        spouseId: 21,
        roleLabel: "成人",
        deathAge: 47
    },
    {
        id: 23,
        name: "溱",
        sex: "男",
        age: 42,
        rank: 2,
        fatherId: null,
        motherId: null,
        spouseId: null,
        roleLabel: "长者",
        deathAge: 47
    },
    {
        id: 24,
        name: "濯",
        sex: "女",
        age: 50,
        rank: 2,
        fatherId: null,
        motherId: null,
        spouseId: null,
        roleLabel: "长者",
        deathAge: 58
    }
];
export const INITIAL_KNOWLEDGE = [
    {
        key: "fire",
        holderId: 2,
        heirIds: [
            13,
            14
        ]
    },
    {
        key: "water",
        holderId: 3,
        heirIds: [
            16,
            17
        ]
    },
    {
        key: "plant",
        holderId: 5,
        heirIds: [
            21,
            19
        ]
    },
    {
        key: "story",
        holderId: 1,
        heirIds: [
            18,
            20
        ]
    },
    {
        key: "care",
        holderId: 6,
        heirIds: [
            15,
            22
        ]
    }
];
export const EVENT_NAMES = {
    spring: [
        "春汛",
        "鱼群入湾",
        "芦苇滩扩大",
        "湿热病",
        "陌生人到来",
        "河岸坍塌",
        "幼兽出现",
        "邻族借道",
        "春末缺食",
        "野稻发芽"
    ],
    summer: [
        "水生资源丰盛",
        "盛夏热病",
        "雷暴与洪水",
        "水鸟繁殖",
        "水华与浊水",
        "蚊群暴发",
        "鱼群缺氧",
        "河口咸潮",
        "外来者避雨",
        "雷击起火"
    ],
    autumn: [
        "橡子丰年",
        "鹿群经过",
        "储藏受潮",
        "秋社换工",
        "用火管理",
        "野猪拱橡林",
        "鱼群洄游",
        "虫蛀储藏",
        "盟约破裂",
        "早霜"
    ],
    winter: [
        "冷脉冲",
        "燃料短缺",
        "老辈病重",
        "孩子发烧",
        "海侵与咸水",
        "冻雨",
        "鹿群越冬",
        "火塘熄灭",
        "食物分配争执",
        "邻族求援"
    ]
};
export const EVENT_TEXT = {
    "春汛": "河湾/湖沼/河口：失去 1 食物或 1 住所，可迁往高丘；否则本季捕鱼 +1 食物。",
    "鱼群入湾": "河湾/湖沼/河口：本季捕鱼额外 +1 食物；否则凝聚 +1。",
    "芦苇滩扩大": "湖沼：本季湿地采集额外食物和材料 +1；否则本季编织少花 1 材料。",
    "湿热病": "随机一人测试健康与照护；不利健康 -1，部分健康 -1且照护 +1。",
    "陌生人到来": "随机成人测试网络；不利凝聚 -1，部分交换 1 物资，有利网络 +1。",
    "河岸坍塌": "河湾/湖沼/河口：失去住所或材料 1，可迁往高丘。",
    "幼兽出现": "随机猎人测试照护与狩猎；有利食物 +2，部分 +1，不利 +1且猎人受伤。",
    "邻族借道": "测试网络与翻译；有利网络 +1，部分换得材料 1，不利凝聚 -1。",
    "春末缺食": "食物 -1，可花 1 储藏抵消；若因此为 0，全体健康 -1。",
    "野稻发芽": "河湾/湖沼：本季野稻额外食物和进度 +1；否则食物 +1。",
    "水生资源丰盛": "湖沼：湿地采集额外食物和材料 +1；否则食物 +1。",
    "盛夏热病": "随机一人测试健康与照护；住所 ≥2 时 +1。",
    "雷暴与洪水": "河湾/湖沼/河口三选一：迁高丘、材料 2 加固、留地硬扛。",
    "水鸟繁殖": "湖沼/河口食物 +2；当季捕鱼再得食物与材料各 +1；否则材料 +1。",
    "水华与浊水": "随机一人测试健康与住所；完整水知识 +1。",
    "蚊群暴发": "全体健康 -1；住所 ≥2 时只伤 2 人；完整治疗可免 1 人。",
    "鱼群缺氧": "食物 -1；河湾/湖沼捕鱼 +1 食物；完整水知识可改为材料 -1。",
    "河口咸潮": "河口食物和住所 -1，可选择支付迁徙费用前往湖沼；否则材料 +1。",
    "外来者避雨": "随机成人测试网络；有利网络 +1并交换物资，部分交换材料 1，不利凝聚 -1。",
    "雷击起火": "住所和材料 -1；完整火知识可改为燃料 -1；橡林额外食物 -1。",
    "橡子丰年": "橡林收获额外食物 +2；否则相邻迁往橡林免食物。",
    "鹿群经过": "高丘/橡林狩猎额外食物 +2；否则食物 +1。",
    "储藏受潮": "失去 1 储藏，无储藏则材料 -1；住所 ≥2 可改食 -1。",
    "秋社换工": "网络 ≥1 时测试网络与照护；否则材料或照护 +1。",
    "用火管理": "高丘/橡林测试完整火知识或照护；有利制作进度或食物 +2。",
    "野猪拱橡林": "食物 -1；捕猎失利会受伤；有狗或网络 ≥2 时食物损失为 0。",
    "鱼群洄游": "河湾/湖沼/河口食物 +2，完整水知识再 +1；否则食物 +1。",
    "虫蛀储藏": "失去 1 储藏，无储藏则材料 -1；住所 ≥2 可改食 -1。",
    "盟约破裂": "三选一：付资源保网络、失网络保物资、接收 1 名 15 岁成人。",
    "早霜": "食物和燃料 -1；住所与衣物 ≤2 时全体健康 -1；完整植物知识可抢收食物 +1。",
    "冷脉冲": "食物 -1；测试住所与衣物；部分再失食物，不利健康 -1。",
    "燃料短缺": "燃料 -1，可改耗材料；住所与衣物 ≤2 时全体健康 -1。",
    "老辈病重": "照护 -1；随机长者测试照护与健康。",
    "孩子发烧": "随机儿童测试照护与健康；不利健康与食物 -1，部分食物 -1。",
    "海侵与咸水": "河口失去食物或住所 1，可选择支付迁徙费用前往湖沼；否则材料 +1。",
    "冻雨": "住所 -1；住所 ≤1 时全体健康 -1；衣物 ≥2 可免 1 人。",
    "鹿群越冬": "高丘/橡林随机猎人测试狩猎；成功食物 +2，部分 +1，失败 +1且受伤。",
    "火塘熄灭": "燃料 -1；无完整火知识时住所 -1；本季已照顾可改凝聚 -1。",
    "食物分配争执": "凝聚 -1；有照护者或翻译可花食物避免；凝聚 ≤2 时再伤一人。",
    "邻族求援": "给食物 1：网络 +1并获得脆弱知识；拒绝则凝聚 -1。"
};
export const EVENT_TENDENCIES = [
    {
        season: "spring",
        camps: [
            "河湾营地",
            "芦苇湖沼",
            "河口浅滩"
        ],
        cards: [
            1,
            2,
            5,
            8
        ]
    },
    {
        season: "spring",
        camps: [
            "河湾营地",
            "河口浅滩"
        ],
        cards: [
            6
        ]
    },
    {
        season: "spring",
        camps: [
            "芦苇湖沼"
        ],
        cards: [
            3
        ]
    },
    {
        season: "spring",
        camps: [
            "高丘营地",
            "橡树林坡"
        ],
        cards: [
            7
        ]
    },
    {
        season: "spring",
        camps: [
            "河湾营地",
            "芦苇湖沼"
        ],
        cards: [
            10
        ]
    },
    {
        season: "summer",
        camps: [
            "芦苇湖沼"
        ],
        cards: [
            1
        ]
    },
    {
        season: "summer",
        camps: [
            "河湾营地",
            "芦苇湖沼",
            "河口浅滩"
        ],
        cards: [
            3,
            5,
            9
        ]
    },
    {
        season: "summer",
        camps: [
            "芦苇湖沼",
            "河口浅滩"
        ],
        cards: [
            4
        ]
    },
    {
        season: "summer",
        camps: [
            "河湾营地",
            "芦苇湖沼"
        ],
        cards: [
            7
        ]
    },
    {
        season: "summer",
        camps: [
            "河口浅滩"
        ],
        cards: [
            8
        ]
    },
    {
        season: "summer",
        camps: [
            "橡树林坡"
        ],
        cards: [
            10
        ]
    },
    {
        season: "autumn",
        camps: [
            "橡树林坡"
        ],
        cards: [
            1,
            6
        ]
    },
    {
        season: "autumn",
        camps: [
            "高丘营地",
            "橡树林坡"
        ],
        cards: [
            2,
            5
        ]
    },
    {
        season: "autumn",
        camps: [
            "河湾营地",
            "芦苇湖沼",
            "河口浅滩"
        ],
        cards: [
            7
        ]
    },
    {
        season: "winter",
        camps: [
            "河口浅滩"
        ],
        cards: [
            5
        ]
    },
    {
        season: "winter",
        camps: [
            "高丘营地",
            "橡树林坡"
        ],
        cards: [
            7
        ]
    }
];
export const UNEXPECTED_NAMES = [
    "猎人受伤",
    "野猪闯营地",
    "营地失火",
    "独木舟翻覆",
    "老人跌倒",
    "孩子走失",
    "蛇咬与感染",
    "储藏被动物翻找"
];
export const UNEXPECTED_TEXT = [
    "随机猎人健康 -1并轻伤；照护 ≥2 可改为食物 -1。",
    "食物 -1；有狗无影响，或网络 ≥2时改失材料；凝聚 -1，除非安排轮守并修补围栏。",
    "住所和食物 -1；完整火知识可改为燃料 -1；本代住所加成失效。",
    "水网营地随机一人健康 -1并失去食物或材料 1；完整水知识只失材料 1。",
    "随机长者健康 -1并轻伤；已衰弱则重伤。",
    "测试网络与照护；不利失去一名儿童、食物和凝聚各 -1。",
    "随机一人健康 -1并感染；完整治疗知识可改为轻伤；缺住所或衣物再健康 -1。",
    "失去 1 储藏，无储藏则食物 -1；有狗无影响；住所 ≥2 可改食 -1。"
];
export const NAME_POOL = [
    "溪",
    "蒲",
    "荻",
    "沚",
    "濑",
    "沄",
    "沨",
    "苹",
    "芦芽",
    "青蒲",
    "沙棠",
    "露禾",
    "河柳",
    "白芷",
    "蘋",
    "汀兰",
    "藕",
    "菱",
    "衡",
    "沅",
    "澧",
    "莼",
    "菅",
    "雎",
    "蒿",
    "溪桥",
    "芩",
    "蓼",
    "葭月",
    "莒",
    "菽",
    "稗",
    "秫",
    "粱",
    "黍",
    "荞",
    "荇",
    "茭",
    "荃",
    "蘅",
    "藿",
    "薇",
    "蕨",
    "芷",
    "芹",
    "藻",
    "萍",
    "菰",
    "蒲舟",
    "澜衣",
    "汐音",
    "洲",
    "溯",
    "泳",
    "汎",
    "沿",
    "浜",
    "湾",
    "渚音"
];
export const KNOWLEDGE_EVENT_TYPES = {
    fire: [
        "营地失火",
        "用火管理",
        "雷击起火",
        "火塘熄灭",
        "制作陶器/木器",
        "拾取燃料/整备火塘"
    ],
    water: [
        "春汛",
        "河岸坍塌",
        "雷暴与洪水",
        "鱼群缺氧",
        "河口咸潮",
        "海侵与咸水",
        "捕鱼与贝类",
        "营地迁徙"
    ],
    plant: [
        "野稻发芽",
        "秋收季",
        "储藏受潮",
        "早霜",
        "虫蛀储藏",
        "野生稻管理",
        "储藏"
    ],
    story: [
        "陌生人到来",
        "邻族借道",
        "秋社换工",
        "盟约破裂",
        "外来者避雨",
        "孩子走失"
    ],
    care: [
        "湿热病",
        "盛夏热病",
        "水华与浊水",
        "蚊群暴发",
        "老辈病重",
        "孩子发烧",
        "蛇咬与感染",
        "照顾"
    ]
};


//# sourceURL=D:\Applications\CodexData\脑洞\web-game\src\engine\data.ts