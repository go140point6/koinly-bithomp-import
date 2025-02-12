# Bithomp to Koinly Import Converter

This Node.js CLI tool processes a Bithomp .csv file and converts it for Koinly import, with custom tokens mapped to Koinly IDs. The program supports both a single file for all wallet addresses or separate files for each wallet address.

## Features

- Processes Bithomp .csv files from the XRP or XAH ledger.
- Maps custom tokens to Koinly IDs.
- Supports conversion of one file per address or one file for all addresses.
- Optionally includes a Koinly search.
- Automatically sanitizes problematic Memo fields in the .csv data.
- Generates formatted CSVs ready for Koinly import.

## Requirements

- Node.js (v14 or higher recommended)
- npm (or yarn)

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/bithomp-to-koinly.git
    ```

2. Navigate to the project directory:
    ```bash
    cd bithomp-to-koinly
    ```

3. Install dependencies:
    ```bash
    npm install
    ```

## Usage

### CLI Options

- `-l, --ledger <ledger>`: **Required**. Specify the ledger of the Bithomp .csv file (`XRP` or `XAH`).
- `-f, --file <file>`: **Optional**. Specify whether the input file contains one file per wallet address (`PER`) or a single file for all addresses (`ONE`). Default is `PER`.
- `-k, --koinlySearch [value]`: **Optional**. Enable Koinly search. Specify `true` or `false`. Default is `false`.

### Example Command

Convert a Bithomp .csv file for the XRP ledger, with one file per wallet address:

```bash
node index.js -l XRP -f PER
```


Convert a Bithomp .csv file for the XAH ledger, with a single file for all addresses:

node index.js -l XAH -f ONE -k true

Input Directory

The input files should be placed in the input directory within the project directory.
Output Directory

The converted CSV files will be saved to the output directory.
File Processing

The program will:

    Parse the Bithomp .csv file.
    Sanitize the data (memo fields, remove BOM if present).
    Generate a new CSV formatted for Koinly import:
        If -f PER is selected, it creates separate files for each wallet address.
        If -f ONE is selected, it creates a single file for all addresses.

Sample Output Format

The resulting CSV file will include the following columns:

    Date
    Sent Amount
    Sent Currency
    Received Amount
    Received Currency
    Net Worth Amount
    Net Worth Currency
    Label
    Description
    TxHash

Error Handling

If any errors occur during processing, they will be logged in the console, and the process will exit with a non-zero status code.
Contributing

Feel free to open issues or submit pull requests for improvements.
License

This project is licensed under the MIT License - see the LICENSE file for details.