use sonificator::Sonificator;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct WasmSonificator {
    inner: Sonificator,
}

#[wasm_bindgen]
impl WasmSonificator {
    #[wasm_bindgen(constructor)]
    pub fn new(sample_rate: u32) -> Self {
        Self {
            inner: Sonificator::new(sample_rate),
        }
    }

    pub fn push_frame(&mut self, rgba: &[u8], width: u32, height: u32) {
        self.inner.push_frame(rgba, width, height);
    }

    pub fn render(&mut self, frames: usize) -> Vec<f32> {
        self.inner.render(frames)
    }

    pub fn orange_pulse(&self) -> f32 {
        self.inner.features().pulse
    }

    pub fn pulse(&self) -> f32 {
        self.inner.features().pulse
    }

    pub fn pulse_x(&self) -> f32 {
        self.inner.features().pulse_x
    }

    pub fn pulse_y(&self) -> f32 {
        self.inner.features().pulse_y
    }

    pub fn pulse_dispersion(&self) -> f32 {
        self.inner.features().pulse_dispersion
    }

    pub fn brightness(&self) -> f32 {
        self.inner.features().brightness
    }

    pub fn contrast(&self) -> f32 {
        self.inner.features().contrast
    }

    pub fn saturation(&self) -> f32 {
        self.inner.features().saturation
    }

    pub fn hue(&self) -> f32 {
        self.inner.features().hue
    }

    pub fn warmth(&self) -> f32 {
        self.inner.features().warmth
    }

    pub fn motion(&self) -> f32 {
        self.inner.features().motion
    }
}
