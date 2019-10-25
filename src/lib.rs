mod utils;

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

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
    font_maps: Rc<RefCell<HashMap<String, Rc<RefCell<FontMap>>>>>,
}

impl FontWidths {
    pub fn new() -> FontWidths {
        let font_maps = Rc::new(RefCell::new(HashMap::new()));

        FontWidths { font_maps }
    }
}

#[wasm_bindgen]
impl FontWidths {
    pub fn create_ascii_map(&mut self, font: String, widths: &[f64]) {
        let mut font_maps_ref = self.font_maps.borrow_mut();
        let font_map = font_maps_ref
            .entry(font)
            .or_insert(Rc::new(RefCell::new(FontMap::new())));
        let mut font_map_ref = font_map.borrow_mut();
        for i in 0..font_map_ref.ascii_map.len() {
            font_map_ref.ascii_map[i] = widths[i]
        }
    }

    pub fn create_kerning_map(&mut self, font: String, key_map: &[u8], diff_map: &[f64]) {
        let mut font_maps_ref = self.font_maps.borrow_mut();
        let font_map = font_maps_ref
            .entry(font)
            .or_insert(Rc::new(RefCell::new(FontMap::new())));
        let mut font_map_ref = font_map.borrow_mut();
        let mut i = 0;
        while i < key_map.len() {
            let mut key = String::with_capacity(2);
            key.push(key_map[i] as char);
            key.push(key_map[i + 1] as char);
            font_map_ref.kerning_pair_map.insert(key, diff_map[i]);
            i += 2
        }
    }

    pub fn text_width(self, font: String, text: String) -> f64 {
        let font_maps_ref = self.font_maps.borrow();
        if let Some(font_map) = font_maps_ref.get(&font) {
            let font_map_ref = font_map.borrow();
            let ascii = font_map_ref.ascii_map;

            let mut char_width = 0.0;
            let mut kerning_width = 0.0;

            let mut prev_char: Option<char> = None;
            for c in text.chars() {
                if !c.is_ascii() {
                    continue;
                }

                let mut b = [0; 1];
                c.encode_utf8(&mut b);
                let char_index = b[0] - 32;

                char_width += ascii[char_index as usize];
                if let Some(pc) = prev_char.take() {
                    let mut key = String::with_capacity(2);
                    key.push(pc);
                    key.push(c);
                    if let Some(kern) = font_map_ref.kerning_pair_map.get(&key) {
                        kerning_width += kern
                    }
                }

                prev_char = Some(c)
            }

            return char_width - kerning_width;
        } else {
            return 0.0;
        }
    }
}
