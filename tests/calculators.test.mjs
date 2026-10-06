import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateWetWall, calculateDrywall, calculateFence, calculatePool } from '../src/calculators.js';

test('pared húmeda descuenta aberturas', () => {
  const result = calculateWetWall({ length: 5, height: 2.6, openingsArea: 3, wastePercent: 0, blockType: 'brickCeramic18' });
  assert.equal(result.metrics[0][1], 10);
  assert.equal(result.items[0].qty, 150);
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

test('pileta entrega excavación y revestimiento', () => {
  const result = calculatePool({ length: 8, width: 4, minDepth: 1.2, maxDepth: 1.8, wastePercent: 10 });
  assert.ok(result.metrics[0][1] > 50);
  assert.ok(result.items.find(x => x.id === 'poolFinish').qty > 60);
});
