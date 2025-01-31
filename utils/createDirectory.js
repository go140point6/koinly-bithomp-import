const fs = require('fs');

// Function to create directory if it doesn't exist
const createDirectoryIfNotExists = async(directory) => {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true }); // Create directory recursively
    }
}

module.exports = {
    createDirectoryIfNotExists
}