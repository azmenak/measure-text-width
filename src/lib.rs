extern crate serde_derive;
extern crate unidecode;

mod utils;

use hashbrown::HashMap;
use unidecode::unidecode;
use wasm_bindgen::prelude::*;

extern crate web_sys;

struct FontMap {
    ascii_map: [f64; 95],
    kerning_pair_map: HashMap<String, f64>,
}

impl FontMap {
    pub fn new() -> FontMap {
        let ascii_map = [0.0; 95];
        let kerning_pair_map = HashMap::new();

        FontMap {
            ascii_map,
            kerning_pair_map,
        }
    }
}

#[wasm_bindgen]
pub struct FontWidths {
    font_maps: HashMap<String, FontMap>,
}

#[wasm_bindgen]
impl FontWidths {
    pub fn new() -> FontWidths {
        utils::set_panic_hook();

        let font_maps = HashMap::new();

        FontWidths { font_maps }
    }
}

#[wasm_bindgen]
impl FontWidths {
    pub fn create_ascii_map(&mut self, font: String, widths: Box<[f64]>) {
        let font_map = self.font_maps.entry(font).or_insert(FontMap::new());
        for i in 0..font_map.ascii_map.len() {
            font_map.ascii_map[i] = widths[i]
        }
    }

    pub fn create_kerning_map(&mut self, font: String, key_map: Box<[u8]>, diff_map: Box<[f64]>) {
        let font_map = self.font_maps.entry(font).or_insert(FontMap::new());
        let mut i = 0;
        while i < key_map.len() {
            let mut key = String::with_capacity(2);
            key.push(key_map[i] as char);
            key.push(key_map[i + 1] as char);
            font_map.kerning_pair_map.insert(key, diff_map[i]);
            i += 2
        }
    }

    pub fn text_widths(&self, font: String, val: &JsValue) -> Vec<f64> {
        if let Some(font_map) = self.font_maps.get(&font) {
            let text_list: Vec<String> = val.into_serde().unwrap();
            let mut results = Vec::with_capacity(text_list.len());
            for text in text_list {
                results.push(self.text_width_for_font_map(&font_map, &text));
            }
            return results;
        } else {
            return vec![];
        }
    }

    fn text_width_for_font_map(&self, font_map: &FontMap, text: &String) -> f64 {
        let ascii = font_map.ascii_map;

        let mut char_width = 0.0;
        let mut kerning_width = 0.0;
        let ascii_text = unidecode(text);

        let mut prev_char: Option<char> = None;
        for c in ascii_text.chars() {
            let mut b = [0; 1];
            c.encode_utf8(&mut b);
            let char_index = b[0] - 32;

            char_width += ascii[char_index as usize];
            if let Some(pc) = prev_char.take() {
                let mut key = String::with_capacity(2);
                key.push(pc);
                key.push(c);
                if let Some(kern) = font_map.kerning_pair_map.get(&key) {
                    kerning_width += kern
                }
            }

            prev_char = Some(c)
        }

        return char_width - kerning_width;
    }

    pub fn text_width(&self, font: String, text: String) -> f64 {
        if let Some(font_map) = self.font_maps.get(&font) {
            return self.text_width_for_font_map(&font_map, &text);
        } else {
            return 0.0;
        }
    }
}
