function getFilenameTimestamp() {
    const now = new Date();
    return now.toISOString()
        .replace(/:/g, '-')  // Replace colons with hyphens
        .replace('T', '_')   // Replace 'T' separator with an underscore
        .replace(/\./g, '-') // Replace dot in milliseconds with hyphen
        .replace('Z', '');   // Remove 'Z' (UTC indicator)
}

module.exports = { 
    getFilenameTimestamp
  }