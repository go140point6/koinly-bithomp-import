const fs = require('fs');
const { parse } = require('csv-parse');

async function findAddresses(inputFile) {
    return new Promise((resolve, reject) => {
        fs.readFile(inputFile, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err)
                return reject(err)
            }

            // Remove BOM if present
            if (data.charCodeAt(0) === 0xFEFF) {
                data = data.slice(1)
            }

            const addresses = new Set()

            parse(data, { columns: true, skip_empty_lines: true }, (err, records) => {
                if (err) {
                    console.error('Error parsing CSV:', err)
                    return reject(err)
                }

                records.forEach((row) => {
                    if (row.Address) {
                        addresses.add(row.Address.trim())
                    }
                })

                console.log(`✅ Found ${addresses.size} unique addresses.\n`)

                resolve(Array.from(addresses)); // Resolve the Promise with addresses array
            })
        })
    })
}

module.exports = {
    findAddresses
}

