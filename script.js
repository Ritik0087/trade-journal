// Google Sheets API setup
const CLIENT_ID = 'YOUR_CLIENT_ID'; // Replace with your client ID
const API_KEY = 'YOUR_API_KEY'; // Replace with your API key
const SHEET_ID = 'YOUR_SHEET_ID'; // Replace with your sheet ID
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

document.addEventListener('DOMContentLoaded', function() {
    handleClientLoad();
    loadData();
});

// Save settings
document.getElementById('saveSettings').addEventListener('click', saveSettings);

// Add trade
document.getElementById('tradeForm').addEventListener('submit', addTrade);

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    });
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        loadTradesFromSheet();
    } else {
        gapi.auth2.getAuthInstance().signIn();
    }
}

function loadTradesFromSheet() {
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Sheet1!A2:F', // Assuming headers in row 1: Date, Capital Used, Type, Profit/Loss, Remark, Balance
    }).then(function(response) {
        const values = response.result.values || [];
        const trades = values.map(row => ({
            date: row[0],
            capitalUsed: parseFloat(row[1]),
            type: row[2],
            profitLoss: parseFloat(row[3]),
            remark: row[4]
        }));
        localStorage.setItem('trades', JSON.stringify(trades));
        displayTrades();
    });
}

function appendTradeToSheet(trade) {
    const values = [[trade.date, trade.capitalUsed, trade.type, trade.profitLoss, trade.remark]];
    gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Sheet1!A:E', // Append to columns A-E
        valueInputOption: 'RAW',
        resource: { values }
    }).then(function(response) {
        console.log('Trade added to sheet');
    });
}

function saveSettings() {
    const workingCapital = parseFloat(document.getElementById('workingCapital').value);
    const dayTarget = parseFloat(document.getElementById('dayTarget').value);
    const monthTarget = parseFloat(document.getElementById('monthTarget').value);
    
    const settings = { workingCapital, dayTarget, monthTarget };
    localStorage.setItem('tradingSettings', JSON.stringify(settings));
    alert('Settings saved!');
}

function addTrade(e) {
    e.preventDefault();
    
    const date = document.getElementById('tradeDate').value;
    const capitalUsed = parseFloat(document.getElementById('capitalUsed').value);
    const type = document.getElementById('type').value;
    const profitLoss = parseFloat(document.getElementById('profitLoss').value);
    const remark = document.getElementById('remark').value;
    
    const trade = { date, capitalUsed, type, profitLoss, remark };
    
    let trades = JSON.parse(localStorage.getItem('trades')) || [];
    trades.push(trade);
    localStorage.setItem('trades', JSON.stringify(trades));
    
    appendTradeToSheet(trade);
    displayTrades();
    document.getElementById('tradeForm').reset();
}

function loadData() {
    const settings = JSON.parse(localStorage.getItem('tradingSettings'));
    if (settings) {
        document.getElementById('workingCapital').value = settings.workingCapital;
        document.getElementById('dayTarget').value = settings.dayTarget;
        document.getElementById('monthTarget').value = settings.monthTarget;
    }
}

function displayTrades() {
    const trades = JSON.parse(localStorage.getItem('trades')) || [];
    const settings = JSON.parse(localStorage.getItem('tradingSettings')) || { workingCapital: 0 };
    
    let balance = settings.workingCapital;
    const tbody = document.getElementById('tradesBody');
    tbody.innerHTML = '';
    
    trades.forEach(trade => {
        balance += trade.profitLoss;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${trade.date}</td>
            <td>${trade.capitalUsed}</td>
            <td>${trade.type}</td>
            <td>${trade.profitLoss}</td>
            <td>${balance.toFixed(2)}</td>
            <td>${trade.remark}</td>
        `;
        tbody.appendChild(row);
    });
}