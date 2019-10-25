mod utils;

use wasm_bindgen::prelude::*;
use std::collections::HashMap;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

struct FontMaps {
    asciiMaps: HashMap<String, HashMap<String, f64>>
    kerningPairMaps: HashMap<String, HashMap<String, f64>>
}

#[wasm_bindgen]
pub struct FontWidths {
    fontMaps: FontMaps
}

#[wasm_bindgen]
impl FontWidths {
    pub fn createAsciiMap(&mut self, font: String)
}
