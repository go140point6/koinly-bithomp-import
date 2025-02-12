// Takes combined .csv and turn two opposite one-sided trades into a single exchange
const fs = require('fs');
const csv = require('csv-parser');

// Take 2nd pass output as input
const filePath = './output-2nd-pass/parse-2nd.csv'; // Path to your CSV file
const outputFile = './output-2nd-pass/parse-3nd.csv'

// Initialize counts and storage for combined rows
let totalRows = 0;
let combinedRows = [];
let uniqueRows = [];
let txHashCounts = {};
let txHashRows = {};

// Read and parse the CSV file
fs.createReadStream(filePath)
  .pipe(csv())
  .on('data', (row) => {
    totalRows++;

    // Get the TxHash, accounting for null, empty, or missing values
    const txHash = row.TxHash ? row.TxHash.trim() : null;

    // Track the occurrence of TxHash for raw row counts
    if (txHash) {
      txHashCounts[txHash] = (txHashCounts[txHash] || 0) + 1;
      if (!txHashRows[txHash]) {
        txHashRows[txHash] = [];
      }
      txHashRows[txHash].push(row);
    } else {
      txHashCounts['null_or_empty'] = (txHashCounts['null_or_empty'] || 0) + 1;
      uniqueRows.push(row); // Include rows with null/empty TxHash in uniqueRows
    }
  })
  .on('end', () => {
    // Combine rows for TxHashes that appear twice
    Object.entries(txHashRows).forEach(([txHash, rows]) => {
        if (rows.length === 2) {
          const combinedRow = combineRows(rows);
          if (combinedRow) {
            combinedRows.push(combinedRow);
          } else {
            // If rows couldn't be combined, add both to uniqueRows
            uniqueRows.push(...rows);
          }
        } else if (rows.length === 1) {
          // Keep the original row as it's unique
          uniqueRows.push(rows[0]);
        }
      });

    // Output the results
    console.log(`Total rows (excluding headers): ${totalRows}`);
    //console.log(`Combined rows count: ${combinedRows.length}`);
    //console.log(`Unique TxHash count: ${Object.keys(txHashCounts).length - 1}`); // Exclude 'null_or_empty' key
    console.log(`Rows with exactly twice TxHash: 0`);
    console.log(`Rows with three or more TxHash: 0`);

    // Merge unique rows and combined rows
    const allRows = [...uniqueRows, ...combinedRows];

    // Optionally, save the combined rows to a new CSV
    const combinedCsv = convertToCsv(allRows);
    fs.writeFileSync(outputFile, combinedCsv);
    console.log('CSV file has been written successfully!');
  });

// Function to combine two rows with the same TxHash
function combineRows(rows) {
    const firstRow = rows[0];
    const secondRow = rows[1];
  
    // Check if one row represents "Sent" and the other "Received"
    const isFirstRowSent = firstRow['Sent Amount'] && firstRow['Sent Currency'];
    const isSecondRowSent = secondRow['Sent Amount'] && secondRow['Sent Currency'];
    const isFirstRowReceived = firstRow['Received Amount'] && firstRow['Received Currency'];
    const isSecondRowReceived = secondRow['Received Amount'] && secondRow['Received Currency'];
  
    if (
      (isFirstRowSent && isSecondRowReceived) ||
      (isFirstRowReceived && isSecondRowSent)
    ) {
      // Combine the rows into one trade record
      return {
        Date: new Date(firstRow.Date) < new Date(secondRow.Date) ? firstRow.Date : secondRow.Date,
        'Sent Amount': isFirstRowSent ? firstRow['Sent Amount'] : secondRow['Sent Amount'],
        'Sent Currency': isFirstRowSent ? firstRow['Sent Currency'] : secondRow['Sent Currency'],
        'Received Amount': isFirstRowReceived ? firstRow['Received Amount'] : secondRow['Received Amount'],
        'Received Currency': isFirstRowReceived ? firstRow['Received Currency'] : secondRow['Received Currency'],
        'Net Worth Amount': firstRow['Net Worth Amount'], // Retain from the first row (or adjust as needed)
        'Net Worth Currency': firstRow['Net Worth Currency'], // Retain from the first row (or adjust as needed)
        Label: firstRow['Label'],  // Retain from the first row
        Description: firstRow['Description'], // Retain from the first row
        TxHash: firstRow['TxHash'], // Shared TxHash
      };
    }

    // If both rows are on the same side (e.g., both "Received"), don't combine
    console.error(`Rows with TxHash ${firstRow.TxHash} are on the same side and will not be combined.`);
    return null;
}

// Function to convert rows to CSV format
function convertToCsv(rows) {
  const headers = Object.keys(rows[0]);
  const csvLines = rows.map(row => {
    return headers.map(header => {
      return row[header] || ''; // Ensure no undefined values
    }).join(',');
  });

  return [headers.join(','), ...csvLines].join('\n');
}