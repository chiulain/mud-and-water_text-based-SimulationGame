export const ENDING_ACHIEVEMENT_CATEGORY_LABELS = {
    he: "HE 结局",
    route: "路线结局",
    survival: "生存结局"
};
export const ENDING_ACHIEVEMENTS = [
    {
        id: "he",
        title: "HE：新的生活方式站稳",
        category: "he",
        condition: "第 6 代冬寒季结算后，六项过渡条件至少满足 5 项：连续两代同一营地、储藏 ≥2、湿地管理进度 ≥2、制作进度 ≥2、五张知识均未失传、网络 =3；同时至少 2 张知识当前完整，且除看家狗外全部 9 项资源均 ≥1。"
    },
    {
        id: "true-he",
        title: "真HE：水有去处，人也有去处",
        category: "he",
        condition: "先满足基础 HE，并在三项见证中至少满足 2 项：知识传承（至少一张当前完整知识有在世传承人，熟练度 ≥2）；坚实盟约（完成过实际联盟、网络 =3、翻译/中间人有人在任）；顽强生长（食物 ≥3、储藏 ≥2、住所 ≥2、照护 ≥2，四项中至少三项）。"
    },
    {
        id: "wetland-symbiosis",
        title: "水泽共生",
        category: "route",
        condition: "第 6 代后且基础 HE 未成立；本代与上一代主营地均为芦苇湖沼；水/木与植物/季节知识均未失传，且至少一张当前完整；野生稻进度 ≥2；储藏 ≥2、住所 ≥2；人口 ≥12、食物 ≥1。"
    },
    {
        id: "tide-dweller",
        title: "逐潮而居",
        category: "route",
        condition: "第 6 代后且基础 HE 未成立；本代与上一代主营地均为河口浅滩；累计河口代次 ≥3；成功完成过河口生计 ≥1 次；水/木知识当前完整；网络 ≥2、食物 ≥4；成功跨群体往来 ≥2 次；人口 ≥12。"
    },
    {
        id: "waterborne-home",
        title: "行水为家",
        category: "route",
        condition: "第 6 代后且基础 HE 未成立；已结算历史中最近三个主营地两两不同；累计迁徙 ≥3；到访全部 3 个水网营地，且从未到访高丘或橡林；水/木知识当前完整；有熟练度 ≥2 的在世同族成年故事讲述者；至少 3/5 知识未失传；网络 ≥2；人口 ≥12、食物 ≥1。"
    },
    {
        id: "two-banks-one-hearth",
        title: "两岸同灶",
        category: "route",
        condition: "第 6 代后且基础 HE 未成立；实际联盟累计 ≥3；网络 =3 且翻译/中间人有人在任；故事/亲属知识当前完整或照护 ≥2；已有联盟成员完成融合/双边居；人口 ≥12、食物 ≥1。"
    },
    {
        id: "ridge-fire",
        title: "山脊火种",
        category: "route",
        condition: "第 6 代后且基础 HE 未成立；本代与上一代主营地均为高丘或橡林；野生稻进度 ≤1；火/陶知识当前完整；燃料 ≥6、住所 ≥2、衣物 ≥2、网络 ≥1；人口 ≥12、食物 ≥1。"
    },
    {
        id: "childrens-hearth",
        title: "孩子的火塘",
        category: "route",
        condition: "第 6 代后且基础 HE 未成立；本代及此前两代中至少两代代末照护 ≥2；治疗/草药与故事/亲属知识均未失传，且至少一张当前完整；累计至少 5 名儿童活到 10 岁；本代与上一代均无儿童照护空缺；主要照护者在任；人口 ≥12、食物 ≥1。"
    },
    {
        id: "lone-shore-abundance",
        title: "孤岸丰年",
        category: "route",
        condition: "第 8 代后且基础 HE 未成立；本代及此前两代中至少两代满足食物 ≥8、储藏 =3、住所 ≥3，并至少两代满足网络 ≤1；从开局至终局从未完成实际联盟；故事/亲属知识当前完整；人口 ≥12、食物 ≥1。"
    },
    {
        id: "split-with-fire",
        title: "分火而行·带着火走",
        category: "survival",
        condition: "任意代末人口降至 1—11，且仍有至少 2 人在世、其中至少 1 人年龄 ≥10；或凝聚力归零后选择结束。结束时至少一张知识卡尚未失传。"
    },
    {
        id: "split-as-footprints",
        title: "分火而行·散成足迹",
        category: "survival",
        condition: "任意代末人口降至 1—11，且仍有至少 2 人在世、其中至少 1 人年龄 ≥10；或凝聚力归零后选择结束。结束时五张知识卡均已失传。"
    },
    {
        id: "last-fire-out",
        title: "最后一堆火·熄灭",
        category: "survival",
        condition: "任意时点人口降至 0，群体已经没有任何在世成员。"
    },
    {
        id: "last-fire-unclaimed",
        title: "最后一堆火·残火无人接",
        category: "survival",
        condition: "任意代末人口降至 1—11，但不足 2 人在世，或没有年龄 ≥10 且有带队能力的人，无法形成“分火而行”。"
    },
    {
        id: "last-fire-forgotten-road",
        title: "最后一堆火·还活着，但没人记得路",
        category: "survival",
        condition: "第 6 代后人口 ≥12、基础 HE 与非 HE 路线均未成立；五张知识全部失传连续 2 代，且网络连续 2 代为 0。可在代末选择结束，或继续生活。"
    }
];


//# sourceURL=D:\Applications\CodexData\脑洞\web-game\src\engine\endings.ts