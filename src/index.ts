import * as Comlink from "comlink";
import { chunk } from "lodash";

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
performance.measure("ASCII measure", "ascii-start", "ascii-end");
performance.clearMarks();

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
performance.measure("Kerning measure", "kerning-start", "kerning-end");
performance.clearMarks();

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
  performance.mark("setup-workers-start");
  const workerPool = [];
  for (let i = 0; i < 4; i++) {
    workerPool.push(Comlink.wrap(new Worker("./worker.ts")));
  }

  try {
    const updateTasks = [];
    for (const worker of workerPool) {
      updateTasks.push(worker.updateAsciiMap(FONT, ascii));
      updateTasks.push(worker.updateKerningMap(FONT, kerningPairs));
    }
    await Promise.all(updateTasks);
    performance.mark("setup-workers-end");
    performance.measure(
      "Setup Workers",
      "setup-workers-start",
      "setup-workers-end"
    );

    const testResults = {};
    for (const test of kerningTests) {
      const actual = context.measureText(test).width;
      const naive = naiveCalculatedWidth(test);
      const diff = await workerPool[0].textWidth(test, FONT);

      testResults[test] = {
        naive: actual - naive,
        diff: actual - diff
      };
    }

    console.table(testResults);

    const RUNS = 10_000;

    // Baseline

    performance.mark("baseline-start");

    for (let i = 0; i < RUNS; i++) {
      for (const test of kerningTests) {
        context.measureText(test);
      }
    }

    performance.mark("baseline-end");
    performance.measure("Baseline", "baseline-start", "baseline-end");
    performance.clearMarks();

    // Web Workers

    const tests = [];
    for (let i = 0; i < RUNS; i++) {
      tests.push(...kerningTests);
    }

    const chunks = chunk(tests, Math.ceil(tests.length / workerPool.length));

    performance.mark("diff-pairs-start");

    await Promise.all(chunks.map((t, i) => workerPool[i].textWidths(t, FONT)));

    performance.mark("diff-pairs-end");
    performance.measure("Diff Paris", "diff-pairs-start", "diff-pairs-end");
    performance.clearMarks();

    // Offscreen Canvas

    performance.mark("offscreen-canvas-start");

    await Promise.all(
      chunks.map((t, i) => workerPool[i].exTextWidths(t, FONT))
    );

    performance.mark("offscreen-canvas-end");
    performance.measure(
      "Offscreen Canvas",
      "offscreen-canvas-start",
      "offscreen-canvas-end"
    );
    performance.clearMarks();

    console.log(performance.getEntriesByType("measure"));
  } catch (error) {
    console.error(error);
  }
}

main();
