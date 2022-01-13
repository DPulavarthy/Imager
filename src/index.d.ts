export default interface Imager {
    duration: Date
    result: {
        data: object[]
        width?: number
        height?: number
        total?: number
        raw?: string[] | number[][]
        ping?: number
        bytes?: {
            formatted: string
            raw: number
        }
        options?: {
            type: string
            order: string
            raw: boolean
            stats: boolean
            blanks: boolean
            lumina: boolean
            dimentions: boolean
            limit: number | string
            occurrences: number
        }
    }
    counter: Map<string, number>
    options: {
        type: string
        order: string
        raw: boolean
        stats: boolean
        blanks: boolean
        lumina: boolean
        dimentions: boolean
        limit: number | string
        occurrences: number
    }
}

/**
 * Parse image and generate data.
 * 
 * See README for more information regarding these parameters.
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
export class Imager {

    /**
     * Generate image data with passed parameters.
     * 
     * 
     * @param {string} [file] The path to your file. 
     * @example new Imager({...}).load("./")
     */
    load(file: string): object

    // Utility functions for Imager.
    utility: {

        // Convert RGB to HEX.
        hexify(params: string[]): string

        // Check if given pixel is relatively light or dark.
        luminosity(r: number, g: number, b: number, hsp?: Function): boolean

        // Convert raw bytes to formatted bytes.
        bytify(raw: number): string
    }
}
