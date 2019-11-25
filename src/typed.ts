import * as Comlink from "comlink";
import { chunk, isEqual } from "lodash";

const FONT = '500 14px / 15px "Source Sans Pro", sans-serif';

const context = document.createElement("canvas").getContext("2d");
context.font = FONT;

const savedWidths = new Float64Array(95);

for (let i = 32; i < 127; ++i) {
  const char = String.fromCharCode(i);
  const width = context.measureText(char).width;

  savedWidths[i - 32] = width;
}

function getWidthForChar(char: string) {
  const charCode = char.charCodeAt(0);
  return savedWidths[charCode - 32];
}

function getWidthForString(text: string) {
  let calculatedWidth = 0;
  for (const char of text.split("")) {
    calculatedWidth += getWidthForChar(char);
  }
  return calculatedWidth;
}

function measureKerningDiff(text: string) {
  const charWidth = getWidthForString(text);
  const measuredWidth = context.measureText(text).width;

  return charWidth - measuredWidth;
}

const kerningDiffs: { [key: string]: number } = {};

for (let i = 0; i < savedWidths.length; i++) {
  const charA = String.fromCharCode(i + 32);
  for (let j = 0; j < savedWidths.length; j++) {
    const charB = String.fromCharCode(j + 32);
    const pair = `${charA}${charB}`;
    const kerningDiff = measureKerningDiff(pair);
    if (kerningDiff > 0) {
      kerningDiffs[pair] = kerningDiff;
    }
  }
}

const kerningSize = Object.keys(kerningDiffs).length;
const kerningEntries = Object.entries(kerningDiffs);
const keyMap = new Uint8Array(kerningSize * 2);
const diffMap = new Float64Array(kerningSize);
for (let i = 0; i < kerningSize; i++) {
  const [key, diff] = kerningEntries[i];

  diffMap[i] = diff;

  keyMap[i * 2] = key.charCodeAt(0);
  keyMap[i * 2 + 1] = key.charCodeAt(1);
}

console.log(keyMap);
console.log(diffMap);

const kerningTests = [
  "1",
  "12",
  "123",
  "1234",
  "12345",
  "EMULATION",
  "Moxy",
  "MOXY",
  "Example",
  "LOVE",
  "Avery",
  "Await",
  "AWAITING",
  "Hello",
  "ABC",
  "L'arche",
  "auf Wie",
  "BACON",
  "Lorem Ipsum",
  "Sit Doloret",
  "Morbi lacinia consectetur eleifend. Pellentesque feugiat consectetur nulla, eu ullamcorper magna blandit eget. Nullam pellentesque libero non dignissim pellentesque. Nunc lacinia porta dui, eget blandit mauris semper et. Sed at viverra libero, quis consectetur quam. Mauris tincidunt nunc a velit finibus maximus. Sed sed pretium ligula. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Phasellus id gravida nibh.",
  "AV BA",
  "école",
  "ecole"
];

const RUNS = 10_000;
const tests: string[] = [];
for (let i = 0; i < RUNS; i++) {
  tests.push(...kerningTests);
}

const workerPool = [];
for (let i = 0; i < 8; i++) {
  workerPool.push(
    Comlink.wrap(new Worker("./wasm-worker.ts", { type: "module" }))
  );
}

async function test() {
  await Promise.all(
    workerPool.map(worker => worker.setup(FONT, savedWidths, keyMap, diffMap))
  );

  const results = await workerPool[0].textWidths(FONT, kerningTests);
  const canvasResults = await workerPool[0].exTextWidths(FONT, kerningTests);

  console.table(results);
  console.table(canvasResults);
  console.log(isEqual(results, canvasResults));

  const chunks: string[][] = chunk(
    tests,
    Math.ceil(tests.length / workerPool.length)
  );

  performance.mark("wasm-worker-start");

  await Promise.all(
    chunks.map((texts, i) => {
      return workerPool[i].textWidths(FONT, texts);
    })
  );
  performance.mark("wasm-worker-end");
  performance.measure("WASM Workers", "wasm-worker-start", "wasm-worker-end");

  performance.mark("offscreen-canvas-start");
  await Promise.all(
    chunks.map((texts, i) => {
      return workerPool[i].exTextWidths(FONT, texts);
    })
  );
  performance.mark("offscreen-canvas-end");
  performance.measure(
    "Canvas Workers",
    "offscreen-canvas-start",
    "offscreen-canvas-end"
  );

  console.log(performance.getEntriesByType("measure"));
}

test();
