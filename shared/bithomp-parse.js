const fs = require('fs');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');
const path = require('path');
const { getFilenameTimestamp } = require('../utils/granularDate');
const { createDirectoryIfNotExists } = require('../utils/createDirectory');
const { findAddresses } = require('./findAddresses');

async function parseBithompFile(inputFile,options,sharedArrays) {

    const outputPath = path.join(__dirname, '../output')
    createDirectoryIfNotExists(outputPath)
    const currentDate = getFilenameTimestamp()

    let addresses = []

    if (options.file === 'PER') {
        console.log("You want each address found in your bithomp .csv to be separate files:")
        try {
            addresses = await findAddresses(inputFile)
        } catch (error) {
            console.error('Failed to extract addresses: ', error)
            return
        }
    } else {
        var outputFile = `${options.ledger}-koinlyimport-${currentDate}.csv`  
    }

    fs.readFile(inputFile, 'utf8', (err, data) => {
        if (err) throw err

        // Remove BOM if present
        if (data.charCodeAt(0) === 0xFEFF) {
            data = data.slice(1)
        }

        parse(data, { columns: true, skip_empty_lines: true, trim: true, relax_quotes: true }, (err, records) => {
            if (err) throw err

            const headers = [
                'Date', 'Sent Amount', 'Sent Currency', 'Received Amount', 'Received Currency',
                'Net Worth Amount', 'Net Worth Currency', 'Label', 'Description', 'TxHash'
            ]

            if (options.file === 'PER') {
                // Iterate over each unique address and create separate files
                addresses.forEach((address) => {
                    const outputFile = `${options.ledger}-${address}-${currentDate}.csv`
                    const outputFilePath = path.join(outputPath, outputFile)

                    const filteredData = records
                        .filter(row => row.Address && row.Address.trim() === address)
                        .map(row => formatRow(row, options, sharedArrays))
                        .filter(row => row !== null)  // Ensure we only keep non-null rows

                    writeCSV(outputFilePath, headers, filteredData)
                })

            } else {
                // Single output file
                const outputFilePath = path.join(outputPath, outputFile)
                const formattedData = records
                    .map(row => formatRow(row, options, sharedArrays))
                    .filter(row => row !== null)  // Ensure we only keep non-null rows
                writeCSV(outputFilePath, headers, formattedData)
            }
        })
    })
}

function formatRow(row, options, sharedArrays) {
    const date = new Date(row['Timestamp ISO']).toISOString()
    let sentAmount = '', receivedAmount = ''
    let sentCurrency = '', receivedCurrency = ''
    
    // Determine sent/received amounts based on direction
    if (row.Direction === 'sent') {
        sentAmount = parseFloat(row.Amount)
        sentCurrency = row.Currency
        receivedCurrency = null // needs to be null for koinlyID check
    } else if (row.Direction === 'received') {
        receivedAmount = parseFloat(row.Amount)
        receivedCurrency = row.Currency
        sentCurrency = null // needs to be null for koinlyID check
    } else if (row.Direction === 'dex') {
        const amount = parseFloat(row.Amount)
        if (amount < 0) {
            sentAmount = Math.abs(amount)
            sentCurrency = row.Currency
        } else {
            receivedAmount = amount
            receivedCurrency = row.Currency
        }
    }
    const currencyIssuer = row['Currency issuer'] || null
    const netWorthAmount = row['USD Amount equavalent'] ? parseFloat(row['USD Amount equavalent']) : null
    const netWorthCurrency = netWorthAmount ? 'USD' : ''
    const description = row.Memo || ''
    const txHash = row.Tx
    // What about Issuer Fee and Tx fee? Don't care, currency A sent = currency B receive is all I need.
    // If A and B are 1:1, and I sent 100 A and get 50 B, that's the cost basis... that half of it went to fee is immaterial.

    // Filter based on USD value for any transactions being to small to matter tax-wise
    if (netWorthAmount !== null && !isNaN(netWorthAmount) && Math.abs(netWorthAmount) <= 0.004) {
        return null;  // Skip this row if USD value is too low
    }

    // Handle Koinly IDs
    if (options.ledger === 'XRP') {
        if (!(row.Currency === 'XRP' && currencyIssuer === null)) {
            const token = sharedArrays.support.xrplCustomTokens.find((myCustomTokensRow) => {
                return myCustomTokensRow.counterparty === currencyIssuer && myCustomTokensRow.currency.trim() === row.Currency.trim()
            })

            if (token) {
                if (row.Direction === 'sent') {
                    sentCurrency = token.koinlyid
                } else if (row.Direction === 'received') {
                    receivedCurrency = token.koinlyid
                } else if (row.Direction === 'dex') {
                    // For dex: negative amounts are treated as sent, positive as received.
                    if (sentAmount < 0) {
                        sentCurrency = token.koinlyid
                    } else {
                        receivedCurrency = token.koinlyid
                    }
                }
            } else {
                console.log(`KoinlyID NOT FOUND for ledger ${ledger} entry: ${row['Amount as Text']} on line ${row['#']}.`)
                process.exit(1)
            }
        }
    }

    if (options.ledger === 'XAH') {
        if (!(row.Currency === 'XAH' && currencyIssuer === null)) {
            const token = sharedArrays.support.xahlCustomTokens.find((myCustomTokensRow) => {
                return myCustomTokensRow.counterparty === currencyIssuer && myCustomTokensRow.currency.trim() === row.Currency.trim()
            })

            if (token) {
                sentCurrency = row.Direction === 'sent' ? token.koinlyid : ''
                receivedCurrency = row.Direction === 'received' ? token.koinlyid : ''
            } else {
                console.log(`KoinlyID NOT FOUND for ledger ${ledger} entry: ${row['Amount as Text']} on line ${row['#']}.`)
                process.exit(1)
            }
        }
    }

    return [date, sentAmount, sentCurrency, receivedAmount, receivedCurrency, netWorthAmount, netWorthCurrency, '', description, txHash]
}

function writeCSV(outputFilePath, headers, data) {
    stringify([headers, ...data], (err, output) => {
        if (err) throw err
        fs.writeFile(outputFilePath, output, 'utf8', err => {
            if (err) throw err
            console.log(`✅ Formatted CSV written to ${outputFilePath}`)
        })
    })
}

module.exports = {
    parseBithompFile
}