import * as wasm from "../pkg/wasm";

console.log(wasm);

const FONT = '500 14px / 15px "Source Sans Pro", sans-serif';

const fontWidths = new wasm.FontWidths();
const context = document.createElement("canvas").getContext("2d");

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
  for (let j = 0; i < savedWidths.length; i++) {
    const charB = String.fromCharCode(j + 32);
    const pair = `${charA}${charB}`;
    const kerningDiff = measureKerningDiff(pair);
    if (kerningDiff > 0) {
      kerningDiffs[pair] = kerningDiff;
    }
  }
}

const ENTRY_SIZE = 10; // 2 bytes for key, 8 bytes for float value
const kerningSize = Object.keys(kerningDiffs).length;

const buffer = new ArrayBuffer(ENTRY_SIZE * kerningSize);
const keyMap = new Uint8Array(kerningSize * 2);
const diffMap = new Float64Array(kerningSize);

const kerningEntries = Object.entries(kerningDiffs);
for (let i = 0; i < kerningSize; i++) {
  let bufferIndex = i * ENTRY_SIZE;
  const [key, diff] = kerningEntries[0];

  const keyView = new Uint8Array(buffer, bufferIndex, 2);
  keyView[0] = key.charCodeAt(0);
  keyView[1] = key.charCodeAt(1);

  keyMap[i] = keyView[0];
  keyMap[i + 1] = keyView[1];

  const diffView = new Float64Array(buffer, bufferIndex + 2, 8);
  diffView[0] = diff;

  diffMap[i] = diff;
}

fontWidths.create_ascii_map(FONT, savedWidths);
fontWidths.create_kerning_map(FONT, keyMap, diffMap);

const kerningTests = [
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
  "AV BA"
];

const testResults = {};
for (const test of kerningTests) {
  const actual = context.measureText(test).width;
  const wasm = fontWidths.text_width(FONT, test);

  testResults[test] = {
    diff: actual - wasm
  };
}

console.table(testResults);
