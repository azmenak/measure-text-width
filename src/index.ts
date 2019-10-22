import * as Comlink from "comlink";

const FONT = '500 14px / 15px "Source Sans Pro", sans-serif';
const canvas = document.createElement("canvas");

const context = canvas.getContext("2d");
context.textAlign = "right";
context.font = FONT;

let ascii = {};

performance.mark("ascii-start");
const savedWidths = localStorage.getItem("ascii-widths");
if (savedWidths) {
  ascii = JSON.parse(savedWidths);
} else {
  for (var i = 32; i < 127; ++i) {
    const char = String.fromCharCode(i);
    ascii[char] = context.measureText(char).width;
  }

  localStorage.setItem("ascii-widths", JSON.stringify(ascii));
}

performance.mark("ascii-end");
const measurement = performance.measure(
  "ASCII measure",
  "ascii-start",
  "ascii-end"
);
console.log("Measure ASCII", measurement.duration);

function naiveCalculatedWidth(text: string): number {
  let calculatedWidth = 0;
  for (const char of text.split("")) {
    calculatedWidth += ascii[char];
  }

  return calculatedWidth;
}

// Kerning Test

let kerningPairs = {};

function measureKerning(text: string) {
  const naiveWidth = naiveCalculatedWidth(text);
  const measuredWidth = context.measureText(text).width;

  if (naiveWidth !== measuredWidth) {
    kerningPairs[text] = {
      naive: naiveWidth,
      width: measuredWidth,
      diff: naiveWidth - measuredWidth
    };
  }
}

performance.mark("kerning-start");
const savedKerningPairs = localStorage.getItem("kerning-widths");
if (savedKerningPairs) {
  kerningPairs = JSON.parse(savedKerningPairs);
} else {
  for (const charA in ascii) {
    for (const charB in ascii) {
      measureKerning(`${charA}${charB}`);
    }
  }

  localStorage.setItem("kerning-widths", JSON.stringify(kerningPairs));
}

performance.mark("kerning-end");
const measurementKerning = performance.measure(
  "Kerning measure",
  "kerning-start",
  "kerning-end"
);
console.log("Measure Kerning", measurementKerning.duration);

const worker = new Worker("./worker.ts");
console.log(worker);
const proxiedWorker = Comlink.wrap(worker);

console.log(proxiedWorker);

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

async function main() {
  try {
    await proxiedWorker.updateAsciiMap(FONT, ascii);
    await proxiedWorker.updateKerningMap(FONT, kerningPairs);

    const results = await proxiedWorker.textWidths(kerningTests, FONT);
    console.log(results);
  } catch (error) {
    console.error(error);
  }
}

main();

// const testResults = {};
// for (const test of kerningTests) {
//   const actual = context.measureText(test).width;
//   const naive = naiveCalculatedWidth(test);
//   const diff = kerningDiffPairs(test);

//   testResults[test] = {
//     naive: actual - naive,
//     diff: actual - diff
//   };
// }

// console.table(testResults);

// performance.mark("diff-pairs-start");

// for (let i = 0; i < 1; i++) {
//   for (const test of kerningTests) {
//     kerningDiffPairs(test);
//   }
// }

// performance.mark("diff-pairs-end");
// const diffPairsMeasurement = performance.measure(
//   "Diff Paris",
//   "diff-pairs-start",
//   "diff-pairs-end"
// );

// console.log("Measure Diff Pairs", diffPairsMeasurement.duration);

// Baseline

// performance.mark("baseline-start");

// for (let i = 0; i < 1; i++) {
//   for (const test of kerningTests) {
//     context.measureText(test);
//   }
// }

// performance.mark("baseline-end");
// const baselineMeasurement = performance.measure(
//   "Baseline",
//   "baseline-start",
//   "baseline-end"
// );

// console.log("Measure Baseline", baselineMeasurement.duration);
