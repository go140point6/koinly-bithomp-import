// Special case for EVR rewards on same day, combine per day and label "Reward" for the total received that day.
const fs = require('fs');
const csv = require('csv-parser');

// Input and output file paths
const inputFilePath = './output-2nd-pass/parse-3nd.csv';
const outputFilePath = './output-2nd-pass/parse-4th-final.csv';

let rowsByDate = {};
let resultRows = [];

// Read and parse the CSV file
fs.createReadStream(inputFilePath)
  .pipe(csv())
  .on('data', (row) => {
    // Extract and parse the Date
    const date = row.Date ? new Date(row.Date).toISOString().split('T')[0] : null;

    // Check if the row has `Received Currency` as `ID:14799`
    if (row['Received Currency'] === 'ID:14799') {
      if (!rowsByDate[date]) {
        rowsByDate[date] = [];
      }
      rowsByDate[date].push(row);
    } else {
      // Keep rows that don't meet the criteria unchanged
      resultRows.push(row);
    }
  })
  .on('end', () => {
    // Process rows grouped by date
    Object.entries(rowsByDate).forEach(([date, rows]) => {
      const summedRow = sumRows(rows, date);
      resultRows.push(summedRow);
    });

    // Write the result rows to a new CSV file
    const outputCsv = convertToCsv(resultRows);
    fs.writeFileSync(outputFilePath, outputCsv);
    console.log(`Processed file written to: ${outputFilePath}`);
  });

// Function to sum rows for a given date
function sumRows(rows, date) {
  let firstDatetime = rows[0].Date;
  let totalReceivedAmount = 0;
  let totalNetWorthAmount = 0;

  rows.forEach((row) => {
    totalReceivedAmount += parseFloat(row['Received Amount'] || 0);
    totalNetWorthAmount += parseFloat(row['Net Worth Amount'] || 0);
    if (new Date(row.Date) < new Date(firstDatetime)) {
      firstDatetime = row.Date;
    }
  });

  return {
    Date: firstDatetime,
    'Sent Amount': '',
    'Sent Currency': '',
    'Received Amount': totalReceivedAmount.toFixed(8),
    'Received Currency': 'ID:14799',
    'Net Worth Amount': totalNetWorthAmount.toFixed(8),
    'Net Worth Currency': 'USD',
    Label: 'reward', // Label set to "reward" for summed rows
    Description: '',
    TxHash: '', // Empty TxHash for the summed row
  };
}

// Function to convert rows to CSV format
function convertToCsv(rows) {
  const headers = Object.keys(rows[0]);
  const csvLines = rows.map((row) => {
    return headers.map((header) => row[header] || '').join(',');
  });
  return [headers.join(','), ...csvLines].join('\n');
}
