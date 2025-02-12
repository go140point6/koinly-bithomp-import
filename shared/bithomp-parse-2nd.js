// Takes each individual .csv in output and combines into single .csv
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser'); // Install with: npm install csv-parser
const csvWriter = require('csv-writer').createObjectCsvWriter; // Install with: npm install csv-writer

const inputFolder = './output'; // Folder containing your .csv files
const outputFile = './output-2nd-pass/parse-2nd.csv'; // Path for the filtered .csv file

// Read all .csv files in the input folder
fs.readdir(inputFolder, (err, files) => {
  if (err) throw err;

  const csvFiles = files.filter(file => path.extname(file) === '.csv');
  const allRows = [];
  let headers = null;

  let processedFiles = 0;

  // Process each CSV file
  csvFiles.forEach(file => {
    const filePath = path.join(inputFolder, file);

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('headers', (fileHeaders) => {
        // Capture headers from the first file
        if (!headers) {
          headers = fileHeaders;
        }
      })
      .on('data', (row) => {
        allRows.push(row);
      })
      .on('end', () => {
        processedFiles++;

        // Check if all files have been processed
        if (processedFiles === csvFiles.length) {
          // Group rows by TxHash
          const txHashGroups = {};
          allRows.forEach(row => {
            const txHash = row['TxHash'];
            if (txHash) {
              if (!txHashGroups[txHash]) {
                txHashGroups[txHash] = [];
              }
              txHashGroups[txHash].push(row);
            }
          });

          // Collect rows that do NOT meet the original criteria
          const filteredRows = [];
          for (const [txHash, rows] of Object.entries(txHashGroups)) {
            if (rows.length > 1) {
              let meetsCriteria = false;
              for (let i = 0; i < rows.length; i++) {
                for (let j = i + 1; j < rows.length; j++) {
                  const row1 = rows[i];
                  const row2 = rows[j];
                  // Modified filtering logic to handle empty fields more gracefully
                  if (
                    row1['Sent Currency'] && row2['Received Currency'] && // Ensure Sent Currency is not empty in row 1
                    row1['Sent Currency'] === row2['Received Currency'] ||
                    row1['Received Currency'] && row2['Sent Currency'] && // Ensure Received Currency is not empty in row 2
                    row1['Received Currency'] === row2['Sent Currency']
                  ) {
                    meetsCriteria = true;
                    break;
                  }
                }
                if (meetsCriteria) break;
              }

              // Add rows that don't meet the criteria to the filtered array
              if (!meetsCriteria) {
                filteredRows.push(...rows);
              }
            } else {
              // If there's only one row in the group, it automatically doesn't meet the criteria
              filteredRows.push(...rows);
            }
          }

          // Remove duplicate rows in the filteredRows array
          const uniqueFilteredRows = Array.from(
            new Map(filteredRows.map(row => [JSON.stringify(row), row])).values()
          );

          // Write the filtered rows to the fullfile.csv
          const writer = csvWriter({
            path: outputFile,
            header: headers.map(header => ({ id: header, title: header })),
          });

          writer
            .writeRecords(uniqueFilteredRows)
            .then(() => console.log('Full CSV file created successfully.'));
        }
      });
  });
});