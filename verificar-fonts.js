// Verificar los caracteres exactos que usa MayBot
const maybot = "MαყBσƚ"
console.log("MayBot:", maybot)
console.log("Chars:", Array.from(maybot).map(c => `${c} (U+${c.charCodeAt(0).toString(16).toUpperCase()})`).join(', '))

// Intentar crear NessMD con el mismo estilo
// M = M
// a = α
// y = ყ
// B = B
// o = σ
// t = ƚ

const nessmd = "NαყʂMƊ"
console.log("\nNessMD:", nessmd)
console.log("Chars:", Array.from(nessmd).map(c => `${c} (U+${c.charCodeAt(0).toString(16).toUpperCase()})`).join(', '))

// Comparación
console.log("\nComparación:")
console.log("MαყBσƚ (MayBot)")
console.log("NαყʂMƊ (NessMD propuesta)")
