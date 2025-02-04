const { createMainArray, createSupportArrays } = require('./utils/createArrays');
const sharedArrays = require('./shared/sharedArrays');
const { parseCLIArgs } = require('./shared/cli-parse');
const { chooseFile } = require('./utils/chooseFile');
const { parseBithompFile } = require('./shared/bithomp-parse');
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
        console.log('\u2705 Koinly Search:', options.koinlySearch)
        console.log('=====================\n')

        // Get file path
        const directoryPath = path.join(__dirname, 'input')
        
        const selectedFile = await chooseFile(directoryPath)

        if (!selectedFile) {
            throw new Error("No file selected.")
        }

        console.log("\n\u{1F4C2} You selected:", selectedFile, "\n")

        // Process the selected file
        await parseBithompFile(selectedFile, options, sharedArrays)

        //console.log("\n\u2705 Process completed successfully.\n")

    } catch (error) {
        console.error("\n\u274C An error occurred:", error.message || error)
        console.error(error.stack)
        process.exit(1)
    }
})()

        // try {
        //     const selectedFile = await chooseFile(directoryPath)
        //     if (selectedFile) {
        //         console.log("")
        //         console.log("You selected:", selectedFile)
        //         console.log("")
                
        //         await parseBithompFile(selectedFile,options,sharedArrays)
        //     }
        // } catch (error) {
        //     console.error("Error reading directory:", error)
        // }

//     } catch (error) {
//         console.error('An error occurred while creating arrays: ', error)
//     }
// })()