const { Command } = require('commander')

function parseCLIArgs() {
    const program = new Command()

    program
        .name('index.js')
        .description('A CLI tool for taking a Bithomp .csv and converting it for Koinly import, with custom tokens mapped to Koinly IDs.')
        .version('1.0.0')
        .option('-l, --ledger <ledger>', 'REQUIRED - the ledger this Bithomp .csv is from: "XRP" or "XAH"') // Default ledger is XRP
        .option('-f, --file <file>', 'OPTIONAL - one .csv for all wallet addresses or a .csv for each wallet address: "ONE" or "PER"', 'PER') // Default if one per address
        .option('-k, --koinlySearch [value]', 'OPTIONAL - enable Koinly search. Use true or false to specify explicitly.', false) // Default is false

    // Parse the arguments and catch any errors
    try {
        program.parse(process.argv)
    } catch (err) {
        program.outputHelp()
        console.error(`\n\u274C Error: ${err.message}`)
        process.exit(1)
    }

    const options = program.opts()

    // Validate the ledger option
    if (!options.ledger || !['XRP', 'XAH'].includes(options.ledger)) {
        program.outputHelp()
        console.error('\n\u274C <ledger> must be either "XRP" or "XAH". This is REQUIRED.')
        process.exit(1)
    }

    // Validate the file option
    if (!['ONE', 'PER'].includes(options.file)) {
        program.outputHelp()
        console.error('\n\u274C <file> must be either "ONE" or "PER". Default is "PER". This is OPTIONAL.')
    }

    // Validate and process koinlySearch
    if (typeof options.koinlySearch === 'string') {
        if (options.koinlySearch.toLowerCase() === 'true') {
            options.koinlySearch = true
        } else if (options.koinlySearch.toLowerCase() === 'false') {
            options.koinlySearch = false
        } else {
            program.outputHelp()
            console.error('\n\u274C <koinlySearch>, if provided, must be "true" or "false". This is OPTIONAL.')
            process.exit(1)
        }
    }

    return options // Return the parsed and validated options
}

module.exports = { 
    parseCLIArgs 
}