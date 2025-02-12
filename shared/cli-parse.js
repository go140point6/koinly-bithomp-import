const { Command } = require('commander')

function parseCLIArgs() {
    const program = new Command()

    program
        .name('index.js')
        .description('A CLI tool for taking a Bithomp .csv and converting it for Koinly import, with custom tokens mapped to Koinly IDs.')
        .version('1.0.0')
        .option('-l, --ledger <ledger>', 'REQUIRED - the ledger this Bithomp .csv is from: "XRP" or "XAH"')
        .option('-f, --file <file>', 'OPTIONAL - one .csv for all wallet addresses or a .csv for each wallet address: "ONE" or "PER"', 'PER') // Default if one per address
        .option('-k, --koinlySearch [value]', 'OPTIONAL - enable Koinly search. Use true or false to specify explicitly.', false) // Default is false

    // Parse the arguments and catch any errors
    try {
        program.parse(process.argv)
    } catch (err) {
        exitWithError(`\u274C Error: ${err.message}`, program)
    }

    const options = program.opts()

    if (!['XRP', 'XAH'].includes(options.ledger)) {
        exitWithError('\n\u274C <ledger> must be either "XRP" or "XAH". REQUIRED.', program)
    }
    if (!['ONE', 'PER'].includes(options.file)) {
        exitWithError('\n\u274C <file> must be either "ONE" or "PER". Default is "PER". OPTIONAL.', program)
    }

        return options; // Return validated options
    }   

// Boolean parser function for koinlySearch
function parseBoolean(value) {
    if (typeof value === 'boolean') return value // Already parsed
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false
    throw new Error('\u274C <koinlySearch> must be "true" or "false". OPTIONAL.')
}

// Error handling helper
function exitWithError(message, program) {
    program.outputHelp()
    console.error(`${message}`)
    process.exit(1)
}

module.exports = { 
    parseCLIArgs 
}