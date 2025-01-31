const { Command } = require('commander')

function parseCLIArgs() {
    const program = new Command()

    program
        .name('index.js')
        .description('A CLI tool for taking a Bithomp .csv and converting it for Koinly import, with custom tokens mapped to Koinly IDs.')
        .version('1.0.0')
        .option('-l, --ledger <ledger>', 'OPTIONAL - the ledger this Bithomp .csv is from: "XRP" or "XAH"', 'XRP') // Default ledger is XRP
        .option('-k, --koinlySearch [value]', 'OPTIONAL - Enable Koinly search. Use true or false to specify explicitly.', false) // Default is false

    // Parse the arguments and catch any errors
    try {
        program.parse(process.argv)
    } catch (err) {
        program.outputHelp()
        console.error(`\nError: ${err.message}`)
        process.exit(1)
    }

    const options = program.opts()

    // Validate the ledger option
    if (!['XRP', 'XAH'].includes(options.ledger)) {
        program.outputHelp()
        console.error('\n<ledger> must be either "XRP" or "XAH". Default is "XRP". This is OPTIONAL.')
        process.exit(1)
    }

    // Validate and process koinlySearch
    if (typeof options.koinlySearch === 'string') {
        if (options.koinlySearch.toLowerCase() === 'true') {
            options.koinlySearch = true
        } else if (options.koinlySearch.toLowerCase() === 'false') {
            options.koinlySearch = false
        } else {
            program.outputHelp()
            console.error('\nError: <koinlySearch>, if provided, must be "true" or "false". This is OPTIONAL.')
            process.exit(1)
        }
    }

    return options // Return the parsed and validated options
}

module.exports = { 
    parseCLIArgs 
}