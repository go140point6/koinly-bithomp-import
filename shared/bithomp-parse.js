const fs = require('fs');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');
const path = require('path');
const { getFilenameTimestamp } = require('../utils/granularDate');
const { createDirectoryIfNotExists } = require('../utils/createDirectory');

async function parseBithompFile(inputFile,ledger,sharedArrays) {

    const outputPath = path.join(__dirname, '../output')
    createDirectoryIfNotExists(outputPath)
    const currentDate = getFilenameTimestamp()
    outputFile = `${ledger}-koinlyimport-${currentDate}.csv`

    const outputFilePath = path.join(outputPath, outputFile)

    // Koinly "universal format" .csv
    const headers = [
        'Date', 'Sent Amount', 'Sent Currency', 'Received Amount', 'Received Currency',
        'Fee Amount', 'Fee Currency', 'Net Worth Amount', 'Net Worth Currency', 'Label', 'Description', 'TxHash'
    ]
    
    fs.readFile(inputFile, 'utf8', (err, data) => {
        if (err) throw err

        // Remove BOM if present
        if (data.charCodeAt(0) === 0xFEFF) {
            data = data.slice(1)
        } 
    
        parse(data, { columns: true, skip_empty_lines: true, trim: true, relax_quotes: true }, (err, records) => {
        if (err) throw err
    
        const formattedData = records.map(row => {
            const line = row['#'] || '' // used to match koinly ids
            const date = new Date(row['Timestamp ISO']).toISOString()
            const address = row.Address || '' // used to create individual files
            const ticker = row['Amount as Text'] || '' // used to match koinly ids
            const sentAmount = row.Direction === 'sent' ? row.Amount : ''
            let sentCurrency = row.Direction === 'sent' ? row.Currency : ''
            const receivedAmount = row.Direction === 'received' ? row.Amount : ''
            let receivedCurrency = row.Direction === 'received' ? row.Currency : ''
            const currencyIssuer = row['Currency issuer'] || null  // used to match koinly ids
            const feeAmount = row['Tx fee'] || ''
            const feeCurrency = feeAmount ? row['Tx fee currency'] : ''
            const netWorthAmount = row['USD Amount equavalent'] || ''
            const netWorthCurrency = netWorthAmount ? 'USD' : ''
            const label = ''
            const description = row.Memo || ''
            const txHash = row.Tx

            // Koinly IDs
            if (ledger === 'XRP') {
                if (row.Currency === 'XRP' && currencyIssuer === null) {
                        // console.log('This is native XRP, use it...')
                } else {
                        // console.log('This is a token with an issuer:', row['Currency issuer'])
                        // replace with Koinly ID
                        const token = sharedArrays.support.xrplCustomTokens.find((myCustomTokensRow) => {
                            //console.log(`Searching for: ${currencyIssuer}.${row.Currency}`)
                            //console.log(`Comparing to: ${myCustomTokensRow.counterparty}.${myCustomTokensRow.currency}.${myCustomTokensRow.ticker}`)
                            return myCustomTokensRow.counterparty === currencyIssuer && myCustomTokensRow.currency.trim() === row.Currency.trim()
                        })
                
                        if (token) {
                            sentCurrency = row.Direction === 'sent' ? token.koinlyid : ''
                            receivedCurrency = row.Direction === 'received' ? token.koinlyid : ''
                        } else {
                            console.log(`KoinlyID NOT FOUND for entry: ${ticker} on line ${line}.`)
                            console.log(`STOP! Koinly ID for ${currencyIssuer}.${row.Currency} not found in xrplCustomTokens.csv.  Recommend you run again with the <koinlySearch> argument.`)
                            process.exit(1)
                        }

                    }
                }

                if (ledger === 'XAH') {
                    if (row.Currency === 'XAH' && currencyIssuer === null) {
                            //console.log('This is native XAH')
                    } else {
                            //console.log('This is a token with an issuer:', row['Currency issuer'])
                        }
                    }
    
            return [
            date, sentAmount, sentCurrency, receivedAmount, receivedCurrency,
            feeAmount, feeCurrency, netWorthAmount, netWorthCurrency, label, description, txHash
            ]
        })
    
        stringify([headers, ...formattedData], (err, output) => {
            if (err) throw err
            fs.writeFile(outputFilePath, output, 'utf8', err => {
            if (err) throw err
            console.log('Formatted CSV written to', outputFilePath)
            })
        })
        })
    })
}

module.exports = {
    parseBithompFile
}
    