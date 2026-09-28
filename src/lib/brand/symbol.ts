/**
 * Símbolo WHOISCLEBS: bloco de terminal 16×16 com um C em espaço negativo (traço de 3 células)
 * e um cursor sublinhado de 4×2 logo depois — "C_", o prompt esperando o próximo comando.
 * Fonte única: o header usa este path inline e `scripts/build-brand.mjs` gera `static/brand/*` a
 * partir dele.
 * `fill-rule="evenodd"`: quadrado cheio menos o C e o cursor.
 */
export const SYMBOL_VIEWBOX = '0 0 16 16'
export const SYMBOL_PATH = 'M0 0H16V16H0Z M2 2V11H11V8H5V5H11V2Z M10 12V14H14V12Z'
