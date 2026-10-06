import { MATERIALS } from './catalog.js';

const clamp = (value, min = 0) => Math.max(min, Number(value) || 0);
const factor = (wastePercent = 0) => 1 + clamp(wastePercent) / 100;
const ceil = (value) => Math.ceil(value - 1e-9);

function item(id, qty) {
  return { id, ...MATERIALS[id], qty: Math.max(0, qty) };
}

export function netWallArea({ length, height, openingsArea = 0 }) {
  return Math.max(0, clamp(length) * clamp(height) - clamp(openingsArea));
}

export function calculateWetWall(input) {
  const area = netWallArea(input);
  const f = factor(input.wastePercent ?? 7);
  const block = input.blockType || 'brickCeramic18';
  const unitsPerM2 = { brickCeramic8: 16, brickCeramic12: 16, brickCeramic18: 15 }[block] ?? 15;
  const mortarM3PerM2 = { brickCeramic8: 0.010, brickCeramic12: 0.013, brickCeramic18: 0.016 }[block] ?? 0.016;
  const mortar = area * mortarM3PerM2 * f;
  const items = [
    item(block, ceil(area * unitsPerM2 * f)),
    item('cement25', ceil(mortar * 190 / 25)),
    item('lime25', ceil(mortar * 105 / 25)),
    item('sand', mortar * 1.05)
  ];

  if (input.includePlaster) {
    const plasterArea = area * 2;
    const plasterVolume = plasterArea * 0.015 * f;
    items.push(item('plasterMortar', plasterVolume));
  }

  return {
    title: 'Pared húmeda',
    metrics: [
      ['Superficie neta', area, 'm²'],
      ['Desperdicio', clamp(input.wastePercent ?? 7), '%']
    ],
    items,
    assumptions: [
      'Estimación preliminar para mampostería; no reemplaza cómputo estructural ni dirección técnica.',
      'Mortero de asiento aproximado con dosificación de referencia. Ajustar a la práctica y productos de Corrales.'
    ]
  };
}

export function calculateDrywall(input) {
  const area = netWallArea(input);
  const f = factor(input.wastePercent ?? 10);
  const spacing = Math.max(0.3, clamp(input.studSpacing || 0.4));
  const length = clamp(input.length);
  const height = clamp(input.height);
  const studCount = ceil(length / spacing) + 1;
  const studLinear = studCount * height;
  const boardArea = area * 2;
  const items = [
    item('drywallBoard', ceil(boardArea * f / 2.88)),
    item('stud70', ceil(studLinear * f / 3)),
    item('track70', ceil((length * 2) * f / 3)),
    item('drywallScrew', ceil(boardArea * 20 * f)),
    item('jointTape', ceil((boardArea * 1.15) / 90)),
    item('jointCompound', ceil((boardArea * 0.45) / 18))
  ];
  if (input.includeInsulation) items.push(item('insulationRoll', ceil(area * f / 12)));

  return {
    title: 'Pared seca',
    metrics: [
      ['Superficie neta de muro', area, 'm²'],
      ['Superficie de placas', boardArea, 'm²'],
      ['Montantes estimados', studCount, 'u']
    ],
    items,
    assumptions: [
      'Se consideran placas en ambas caras y montantes de 70 mm.',
      'La modulación, refuerzos, dinteles, esquinas y requisitos acústicos/fuego deben validarse según sistema elegido.'
    ]
  };
}

export function calculateCeiling(input) {
  const length = clamp(input.length);
  const width = clamp(input.width);
  const area = length * width;
  const f = factor(input.wastePercent ?? 10);
  const spacing = Math.max(0.3, clamp(input.profileSpacing || 0.4));
  const profileLines = ceil(width / spacing) + 1;
  const profileLinear = profileLines * length;
  const perimeter = 2 * (length + width);

  return {
    title: 'Cielorraso de placas',
    metrics: [['Superficie', area, 'm²'], ['Perímetro', perimeter, 'm']],
    items: [
      item('drywallBoard', ceil(area * f / 2.88)),
      item('ceilingProfile', ceil(profileLinear * f / 3)),
      item('perimeterProfile', ceil(perimeter * f / 3)),
      item('hanger', ceil(area * 2.5)),
      item('drywallScrew', ceil(area * 22 * f)),
      item('jointTape', ceil((area * 1.15) / 90)),
      item('jointCompound', ceil((area * 0.45) / 18))
    ],
    assumptions: [
      'Predimensionado comercial para un cielorraso simple.',
      'Separación y tipo de perfilería/suspensión deben verificarse con el fabricante y las cargas reales.'
    ]
  };
}

export function calculateFence(input) {
  const totalLength = clamp(input.length);
  const gateWidth = Math.min(totalLength, clamp(input.gateWidth));
  const fenceLength = Math.max(0, totalLength - gateWidth);
  const spacing = Math.max(1, clamp(input.postSpacing || 2.5));
  const f = factor(input.wastePercent ?? 5);
  const spans = fenceLength > 0 ? ceil(fenceLength / spacing) : 0;
  const posts = spans + (fenceLength > 0 ? 1 : 0) + (gateWidth > 0 ? 2 : 0);
  const concreteVolume = posts * 0.025;

  return {
    title: 'Cercado de lote',
    metrics: [['Longitud a cercar', fenceLength, 'm'], ['Postes estimados', posts, 'u']],
    items: [
      item('meshRoll', ceil(fenceLength * f / 10)),
      item('fencePost', posts),
      item('tensionWire', ceil(fenceLength * 3 * f / 100)),
      item('bindingWire', Math.max(1, Math.ceil(fenceLength / 40))),
      item('concrete', concreteVolume * f)
    ],
    assumptions: [
      'Se estiman tres líneas de alambre tensor y dados de hormigón de 0,025 m³ por poste.',
      'No incluye portón, esquineros especiales, riendas ni cálculo de viento/suelo.'
    ]
  };
}

export function calculateCounterfloor(input) {
  const length = clamp(input.length);
  const width = clamp(input.width);
  const thicknessM = clamp(input.thicknessCm || 8) / 100;
  const area = length * width;
  const volume = area * thicknessM * factor(input.wastePercent ?? 8);

  return {
    title: 'Contrapiso / platea liviana',
    metrics: [['Superficie', area, 'm²'], ['Volumen de mezcla', volume, 'm³']],
    items: [
      item('cement25', ceil(volume * 300 / 25)),
      item('sand', volume * 0.55),
      item('stone', volume * 0.80)
    ],
    assumptions: [
      'Dosificación de referencia: 300 kg de cemento por m³.',
      'No incluye armaduras, barrera de vapor, suelo-cemento ni cálculo estructural.'
    ]
  };
}

export function calculatePool(input) {
  const length = clamp(input.length);
  const width = clamp(input.width);
  const minDepth = clamp(input.minDepth || 1.2);
  const maxDepth = Math.max(minDepth, clamp(input.maxDepth || 1.8));
  const avgDepth = (minDepth + maxDepth) / 2;
  const margin = clamp(input.workMargin ?? 0.5);
  const f = factor(input.wastePercent ?? 10);

  const excavation = (length + margin * 2) * (width + margin * 2) * (maxDepth + 0.25);
  const slabVolume = length * width * 0.15 * f;
  const wallArea = 2 * (length + width) * avgDepth;
  const interiorArea = length * width + wallArea;
  const mortar = wallArea * 0.012 * f;

  return {
    title: 'Pileta de mampostería',
    metrics: [
      ['Volumen de excavación', excavation, 'm³'],
      ['Superficie interior', interiorArea, 'm²'],
      ['Profundidad media', avgDepth, 'm']
    ],
    items: [
      item('concrete', slabVolume),
      item('poolBlock', ceil(wallArea * 12.5 * f)),
      item('cement25', ceil(mortar * 190 / 25)),
      item('lime25', ceil(mortar * 105 / 25)),
      item('sand', mortar * 1.05),
      item('waterproof', ceil(interiorArea * 3 / 20)),
      item('poolFinish', interiorArea * f),
      item('tileAdhesive', ceil(interiorArea * 5 / 25)),
      item('grout', ceil(interiorArea * 0.5 / 5))
    ],
    assumptions: [
      'MVP comercial para cuantificar materiales, no un cálculo estructural de pileta.',
      'No incluye hierro, hidráulica, bomba, filtro, skimmers, retornos ni estudio de suelo; deben dimensionarse por proyecto.'
    ]
  };
}


export function panelizeSteelFrame(length, preferred = 3, min = 2, max = 4) {
  let remaining = clamp(length);
  const panels = [];
  if (remaining <= 0) return panels;
  if (remaining <= max) return [remaining];

  while (remaining > max) {
    let take = preferred;

    if (remaining <= max * 2 && remaining - preferred < min) {
      take = remaining / 2;
    } else if (remaining - take < min) {
      take = Math.min(max, remaining - min);
    }

    if (take < min || take > max) {
      const count = Math.max(2, Math.ceil(remaining / max));
      const width = remaining / count;
      for (let i = 0; i < count; i += 1) panels.push(width);
      remaining = 0;
      break;
    }

    panels.push(take);
    remaining -= take;
  }

  if (remaining > 1e-9) panels.push(remaining);
  return panels.map(value => Math.round(value * 1000) / 1000);
}

export function packStockBars(pieceLengths, stockLength = 6) {
  const stock = Math.max(0.1, clamp(stockLength));
  const pieces = pieceLengths
    .map(value => clamp(value))
    .filter(value => value > 0)
    .sort((a, b) => b - a);

  const bins = [];
  for (const piece of pieces) {
    if (piece > stock + 1e-9) {
      const full = Math.floor(piece / stock);
      for (let i = 0; i < full; i += 1) bins.push(0);
      const rem = piece - full * stock;
      if (rem > 1e-9) bins.push(stock - rem);
      continue;
    }

    let bestIndex = -1;
    let bestRemainder = Infinity;
    for (let i = 0; i < bins.length; i += 1) {
      if (bins[i] + 1e-9 >= piece && bins[i] - piece < bestRemainder) {
        bestIndex = i;
        bestRemainder = bins[i] - piece;
      }
    }

    if (bestIndex === -1) bins.push(stock - piece);
    else bins[bestIndex] -= piece;
  }

  return {
    bars: bins.length,
    unused: bins.reduce((sum, value) => sum + value, 0),
    used: pieces.reduce((sum, value) => sum + value, 0)
  };
}

export function calculateSteelFrame(input) {
  const length = clamp(input.length);
  const height = clamp(input.height || 2.6);
  const area = netWallArea(input);
  const spacing = Math.max(0.3, clamp(input.studSpacing || 0.4));
  const openingCount = Math.round(clamp(input.openingCount || 0));
  const openingWidthTotal = Math.min(length, clamp(input.openingWidthTotal || 0));
  const preferredPanel = Math.min(4, Math.max(2, clamp(input.panelPreferred || 3)));
  const stockLength = Math.max(3, clamp(input.profileLength || 6));
  const f = factor(input.wastePercent ?? 7);

  const panels = panelizeSteelFrame(length, preferredPanel, 2, 4);
  const baseStuds = ceil(length / spacing) + 1;
  const jambReinforcement = openingCount * 2;
  const totalFullHeightStuds = baseStuds + jambReinforcement;

  const pgcPieces = Array.from({ length: totalFullHeightStuds }, () => height);
  if (openingCount > 0 && openingWidthTotal > 0) {
    const averageOpeningWidth = openingWidthTotal / openingCount;
    for (let i = 0; i < openingCount; i += 1) {
      pgcPieces.push(averageOpeningWidth, averageOpeningWidth);
    }
  }

  const pguPieces = panels.flatMap(width => [width, width]);
  const pgcPacking = packStockBars(pgcPieces, stockLength);
  const pguPacking = packStockBars(pguPieces, stockLength);
  const pgcBars = ceil(pgcPacking.bars * f);
  const pguBars = ceil(pguPacking.bars * f);

  const items = [
    item('steelStud90', pgcBars),
    item('steelTrack90', pguBars),
    item('steelFrameScrew', ceil((totalFullHeightStuds * 4 + openingCount * 8) * f)),
    item('anchor', ceil((length / 0.6 + 1) * f))
  ];

  if (input.includeOsb !== false) {
    items.push(item('osbBoard', ceil(area * f / (1.22 * 2.44))));
    items.push(item('weatherBarrier', ceil(area * f / 75)));
    items.push(item('osbScrew', ceil(area * 18 * f)));
  }
  if (input.includeDrywall !== false) {
    items.push(item('drywallBoard', ceil(area * f / 2.88)));
    items.push(item('drywallScrew', ceil(area * 18 * f)));
    items.push(item('jointTape', ceil((area * 1.15) / 90)));
    items.push(item('jointCompound', ceil((area * 0.45) / 18)));
  }
  if (input.includeInsulation !== false) {
    items.push(item('insulationRoll', ceil(area * f / 12)));
  }

  return {
    title: 'Pared Steel Frame',
    metrics: [
      ['Superficie neta de muro', area, 'm²'],
      ['Paneles propuestos', panels.length, 'u'],
      ['Barras PGC optimizadas', pgcBars, 'u'],
      ['Barras PGU optimizadas', pguBars, 'u']
    ],
    items,
    assumptions: [
      `Panelización comercial: ${panels.map(value => `${value.toFixed(2)} m`).join(' + ')}. Preferencia 3 m, mínimo 2 m y máximo 4 m cuando la geometría lo permite.`,
      `Perfiles comerciales de ${stockLength.toFixed(2)} m agrupados con un empaquetado de cortes tipo best-fit. No contempla kerf ni restricciones de taller específicas.`,
      'Las aberturas suman refuerzo de jambas y travesaños de estimación. Dinteles estructurales, cargas, anclajes, rigidización y encuentros L/T deben dimensionarse según proyecto y normativa.',
      'Configuración base: PGC/PGU 90 mm, OSB exterior, placa de yeso interior, membrana hidrófuga y aislación.'
    ]
  };
}

export const CALCULATORS = {
  wetWall: calculateWetWall,
  drywall: calculateDrywall,
  steelFrame: calculateSteelFrame,
  ceiling: calculateCeiling,
  fence: calculateFence,
  counterfloor: calculateCounterfloor,
  pool: calculatePool
};
