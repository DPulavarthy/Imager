(async _ => {
    const Imager = require('#imager')
    // const { Imager } = require('#imager')

    let result = await new Imager({
        type: 'hexa',
        order: 'forwards',
        raw: true,
        stats: true,
        blanks: false,
        lumina: true,
        dimentions: true,
        limit: 4,
        occurrences: 10
    }).load('./src/jonin.png')
    console.log('Result with options', '=>', result)

    result = await new Imager().load("./src/jonin.png")
    console.log('Base result (No options)', '=>', result)
})()
