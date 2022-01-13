// Import modules.
const Imager = require('#imager')
const { createCanvas } = require('canvas')
const { writeFileSync, mkdirSync } = require('fs')

// Random ID generator function.
const randomID = (sections, phrase, join, random = a => a[Math.floor(Math.random() * a.length)]) => [...Array(sections)].map(_ => [...Array(phrase)].map(_ => random([...[...Array(26)].map((_, i) => String.fromCharCode(i + 65)), ...[...Array(26)].map((_, i) => String.fromCharCode(i + 65).toLowerCase()), ...[...Array(10).keys()]])).join('')).join(join ?? '-')

// Define globals.
let $ID
let $DIMENTIONS = { width: 0, height: 0 }
let $DATA = []
const limit = 10

// Get image info and generate multiple images.
module.exports = file => new Promise(async (resolve, reject) => {
    try {

        // Generate a random path.
        $ID = randomID(5, 5)

        // Get image data.
        const result = await new Imager({ dimentions: true, raw: true, blanks: true, stats: true, lumina: true, limit }).load(file)

        // Set globals.
        $DIMENTIONS = { width: result.width, height: result.height }
        $DATA = result.raw

        // Make new path.
        mkdirSync($ID)

        // Create files.
        result.data.map(set => generate(set.value, set.value.join('-')))

        // Reset globals.
        $DATA = []
        $DIMENTIONS = { width: 0, height: 0 }

        // Return new data.
        resolve({ ...result, ...{ id: $ID } })
    } catch (e) {
        reject(e)
    }
})

// Function to generate new images with only one color.
function generate(highlight, name) {
    const canvas = createCanvas($DIMENTIONS.width, $DIMENTIONS.height)
    const ctx = canvas.getContext('2d')

    let column = 0
    let row = 0

    for (let i = 0; i < $DATA.length; i++) {
        if ($DATA[i][3] !== 0 && (!highlight || $DATA[i].toString() === highlight?.toString())) {
            ctx.fillStyle = `rgba(${$DATA[i].join(', ')})`
            ctx.fillRect(column, row, 1, 1)
        }
        if (column === $DIMENTIONS.width - 1) {
            column = 0
            row++
            continue
        }
        column++
    }

    writeFileSync(`./${$ID}/${name}.png`, canvas.toBuffer())
}
