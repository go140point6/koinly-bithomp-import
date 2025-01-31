const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');

async function chooseFile(directory, ledger) {
    try {
        const files = fs.readdirSync(directory);

        if (files.length === 0) {
            console.log("No files found in the directory.");
            return null;
        }

        const { selectedFile } = await inquirer.prompt([
            {
                type: 'rawlist',
                name: 'selectedFile',
                message: 'Select a Bithomp export to convert to Koinly format:',
                choices: files
            }
        ]);

        return path.join(directory, selectedFile);
    } catch (error) {
        console.error("Error reading directory:", error);
        return null;
    }
}

module.exports = { 
    chooseFile
  }