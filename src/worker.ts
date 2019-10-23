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
  }
};

Comlink.expose(worker);
