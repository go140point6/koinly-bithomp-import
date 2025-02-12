const { createMainArray, createSupportArrays } = require('./utils/createArrays');
const sharedArrays = require('./shared/sharedArrays');
const { parseCLIArgs } = require('./shared/cli-parse');
const { chooseFile } = require('./utils/chooseFile');
const { parseBithompFile } = require('./shared/bithomp-parse');
const { findKoinlyIds } = require('./shared/find-koinly-ids');
const path = require('path');

(async () => {
    try {
        console.log("\n\u{1F504} Initializing script...\n")

        const main = await createMainArray()
        sharedArrays.support = await createSupportArrays()

        //const directoryPath = path.join(__dirname, 'input')

        const options = parseCLIArgs()
        
        console.log('\n=====================')
        console.log('\u2705 Ledger:', options.ledger)
        console.log('\u2705 One Main File (ONE) or File per Wallet Address (PER):', options.file)
        console.log('\u2705 Koinly ID Search:', options.koinlySearch)
        console.log('=====================\n')

        // Get file path
        const directoryPath = path.join(__dirname, 'input')
        
        const selectedFile = await chooseFile(directoryPath)

        if (!selectedFile) {
            throw new Error("No file selected.")
        }

        console.log("\n\u{1F4C2} You selected:", selectedFile, "\n")

        // Want to do a search for koinly IDs?
        if (options.koinlySearch) {
            //console.log('do koinlyID search.')
            await findKoinlyIds(selectedFile, options, sharedArrays)
        } else {
            // Process the selected file
            await parseBithompFile(selectedFile, options, sharedArrays)
        }

        //console.log("\n\u2705 Process completed successfully.\n")

    } catch (error) {
        console.error("\n\u274C An error occurred:", error.message || error)
        process.exit(1)
    }
})()