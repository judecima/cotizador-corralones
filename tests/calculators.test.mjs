import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateWetWall,
  calculateDrywall,
  calculateFence,
  calculatePool,
  calculateCounterfloor,
  calculateSteelFrame,
  panelizeSteelFrame,
  packStockBars
} from '../src/calculators.js';

test('pared húmeda descuenta aberturas y usa cemento de 25 kg', () => {
  const result = calculateWetWall({ length: 5, height: 2.6, openingsArea: 3, wastePercent: 0, blockType: 'brickCeramic18' });
  assert.equal(result.metrics[0][1], 10);
  assert.equal(result.items[0].qty, 150);
  assert.equal(result.items.some(x => x.id === 'cement50'), false);
  assert.equal(result.items.find(x => x.id === 'cement25').qty, 2);
});

test('contrapiso calcula cemento en bolsas de 25 kg', () => {
  const result = calculateCounterfloor({ length: 5, width: 4, thicknessCm: 5, wastePercent: 0 });
  const cement = result.items.find(x => x.id === 'cement25');
  assert.equal(cement.qty, 12);
});

test('pared seca calcula placas para dos caras', () => {
  const result = calculateDrywall({ length: 4, height: 2.4, openingsArea: 0, wastePercent: 0, studSpacing: 0.4 });
  const boards = result.items.find(x => x.id === 'drywallBoard');
  assert.equal(boards.qty, 7);
});

test('cerco descuenta ancho de portón', () => {
  const result = calculateFence({ length: 40, gateWidth: 4, postSpacing: 2.5, wastePercent: 0 });
  assert.equal(result.metrics[0][1], 36);
  assert.ok(result.items.find(x => x.id === 'fencePost').qty > 10);
});

test('pileta entrega excavación, revestimiento y cemento de 25 kg', () => {
  const result = calculatePool({ length: 8, width: 4, minDepth: 1.2, maxDepth: 1.8, wastePercent: 10 });
  assert.ok(result.metrics[0][1] > 50);
  assert.ok(result.items.find(x => x.id === 'poolFinish').qty > 60);
  assert.ok(result.items.find(x => x.id === 'cement25').qty > 0);
  assert.equal(result.items.some(x => x.id === 'cement50'), false);
});

test('steel frame paneliza 8 m con paneles dentro de 2 a 4 m', () => {
  const panels = panelizeSteelFrame(8, 3, 2, 4);
  assert.equal(panels.reduce((sum, value) => sum + value, 0), 8);
  assert.ok(panels.every(value => value >= 2 && value <= 4));
  assert.equal(panels.length, 3);
});

test('optimizador básico agrupa cortes de perfiles de 6 m', () => {
  const packed = packStockBars([2.6, 2.6, 0.8, 2.6, 2.6, 0.8], 6);
  assert.equal(packed.bars, 2);
});

test('steel frame cuenta montantes por panel y optimiza barras comerciales', () => {
  const result = calculateSteelFrame({
    length: 8,
    height: 2.6,
    openingsArea: 0,
    openingCount: 0,
    openingWidthTotal: 0,
    studSpacing: 0.4,
    panelPreferred: 3,
    profileLength: 6,
    wastePercent: 7,
    includeOsb: true,
    includeDrywall: true,
    includeInsulation: true
  });

  assert.equal(result.metrics[1][1], 3);
  assert.equal(result.metrics[2][1], 24);
  assert.equal(result.items.find(x => x.id === 'steelStud90').qty, 12);
  assert.equal(result.items.find(x => x.id === 'steelTrack90').qty, 3);
  assert.equal(result.items.find(x => x.id === 'osbBoard').qty, 8);
  assert.equal(result.items.find(x => x.id === 'drywallBoard').qty, 8);
});
