function sanitizeMemo(memoField, rowNumber) {
    const hasExtraLeadingQuotes = memoField.startsWith('""');
    const hasUnescapedQuotes = /[^"]"[^"]/.test(memoField); // Detect unescaped quotes
    const hasUnbalancedQuotes = (memoField.match(/"/g) || []).length % 2 !== 0;

    // Sanitize the Memo field if problematic patterns are detected
    if (hasExtraLeadingQuotes || hasUnescapedQuotes || hasUnbalancedQuotes) {
        console.warn(`Sanitizing problematic Memo field at row ${rowNumber}: ${memoField}`);
        return ''; // Replace with an empty string
    }

    return memoField;
}

module.exports = {
    sanitizeMemo
};