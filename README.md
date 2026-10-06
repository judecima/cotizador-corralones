# Cotizador Corralones

MVP web para estimar materiales y costos de obras habituales de corralón.

## Módulos incluidos

- Pared húmeda: ladrillos, mortero y revoque opcional.
- Pared seca: placas, montantes, soleras, tornillos, cinta, masilla y aislación opcional.
- Cielorraso: placas, perfiles, ángulo perimetral, suspensiones y terminación.
- Cerco: tejido, postes, tensores, alambre y hormigón de bases.
- Contrapiso: cemento, arena y piedra partida.
- Pileta de mampostería: excavación de referencia, base, bloques, impermeabilización y revestimiento.
- Steel Frame: panelización de paredes, PGC/PGU, OSB, yeso, aislación, membrana y optimización básica de perfiles de 6 m.

Los cálculos con cemento usan **bolsas comerciales de 25 kg**.

Además permite:

- editar precios unitarios por material;
- guardar proyectos en `localStorage`;
- reabrir proyectos guardados;
- exportar el cómputo a CSV;
- imprimir el presupuesto;
- usar la aplicación sin backend ni servicios externos.

## Probar localmente

No tiene dependencias de npm. Solo necesita un servidor estático para que funcionen los módulos ES.

Con Python:

```bash
python -m http.server 4173
```

Luego abrir:

```text
http://localhost:4173
```

## Tests

Requiere Node.js 18+.

```bash
npm test
npm run check
```

## Arquitectura

- `src/calculators.js`: reglas de cálculo puras y testeables.
- `src/catalog.js`: catálogo lógico de materiales.
- `src/app.js`: interfaz, precios, persistencia local y exportación.
- `tests/calculators.test.mjs`: pruebas del motor de cantidades.

## Alcance y advertencias

Esta versión es un **estimador comercial**, no un software de cálculo estructural. Las dosificaciones, modulaciones y rendimientos son supuestos iniciales que deben parametrizarse con los sistemas constructivos y productos reales del corralón antes de uso productivo.

En particular, la pileta no dimensiona estructura, hierro, hidráulica, bomba, filtro ni requerimientos de suelo. El módulo Steel Frame es un cómputo comercial: no sustituye cálculo estructural ni dimensionamiento de dinteles, anclajes, rigidización o cargas.

## Próximos hitos sugeridos

1. Catálogo real de Corrales con SKU, precio, presentación y stock.
2. Reglas constructivas configurables desde un panel administrador.
3. Presupuesto persistente en backend y generación de PDF.
4. Múltiples ambientes/tramos dentro de un mismo proyecto.
5. Importación o medición desde plano PDF.
6. Evolucionar Steel Frame a aberturas detalladas, encuentros L/T, rigidización, techos y entrepisos.
