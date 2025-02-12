const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');
const { getFilenameTimestamp } = require('../utils/granularDate');
const { createDirectoryIfNotExists } = require('../utils/createDirectory');
const { sanitizeMemo } = require('../utils/sanitizeMemo');
 

async function parseBithompFile(inputFile, options, sharedArrays) {
    const outputPath = path.join(__dirname, '../output')
    createDirectoryIfNotExists(outputPath)
    const currentDate = getFilenameTimestamp()

    fs.readFile(inputFile, 'utf8', (err, data) => {
        if (err) throw err

        // Remove BOM if present
        if (data.charCodeAt(0) === 0xFEFF) {
            data = data.slice(1)
        }

        // Sanitize .csv inputs
        const rows = data.split('\n').map((row, rowNumber) => {
            const columns = row.split('","'); // Split by "," while keeping quoted fields intact
        
            // Ensure this row has enough columns (skip headers and invalid rows)
            if (columns.length > 20) {
                let memoField = columns[20]

                columns[20] = sanitizeMemo(memoField, rowNumber)
            }
        
            // Check column count after reassembling the row
            const reassembledRow = columns.join('","') // Reassemble the row        
            return reassembledRow
        })
        
        // Rejoin rows into a single CSV string
        const sanitizedData = rows.join('\n')
        
        // Parse the CSV file only once
        parse(sanitizedData, { 
            columns: true, 
            skip_empty_lines: true, 
            trim: true, 
            relax_quotes: true, 
            relax_column_count: true, // Allows rows with unexpected column counts
            escape: '\\',             // Handles potential escape sequences
            delimiter: ',',           // Ensure correct field splitting
        }, (err, records) => {
            if (err) {
                console.error('Error parsing CSV:', err.message)
                return; // Handle the error gracefully
            }

            console.log(`\u2705 Successfully parsed ${records.length} records.`)

            // Extract unique addresses if necessary
            let addresses = []
            if (options.file === 'PER') {
                addresses = Array.from(new Set(records.map(row => row.Address?.trim()).filter(Boolean)))
                
                console.log(`\u2705 Found ${addresses.length} unique addresses.`)
            }

            const headers = [
                'Date', 'Sent Amount', 'Sent Currency', 'Received Amount', 'Received Currency',
                'Net Worth Amount', 'Net Worth Currency', 'Label', 'Description', 'TxHash'
            ];

            if (options.file === 'PER') {
                // Create separate files for each address
                addresses.forEach(address => {
                    const outputFile = `${options.ledger}-${address}-${currentDate}.csv`
                    const outputFilePath = path.join(outputPath, outputFile)

                    const filteredData = records
                        .filter(row => row.Address?.trim() === address)
                        .map(row => formatRow(row, options, sharedArrays))
                        .filter(row => row !== null) // Ensure we only keep non-null rows

                    writeCSV(outputFilePath, headers, filteredData)
                });
            } else {
                // Single output file
                const outputFile = `${options.ledger}-koinlyimport-${currentDate}.csv`
                const outputFilePath = path.join(outputPath, outputFile)

                const formattedData = records
                    .map(row => formatRow(row, options, sharedArrays))
                    .filter(row => row !== null); // Ensure we only keep non-null rows

                writeCSV(outputFilePath, headers, formattedData)
            }
        });
    });
}

function formatRow(row, options, sharedArrays) {
    const date = new Date(row['Timestamp ISO']).toISOString()
    let sentAmount = '', receivedAmount = ''
    let sentCurrency = '', receivedCurrency = ''

    const amount = parseFloat(row.Amount) || 0
    const currencyIssuer = row['Currency issuer'] || null
    const netWorthAmount = row['USD Amount equavalent'] !== '' ? parseFloat(row['USD Amount equavalent']) : null
    const netWorthCurrency = netWorthAmount !== null ? 'USD' : ''
    const description = row.Memo || ''
    const txHash = row.Tx

    if (amount < 0) {
        sentAmount = Math.abs(amount)
        sentCurrency = row.Currency
    } else if (amount > 0) {
        receivedAmount = amount
        receivedCurrency = row.Currency
    }

    // Get rid of dust transactions of XRP/XAH, plus a special case of EVR on the XAHL side)
    if ((row.Currency === options.ledger || currencyIssuer === 'rEvernodee8dJLaFsujS6q1EiXvZYmHXr8') && netWorthAmount !== null && Math.abs(netWorthAmount) < 0.01) {
        return null
    }

    // Second special case for EVR
    if (currencyIssuer === 'rEvernodee8dJLaFsujS6q1EiXvZYmHXr8' && (receivedAmount === 0.05 || sentAmount === 0.05)) {
        return null
    }

    const customTokensTable = sharedArrays.support[options.ledger === 'XAH' ? 'xahlCustomTokens' : 'xrplCustomTokens']

    if (!(row.Currency === options.ledger && currencyIssuer === null)) {
        const token = customTokensTable.find(myCustomTokensRow =>
                myCustomTokensRow.counterparty === currencyIssuer &&
                myCustomTokensRow.currency.trim() === row.Currency.trim()
            )

            if (token) {
                if (amount < 0) {
                    sentCurrency = token.koinlyid
                    receivedCurrency = null
                } else if (amount > 0) {
                    sentCurrency = null
                    receivedCurrency = token.koinlyid
                }
            } else {
                console.error(`\u274C KoinlyID NOT FOUND for ${options.ledger} ledger entry: ${row['Amount as Text']} on line ${row['#']}.`)
                process.exit(1)
            }
        }

    return [date, sentAmount, sentCurrency, receivedAmount, receivedCurrency, netWorthAmount, netWorthCurrency, '', description, txHash]
}

function writeCSV(outputFilePath, headers, data) {
    stringify([headers, ...data], (err, output) => {
        if (err) throw err
        fs.writeFile(outputFilePath, output, 'utf8', err => {
            if (err) throw err
            console.log(`\u2705 Formatted CSV written to ${outputFilePath}`)
        })
    })
}

module.exports = {
    parseBithompFile
};