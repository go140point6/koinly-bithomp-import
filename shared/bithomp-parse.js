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
                'Fee Amount', 'Fee Currency', 'Net Worth Amount', 'Net Worth Currency', 'Label', 'Description', 'TxHash'
            ]

            if (options.file === 'PER') {
                // Iterate over each unique address and create separate files
                addresses.forEach((address) => {
                    const outputFile = `${options.ledger}-${address}-${currentDate}.csv`
                    const outputFilePath = path.join(outputPath, outputFile)

                    const filteredData = records
                        .filter(row => row.Address && row.Address.trim() === address)
                        .map(row => formatRow(row, options, sharedArrays))

                    writeCSV(outputFilePath, headers, filteredData)
                })

            } else {
                // Single output file
                const outputFilePath = path.join(outputPath, outputFile)
                const formattedData = records.map(row => formatRow(row, options, sharedArrays))
                writeCSV(outputFilePath, headers, formattedData)
            }
        })
    })
}

function formatRow(row, options, sharedArrays) {
    const date = new Date(row['Timestamp ISO']).toISOString()
    const sentAmount = row.Direction === 'sent' ? row.Amount : ''
    let sentCurrency = row.Direction === 'sent' ? row.Currency : ''
    const receivedAmount = row.Direction === 'received' ? row.Amount : ''
    let receivedCurrency = row.Direction === 'received' ? row.Currency : ''
    const currencyIssuer = row['Currency issuer'] || null
    const feeAmount = row['Tx fee'] || ''
    const feeCurrency = feeAmount ? row['Tx fee currency'] : ''
    const netWorthAmount = row['USD Amount equavalent'] || ''
    const netWorthCurrency = netWorthAmount ? 'USD' : ''
    const description = row.Memo || ''
    const txHash = row.Tx

    // Handle Koinly IDs
    if (options.ledger === 'XRP') {
        if (!(row.Currency === 'XRP' && currencyIssuer === null)) {
            const token = sharedArrays.support.xrplCustomTokens.find((myCustomTokensRow) => {
                return myCustomTokensRow.counterparty === currencyIssuer && myCustomTokensRow.currency.trim() === row.Currency.trim()
            })

            if (token) {
                sentCurrency = row.Direction === 'sent' ? token.koinlyid : ''
                receivedCurrency = row.Direction === 'received' ? token.koinlyid : ''
            } else {
                console.log(`KoinlyID NOT FOUND for entry: ${row['Amount as Text']} on line ${row['#']}.`)
                process.exit(1)
            }
        }
    }

    return [date, sentAmount, sentCurrency, receivedAmount, receivedCurrency, feeAmount, feeCurrency, netWorthAmount, netWorthCurrency, '', description, txHash]
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