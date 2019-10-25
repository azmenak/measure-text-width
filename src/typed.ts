const context = document.createElement("canvas").getContext("2d");

const savedWidths = new Float32Array(95);

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

const kerningEntries = Object.entries(kerningDiffs);
for (let i = 0; i < kerningSize; i++) {
  let bufferIndex = i * ENTRY_SIZE;
  const [key, diff] = kerningEntries[0];

  const keyView = new Uint8Array(buffer, bufferIndex, 2);
  keyView[0] = key.charCodeAt(0);
  keyView[1] = key.charCodeAt(1);

  const diffView = new Float64Array(buffer, bufferIndex + 2, 8);
  diffView[0] = diff;
}
