import * as Comlink from "comlink";

type Dictionary<T = any> = { [key: string]: T };

interface KerningPair {
  naive: number;
  width: number;
  diff: number;
}

const asciiMaps: Dictionary<Dictionary<number>> = {};
const kerningPairMaps: Dictionary<Dictionary<KerningPair>> = {};

function textWidth(rawText: string, font: string): number {
  if (!asciiMaps[font]) {
    throw new Error(`Missing ascii map for font "${font}"`);
  }

  if (!kerningPairMaps[font]) {
    throw new Error(`Missing kerning pair map for font "${font}"`);
  }

  // Remove diacritics from the string
  const text = rawText.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const ascii = asciiMaps[font];
  const kerningPairs = kerningPairMaps[font];

  let naiveCalculatedWidth = 0;
  let kerningDiff = 0;
  for (let i = 0; i < text.length; i++) {
    naiveCalculatedWidth += ascii[text[i]];
    if (i <= text.length - 2) {
      const pair = `${text[i]}${text[i + 1]}`;
      const kerning = kerningPairs[pair];
      if (kerning) {
        kerningDiff += kerning.diff;
      }
    }
  }

  return naiveCalculatedWidth - kerningDiff;
}

function optimizeTextWidthAcrossTwoLines(text: string, font: string) {
  // Split the text into its components
  const parts = text.split(" ");
  // Measure the width of each text part
  const widths = parts.map(part => {
    return textWidth(part, font);
  });

  const permutations = [];
  for (let i = 0; i < widths.length; i++) {
    const lines = [widths.slice(0, i + 1), widths.slice(i + 1)];
    const lineLengths = lines.map(line => {
      if (line.length === 0) {
        return 0;
      }

      const textWidth = line.reduce((sum, word) => sum + word, 0);
      return textWidth + asciiMaps[font][" "] * (line.length - 1);
    });
    const difference = Math.abs(lineLengths[0] - lineLengths[1]);
    const containerWidth = Math.max(...lineLengths);

    permutations.push({
      lines,
      difference,
      lineLengths,
      containerWidth
    });
  }

  let optimialPermutation;
  for (const permutation of permutations) {
    if (!optimialPermutation) {
      optimialPermutation = permutation;
    } else if (
      permutation.containerWidth < optimialPermutation.containerWidth
    ) {
      optimialPermutation = permutation;
    }
  }

  return optimialPermutation;
}

const worker = {
  textWidth,
  updateAsciiMap: (font: string, mapping: Dictionary<number>) => {
    asciiMaps[font] = mapping;
  },
  updateKerningMap: (font: string, mapping: Dictionary<KerningPair>) => {
    kerningPairMaps[font] = mapping;
  },
  textWidths: (texts: string[], font: string): Dictionary<number> => {
    const result: Dictionary<number> = {};

    for (const text of texts) {
      result[text] = textWidth(text, font);
    }

    return result;
  },
  exTextWidths: (texts: string[], font: string): Dictionary<number> => {
    const canvas = new OffscreenCanvas(100, 100);
    const context = canvas.getContext("2d");
    context.font = font;
    const result: Dictionary<number> = {};

    for (const text of texts) {
      result[text] = context.measureText(text).width;
    }

    return result;
  }
};

Comlink.expose(worker);
