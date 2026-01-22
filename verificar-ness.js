// Verificar la transformación de fonts
const styled = "αႦƈԃҽϝɠԋιʝƙʅɱɳσρϙɾʂƚυʋɯxყȥ"

function toStyled(text) {
  const normal = "abcdefghijklmnopqrstuvwxyz"
  return text.toLowerCase().split('').map(char => {
    let i = normal.indexOf(char)
    return i !== -1 ? styled[i] : char
  }).join('')
}

console.log("MayBot: MαყBσƚ")
console.log("Transformación de 'nessmd':", toStyled("nessmd"))
console.log("\nCaracteres individuales de 'ness':")
console.log("n →", toStyled("n"))
console.log("e →", toStyled("e"))
console.log("s →", toStyled("s"))
console.log("s →", toStyled("s"))
console.log("m →", toStyled("m"))
console.log("d →", toStyled("d"))

console.log("\nResultado: NessMD estilizado =", toStyled("nessmd"))
