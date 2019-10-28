import * as Comlink from "comlink";
import { FontWidths } from "../pkg";

type Dictionary<T = any> = { [key: string]: T };

let fontWidths: FontWidths;

const worker = {
  setup: async (
    font: string,
    savedWidths: Float64Array,
    keyMap: Uint8Array,
    diffMap: Float64Array
  ) => {
    await import("../pkg").then(wasm => {
      if (!fontWidths) {
        fontWidths = wasm.FontWidths.new();
      }

      fontWidths.create_ascii_map(font, savedWidths);
      fontWidths.create_kerning_map(font, keyMap, diffMap);
    });
  },
  textWidths(font: string, texts: string[]) {
    fontWidths.text_widths(font, texts);
  },
  exTextWidths: (font: string, texts: string[]): Dictionary<number> => {
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
