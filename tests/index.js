import {parser} from './../src/parser.js'
import * as fs from 'fs'
import * as assert from 'assert'

function parse(src) {
    console.log(src)
    let parsed = parser(src);
    if (parsed.body.length === 0) {
        throw new Error("nothing parsed")
    }
    return parsed
}

let passExcludes = ["0339fa95c78c11bd.js", "0426f15dac46e92d.js", "059b850298ae3352.js", "05b849122b429743.js", "05d5195f0d388d98.js", "06f7278423cef571.js", "0813adc754c82a98.js", "08358cb4732d8ce1.js", "0b1fc7208759253b.js", "0b4d61559ccce0f9.js", "0d6e503c739611e2.js"];
let failExcludes = [];
let earlyExcludes = ['557.script.js', '558.script.js', '559.script.js', '560.script.js', '561.script.js', '563.script.js', '564.script.js', '565.script.js', '566.script.js', '567.script.js', '568.script.js', '569.script.js', '570.script.js', '571.script.js', '572.script.js', '574.script.js', '575.script.js', '576.script.js', '577.script.js', '578.script.js', '579.script.js', '580.script.js', '581.script.js', '582.script.js', '583.script.js', '585.script.js', '586.script.js', '587.script.js', '588.script.js', '589.script.js', '590.script.js', '591.script.js', '592.script.js', '593.script.js', '594.script.js', '596.script.js', '597.script.js', '598.script.js', '599.script.js', '600.script.js', '601.script.js', '602.script.js'];

fs.readdirSync('pass').filter(f => !passExcludes.includes(f)).forEach((f, index) => {
    let firstTree, secondTree;
    assert.doesNotThrow(() => {
        console.log(`${index} ${f}`);
        firstTree = parse(
            fs.readFileSync(`pass/${f}`, 'utf8')
        );
    });
    assert.doesNotThrow(() => {
        secondTree = parse(
            fs.readFileSync(`pass-explicit/${f}`, 'utf8')
        );
    });
    assert.deepStrictEqual(firstTree, secondTree);
});

fs.readdirSync('fail').filter(f => !failExcludes.includes(f)).forEach(f => {
    assert.throws(() => {
        parse(
            fs.readFileSync(`fail/${f}`, 'utf8')
        );
    });
});

fs.readdirSync('early').filter(f => !earlyExcludes.includes(f)).forEach(f => {
    assert.doesNotThrow(() => {
        parse(
            fs.readFileSync(`early/${f}`, 'utf8')
        );
    });
    assert.throws(() => {
        parse(
            fs.readFileSync(`early/${f}`, 'utf8')
        );
    });
});
