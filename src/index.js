// Import image reader.
let parse = require('image-pixels')

/**
 * Parse image and generate data.
 * 
 * See README for more information regarding these parameters (Section: Result structure).
 * 
 * @param {string} [type] rgba, rgb, hexa, hex.
 * @param {string} [order] forwards, backwards.
 * @param {boolean} [raw]
 * @param {booleam} [stats]
 * @param {booleam} [blanks]
 * @param {booleam} [lumina]
 * @param {booleam} [dimentions]
 * @param {number} [limit] 1-inf.
 * @param {number} [occurrences] 1-inf.
 * @example new Imager({...})
 */
class Imager {
    constructor({ type, order, raw, stats, blanks, lumina, dimentions, limit, occurrences } = {}) {

        // Processing time.
        this.duration = new Date()

        // Returned result.
        this.result = { data: [] }

        // Pixel storage.
        this.counter = new Map()

        // Parameter options.
        this.options = {
            type: type || 'rgba',
            order: order || 'forwards',
            raw: raw || false,
            stats: stats || false,
            blanks: blanks || false,
            lumina: lumina || false,
            dimentions: dimentions || false,
            limit: limit || 3,
            occurrences: occurrences || 0
        }
    }

    /**
     * Generate image data with passed parameters.
     * 
     * 
     * @param {string} [file] The path to your file. 
     * @example new Imager({...}).load("./")
     */
    load = file => new Promise(async (resolve, reject) => {
        try {

            // Get file data.
            this.parsed = await parse(file)
            this.raw = []

            // Set stats for image (Will be deleted afterwards if <Options>.stats is false).
            this.result.bytes = {
                formatted: this.utility.bytify(this.parsed.data.length * 8),
                raw: this.parsed.data.length * 8
            }

            // Loop and load data.
            for (let i = 0; i < this.parsed.data.length; i += 4) {
                const query = `${this.parsed.data[i]},${this.parsed.data[i + 1]},${this.parsed.data[i + 2]},${this.parsed.data[i + 3]}`
                if (this.options.raw) this.raw.push([this.parsed.data[i], this.parsed.data[i + 1], this.parsed.data[i + 2], this.parsed.data[i + 3]])
                let fetch = this.counter.get(query)
                this.counter.set(query, fetch ? ++fetch : 1)
            }

            // Handle <Options>.order.
            this.counter = new Map([...this.counter.entries()].sort((a, b) => this.options.order === 'forwards' ? b[1] - a[1] : a[1] - b[1]))

            // Handle <Options>.stats.
            if (this.options.stats) this.result.total = this.counter.size

            // Handle <Options>.occurrences.
            if (typeof this.options.occurrences === 'number') this.counter = new Map([...this.counter.entries()].filter(a => a[1] > this.options.occurrences))
            else if (this.options.occurrences.match(/^[1-9]?[0-9]\.[0-9]{2}%|100\.00%/g)?.some(e => e)) this.counter = new Map([...this.counter.entries()].filter(a => `${((a[1] * 100) / (this.parsed.data.length / 4)).toFixed(2)}%` > this.options.occurrences))
            if (this.options.occurrences && typeof this.options.occurrences !== 'number' && !this.options.occurrences.match(/^[1-9]?[0-9]\.[0-9]{2}%|100\.00%/g)?.some(e => e)) throw new Error('Invalid format for occurance limit, please use: >0 (Number) or [0.00%-100.00%] (String)')

            // Handle <Options>.type.
            let i = this.options.limit
            for (let key of [...this.counter.keys()]) {
                i--
                if (i >= 0) {
                    // Handle <Options>.blanks.
                    if (this.options.blanks && key === '0,0,0,0') {
                        i++
                        continue
                    }
                    const set = { value: null, luminous: false, occurrence: '0.00%', count: 0 }
                    switch (this.options.type) {
                        case 'hexa': {
                            const alphaify = alpha => Math.round(alpha / 100 * 255).toString(16).padStart(2, '0').toUpperCase()
                            const rgba = key.split(',')
                            set.value = `#${this.utility.hexify(rgba.slice(0, -1))}${alphaify((parseInt(rgba[3]) * 100) / 255)}`.toUpperCase()
                            break
                        }
                        case 'hex': {
                            set.value = `#${this.utility.hexify(key.split(',').slice(0, -1))}`.toUpperCase()
                            break
                        }
                        case 'rgb': {
                            set.value = key.split(',').slice(0, -1).map(n => parseInt(n))
                            break
                        }
                        default: {
                            set.value = key.split(',').map(n => parseInt(n))
                            set.value[3] /= 255
                            break
                        }
                    }

                    // Handle <Options>.lumia.
                    if (!this.options.lumina) delete set.luminous
                    else set.luminous = this.utility.luminosity(...key.split(',').slice(0, -1).map(n => parseInt(n)))

                    // Handle <Options>.stats.
                    if (!this.options.stats) delete set.count
                    else set.count = this.counter.get(key)

                    set.occurrence = `${((this.counter.get(key) * 100) / (this.parsed.data.length / 4)).toFixed(2)}%`
                    this.result.data.push(set)
                }
            }

            // Handle <Options>.raw.
            if (this.options.raw) {
                for (let i = 0; i < this.raw.length; i++) {
                    switch (this.options.type) {
                        case 'hexa': {
                            const alphaify = alpha => Math.round(alpha / 100 * 255).toString(16).padStart(2, '0').toUpperCase()
                            this.raw[i] = `#${this.utility.hexify(this.raw[i].slice(0, -1))}${alphaify((this.raw[i][3] * 100) / 255)}`.toUpperCase()
                            break
                        }
                        case 'hex': {
                            this.raw[i] = `#${this.utility.hexify(this.raw[i].slice(0, -1))}`.toUpperCase()
                            break
                        }
                        case 'rgb': {
                            this.raw[i] = this.raw[i].slice(0, -1).map(n => parseInt(n))
                            break
                        }
                        default: {
                            this.raw[i][3] /= 255
                            break
                        }
                    }
                }

                this.result.raw = this.raw
            }

            // Handle <Options>.dimentions.
            if (this.options.dimentions) {
                this.result.width = this.parsed.width
                this.result.height = this.parsed.height
            }

            // Handle <Options>.stats.
            if (this.options.stats) {
                this.result.ping = new Date() - this.duration
                this.result.options = this.options
            } else delete this.result.bytes

            resolve(this.result)
        } catch (error) { reject(error) }
    })

    // Utility functions for Imager.
    utility = {

        // Convert RGB to HEX.
        hexify: params => params.map(val => {
            const hex = parseInt(val).toString(16)
            return hex.length == 1 ? `0${hex}` : hex
        }).join(''),

        // Check if given pixel is relatively light or dark.
        luminosity: (r, g, b, hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b))) => hsp > 127.5,

        // Convert raw bytes to formatted bytes.
        bytify: raw => {
            if (raw >= 1000000000) return `${(raw / 1000000000).toFixed(2)}GB`
            else if (raw >= 1000000) return `${(raw / 1000000).toFixed(2)}MB`
            else if (raw >= 1000) return `${(raw / 1000).toFixed(2)}KB`
            else if (raw == 1) return `${raw} byte`
            else return `${raw} bytes`
        }
    }
}

// Export module.
module.exports = Imager
module.exports.Imager = Imager
