const { createMainArray, createSupportArrays } = require('./utils/createArrays');
const sharedArrays = require('./shared/sharedArrays');
const { parseCLIArgs } = require('./shared/cli-parse');
const { chooseFile } = require('./utils/chooseFile');
const { parseBithompFile } = require('./shared/bithomp-parse');
const path = require('path');

(async () => {
    try {
        const main = await createMainArray()
        sharedArrays.support = await createSupportArrays()

        const directoryPath = path.join(__dirname, 'input')

        const options = parseCLIArgs()
        
        console.log('#####################')
        console.log('\u2705 Ledger:', options.ledger)
        console.log('\u2705 One Main File (ONE) or File per Wallet Address (PER):', options.file)
        console.log('\u2705 Koinly Search:', options.koinlySearch)
        console.log('#####################')
        console.log('')

        try {
            const selectedFile = await chooseFile(directoryPath)
            if (selectedFile) {
                console.log("")
                console.log("You selected:", selectedFile)
                console.log("")
                
                await parseBithompFile(selectedFile,options,sharedArrays)
            }
        } catch (error) {
            console.error("Error reading directory:", error)
        }

        // const options = parseCLIArgs()

        // console.log('Account:', options.account);
        // console.log('Ledger:', options.ledger);
        // console.log('File mode:', options.file);
        // console.log('Koinly Search:', options.koinlySearch);

        // // Example of handling based on account type
        // if (options.account === 'LIST') {
        //     console.log('Processing in LIST mode...');
        // } else {
        //     console.log('Processing in MULTI mode...');
        // }



    } catch (error) {
        console.error('An error occurred while creating arrays: ', error)
    }
})()