/**
 * Helpers — run from the Apps Script editor.
 *   - populateHeaders : create sheet tabs with the right headers (run once)
 *   - clearAllResponses : wipe row data, keep headers (between sessions)
 *   - seedDemoSubmission : drop a fake project row for gallery testing
 */

function populateHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabs = {
    'Polls': ['Timestamp', 'ModuleId', 'UserId', 'UserName', 'UserEmail', 'TediousTask'],
    'Projects': ['Timestamp', 'ModuleId', 'UserId', 'UserName', 'UserEmail', 'Audience', 'Title', 'Description', 'Members', 'DriveFileId', 'FileName'],
    'Feedback': ['Timestamp', 'ModuleId', 'UserId', 'UserName', 'UserEmail', 'WhatSurprised', 'ConfidenceNow', 'TeacherTraining', 'WhatNext', 'MoreTrainings', 'SessionRating', 'Comments'],
    'Wishlist': ['Timestamp', 'ModuleId', 'UserId', 'UserName', 'UserEmail', 'Response']
  };

  for (var tabName in tabs) {
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    }
    var headers = tabs[tabName];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1F2937');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    for (var i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }
  Logger.log('Headers populated.');
}

function clearAllResponses() {
  var ui = SpreadsheetApp.getUi();
  var resp = ui.alert(
    'Clear all responses?',
    'This deletes all rows from Polls, Projects, and Feedback tabs. Headers stay. Drive files are NOT deleted (clean those manually if needed).',
    ui.ButtonSet.YES_NO
  );
  if (resp !== ui.Button.YES) return;

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ['Polls', 'Projects', 'Feedback', 'Wishlist'].forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) return;
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
  });
  Logger.log('Cleared.');
}

/**
 * Seed a demo project row so the gallery has something to render
 * even before any teacher submits. Uses the same MODULE_ID the
 * frontend expects ('vvusd-data-studio-2026').
 */
function seedDemoSubmission() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Projects');
  if (!sheet) {
    Logger.log('Projects tab missing — run populateHeaders first.');
    return;
  }
  sheet.appendRow([
    new Date(),
    'vvusd-data-studio-2026',
    'demo_seed',
    'Demo Submission',
    '',
    'PLC',
    'Lab 03 — Period 4',
    'Three students hovering at 70% — pulling them Wednesday during warm-up.',
    'Demo Group',
    '',  // No DriveFileId for demo
    'demo-dashboard.html'
  ]);
  Logger.log('Seed row added.');
}
