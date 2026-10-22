export function normalizeSeed(seed) {
    const integer = Number.isFinite(seed) ? Math.trunc(seed) : 20290000;
    return integer >>> 0;
}
export function nextRandom(state) {
    let next = state + 0x6d2b79f5 >>> 0;
    let mixed = next;
    mixed = Math.imul(mixed ^ mixed >>> 15, mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ mixed >>> 7, mixed | 61);
    const value = ((mixed ^ mixed >>> 14) >>> 0) / 4294967296;
    return {
        state: next,
        value
    };
}
export function rollSides(state, sides, label) {
    if (!Number.isInteger(sides) || sides <= 0) {
        throw new Error(`Invalid die size: ${sides}`);
    }
    const step = nextRandom(state);
    return {
        state: step.state,
        roll: {
            sides,
            value: 1 + Math.floor(step.value * sides),
            label
        }
    };
}
export function shuffleWithRng(items, state, label) {
    const output = items.slice();
    const rolls = [];
    let current = state;
    for(let index = output.length - 1; index > 0; index -= 1){
        const step = rollSides(current, index + 1, `${label}-洗牌${index + 1}`);
        current = step.state;
        rolls.push(step.roll);
        const swapIndex = step.roll.value - 1;
        [output[index], output[swapIndex]] = [
            output[swapIndex],
            output[index]
        ];
    }
    return {
        state: current,
        items: output,
        rolls
    };
}
export function pickWithRng(items, state, label) {
    if (items.length === 0) return {
        state,
        value: null,
        roll: null
    };
    const step = rollSides(state, items.length, label);
    return {
        state: step.state,
        value: items[step.roll.value - 1],
        roll: step.roll
    };
}


//# sourceURL=D:\Applications\CodexData\脑洞\web-game\src\engine\rng.ts