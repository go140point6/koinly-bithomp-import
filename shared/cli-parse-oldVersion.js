const { Command } = require('commander')
const { chooseFile } = require('../utils/chooseFile')

function parseCLIArgs() {
    const program = new Command()

    program
        .name('index.js')
        .description('A CLI tool for taking a Bithomp .csv and converting it for Koinly import, with custom tokens mapped to Koinly IDs.')
        .version('1.0.0')
        .requiredOption('-a, --account <account>', 'REQUIRED - A valid wallet address (rXXX...) or the word "LIST"')
        .requiredOption('-a, --account <account>', 'REQUIRED - A valid wallet address (rXXX...) or the word "LIST"')
        .option('-l, --ledger <ledger>', 'OPTIONAL - Which ledger to use: "XRP" or "XAH"', 'XRP') // Default ledger is XRP
        .option('-f, --file <file>', 'OPTIONAL - Use "SINGLE" for one file or "MULTI" for individual files', 'MULTI') // Default is MULTI
        .option('-k, --koinlySearch [value]', 'OPTIONAL - Enable Koinly search. Use true or false to specify explicitly.', false) // Default is false

    // Check if no arguments are provided
    if (process.argv.length < 3) {
        program.outputHelp() // Display the help menu
        console.error('\nError: Missing required option \'-a, --account <account>\'.') // Show specific error
        process.exit(1)
    }

    // Parse the arguments and catch any errors
    try {
        program.parse(process.argv)
    } catch (err) {
        program.outputHelp()
        console.error(`\nError: ${err.message}`)
        process.exit(1)
    }

    const options = program.opts()

    // Validate the account
    if (options.account !== 'LIST' && !options.account.match(/^r[a-zA-Z0-9]{15,}/)) {
        program.outputHelp()
        console.error('\n<account> must be your wallet address (rXXX...) or the word "LIST". This is the only REQUIRED argument.')
        process.exit(1)
    }

    // Validate the file option
    if (!['SINGLE', 'MULTI'].includes(options.file)) {
        program.outputHelp()
        console.error('\n<file> can only be "SINGLE" or "MULTI". Default is "MULTI". This is OPTIONAL.')
        process.exit(1)
    } else if (options.file === 'SINGLE' && options.account !== 'LIST') {
        program.outputHelp()
        console.error('\nUsing the "SINGLE" file option with an address is redundant. Don\'t be redundant.')
        process.exit(1)
    }

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