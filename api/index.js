// Import modules & declare globals.
const express = require('express')
const busboy = require('busboy')
const generate = require('./generate.js')
const { join } = require('path')
const { createWriteStream, readFileSync } = require('fs')
const $PORT = 3000

// Make server.
express()

    // Allow serving of files in the /public directory.
    .use(express.static('public'))

    // Serve the default page for the root path.
    .get('/', (_, res) => res.status(200).sendFile(join(__dirname, 'public', 'index.html')))

    // Get a file from a path (Used internally).
    .get('/:path/:id', (req, res) => {
        try {
            if (!req.params.path || !req.params.id) res.status(404).send()
            res.sendFile(join(__dirname, req.params.path, req.params.id))
        } catch (e) {
            res.status(404).send(e)
        }
    })

    // Posts image from root path when uploaded.
    .post('/upload', (req, res) => {
        const parser = busboy({ headers: req.headers })
        let name
        let $ID
        let duration = new Date()

        // Load file to /uploads directory.
        parser.on('file', (_, file, data) => {
            name = data.filename
            file.pipe(createWriteStream(join(__dirname, 'uploads/' + data.filename)))
        })

        // Generate HTML page with modified fields.
        parser.on('finish', _ => {
            generate(`./uploads/${name}`).then(async result => {
                $ID = result.id
                res.writeHead(200, { 'Connection': 'close' })
                let file = readFileSync('./public/uploaded.html', 'utf8')
                file = file
                    .replace(/{FILE_NAME}/g, name)
                    .replace(/{DIMENSIONS}/g, `${result.width}x${result.height} [${ratio(result.width, result.height)}]`)
                    .replace(/{DATA_SIZE}/g, result.bytes.formatted)
                    .replace(/{TOTAL_COLORS}/g, result.total.toLocaleString())
                    .replace(/{PIXEL_SIZE}/g, result.raw.length.toLocaleString())
                    .replace(/{LUMINOUS}/g, lumify(result.data))
                    .replace(/{PROCESSING}/g, `${result.ping.toLocaleString()}ms`)
                    .replace(/{GENERATING}/g, `${(new Date() - duration).toLocaleString()}ms`)
                    .replace(/{SOURCE_IMG}/g, `../uploads/${name}`)
                    .replace(/<!-- {CELLS} -->/g, divify(result.data))
                    .replace(/{UNIQUE_ID}/g, $ID)

                res.end(file)
            })
        })

        return req.pipe(parser)
    })
    .listen($PORT, _ => console.log(`Running on port: ${$PORT}`))


// UTILITY FUNCTIONS.

function ratio(w, h,) {
    const gcd = (a, b) => b ? gcd(b, a % b) : a
    const divisor = gcd(w, h)
    return `${(w / divisor) % 1 ? (w / divisor).toFixed(2) : w / divisor}:${(h / divisor) % 1 ? (h / divisor).toFixed(2) : h / divisor}`
}

function divify(data) {
    const hexify = params => params.map(val => {
        const hex = parseInt(val).toString(16)
        return hex.length == 1 ? `0${hex}` : hex
    }).join('')
    const alphaify = alpha => Math.round(alpha / 100 * 255).toString(16).padStart(2, '0').toUpperCase()
    const result = []

    for (let set of data) {
        set.hexa = `#${hexify(set.value.slice(0, -1))}${alphaify(((set.value[3] * 255) * 100) / 255)}`.toUpperCase()
        result.push(`<div id="${set.value.join('-')}" luminous="${set.luminous}"  style="background: rgba(${set.value.join(', ')})" onclick="notify('${set.value.join('-')}')" hexa="${set.hexa}"><div class="overlay"><h6> ${set.hexa} </h6><h6> rgba(${set.value.join(', ')}) </h6></div></div>`)
    }

    return result.join('')
}

function lumify(data) {
    let trueCount = 0
    let falseCount = 0

    for (let set of data) set.luminous ? trueCount++ : falseCount++
    return trueCount > falseCount ? "Light" : "Dark"
}
