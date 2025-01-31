const fs = require('fs');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');
const path = require('path');
const { getFilenameTimestamp } = require('../utils/granularDate');
const { createDirectoryIfNotExists } = require('../utils/createDirectory');

async function parseBithompFile(inputFile,ledger) {

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
    
        parse(data, { columns: true, trim: true }, (err, records) => {
        if (err) throw err
    
        const formattedData = records.map(row => {
            const date = new Date(row.Timestamp).toISOString()
            const sentAmount = row.Direction === 'sent' ? row.Amount : ''
            const sentCurrency = row.Direction === 'sent' ? row.Currency : ''
            const receivedAmount = row.Direction === 'received' ? row.Amount : ''
            const receivedCurrency = row.Direction === 'received' ? row.Currency : ''
            const feeAmount = row['Tx fee'] || ''
            const feeCurrency = feeAmount ? row['Tx fee currency'] : ''
            const netWorthAmount = row['USD Amount equavalent'] || ''
            const netWorthCurrency = netWorthAmount ? 'USD' : ''
            const label = ''
            const description = ''
            const txHash = row.Tx

            // TODO: skip XRP/XAH but replace everything else with koinly ids
            // if (ledger === 'XRP') {
            //     if (row.Currency !== 'XRP') {
            //         sentCurrency = row.Direction === 'sent' ? getCustomCurrencyId(row.Currency) : sentCurrency
            //         receivedCurrency = row.Direction === 'received' ? getCustomCurrencyId(row.Currency) : receivedCurrency
            //     }
            // }
            
            // if (ledger === 'XAH') {
            //     if (row.Currency !== 'XAH') {
            //         sentCurrency = row.Direction === 'sent' ? getCustomCurrencyId(row.Currency) : sentCurrency
            //         receivedCurrency = row.Direction === 'received' ? getCustomCurrencyId(row.Currency) : receivedCurrency
            //     }
            // }
    
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
    