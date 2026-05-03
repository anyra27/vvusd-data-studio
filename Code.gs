/**
 * VVUSD Data Studio — Apps Script Backend
 * ----------------------------------------------------------------
 * Handles three submission types:
 *   - poll:     {tediousTask}
 *   - project:  {audience, title, description, members, html, fileName}
 *               → uploads `html` to a Drive folder, stores Drive file ID
 *   - feedback: post-session reflection
 *
 * For project type, the dashboard HTML is written to a configured
 * Drive folder. The gallery iframes the file's /preview URL.
 * The Sheet stores the Drive file ID so we don't bloat cells with HTML.
 *
 * SETUP (one-time)
 * ----------------------------------------------------------------
 * 1. Create a new Google Sheet (e.g. "VVUSD Data Studio 2026").
 * 2. Create a Google Drive folder (e.g. "VVUSD Data Studio Submissions").
 *    Share it: "Anyone with the link · Viewer".
 *    Copy the folder ID from the URL (between /folders/ and the next /).
 *    Paste it into DRIVE_FOLDER_ID below.
 * 3. Extensions → Apps Script. Paste this file (and pop.gs).
 * 4. From the Apps Script editor, run `populateHeaders` once to set up
 *    the sheet tabs.
 * 5. Deploy → New deployment → Web app.
 *      Execute as: Me
 *      Who has access: Anyone
 *    Copy the Web App URL.
 * 6. Paste the Web App URL into js/submissions-service.js (CONFIG.SCRIPT_URL).
 *
 * RESET BETWEEN SESSIONS
 * ----------------------------------------------------------------
 * Run `clearAllResponses` from pop.gs (clears sheet rows; keeps Drive files).
 * Or delete files in the Drive folder if you want a clean slate.
 * ---------------------------------------------------------------- */

// EDIT BEFORE DEPLOYING
const DRIVE_FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID_HERE';

const SHEET_TABS = {
  poll: 'Polls',
  project: 'Projects',
  feedback: 'Feedback',
  wishlist: 'Wishlist'
};

const SHEET_HEADERS = {
  poll: ['Timestamp', 'ModuleId', 'UserId', 'UserName', 'UserEmail', 'TediousTask'],
  project: ['Timestamp', 'ModuleId', 'UserId', 'UserName', 'UserEmail', 'Audience', 'Title', 'Description', 'Members', 'DriveFileId', 'FileName'],
  feedback: ['Timestamp', 'ModuleId', 'UserId', 'UserName', 'UserEmail', 'WhatSurprised', 'ConfidenceNow', 'TeacherTraining', 'WhatNext', 'MoreTrainings', 'SessionRating', 'Comments'],
  wishlist: ['Timestamp', 'ModuleId', 'UserId', 'UserName', 'UserEmail', 'Response']
};

// =========================================================================
// HTTP entry points
// =========================================================================

function doPost(e) {
  try {
    var payload;
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    } else {
      throw new Error('No data received');
    }

    var type = payload.type;
    if (!type) throw new Error('Missing submission type');

    var result = saveSubmission(payload);
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ success: false, error: String(err) });
  }
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || 'getData';
    var type = (e && e.parameter && e.parameter.type) || '';
    var moduleId = (e && e.parameter && e.parameter.moduleId) || '';

    if (action === 'getData' && type) {
      var data = getSubmissions(type, moduleId);
      return jsonResponse({ success: true, data: data });
    }
    return jsonResponse({ success: false, error: 'Missing type parameter' });
  } catch (err) {
    return jsonResponse({ success: false, error: String(err) });
  }
}

// =========================================================================
// SAVE
// =========================================================================

function saveSubmission(payload) {
  var type = payload.type;
  var tabName = SHEET_TABS[type];
  if (!tabName) throw new Error('Unknown submission type: ' + type);

  var sheet = getOrCreateTab(tabName, type);
  var data = payload.data || {};
  var moduleId = payload.moduleId || '';
  var now = new Date();
  var row;

  if (type === 'poll') {
    row = [
      now,
      moduleId,
      payload.userId || '',
      payload.userName || 'Anonymous',
      payload.userEmail || '',
      data.tediousTask || ''
    ];
  } else if (type === 'project') {
    var driveFileId = '';
    var fileName = (data.fileName || 'dashboard.html').toString();
    if (data.html) {
      driveFileId = writeHtmlToDrive(data.html, fileName, payload.userName || 'Anonymous', data.audience || '');
    }
    row = [
      now,
      moduleId,
      payload.userId || '',
      payload.userName || 'Anonymous',
      payload.userEmail || '',
      data.audience || '',
      data.title || '',
      data.description || '',
      data.members || '',
      driveFileId,
      fileName
    ];
  } else if (type === 'feedback') {
    row = [
      now,
      moduleId,
      payload.userId || '',
      payload.userName || 'Anonymous',
      payload.userEmail || '',
      data.whatSurprised || '',
      Number(data.confidenceNow) || 0,
      Number(data.teacherTraining) || 0,
      data.whatNext || '',
      data.moreTrainings || '',
      Number(data.sessionRating) || 0,
      data.comments || ''
    ];
  } else if (type === 'wishlist') {
    row = [
      now,
      moduleId,
      payload.userId || '',
      payload.userName || 'Anonymous',
      payload.userEmail || '',
      data.response || ''
    ];
  } else {
    throw new Error('Unhandled type: ' + type);
  }

  sheet.appendRow(row);

  return {
    success: true,
    type: type,
    timestamp: now.toISOString(),
    driveFileId: row.length > 9 ? row[9] : null
  };
}

function writeHtmlToDrive(html, fileName, userName, audience) {
  if (DRIVE_FOLDER_ID === 'YOUR_DRIVE_FOLDER_ID_HERE') {
    throw new Error('DRIVE_FOLDER_ID not configured. See Code.gs setup notes.');
  }
  var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  var safeUser = String(userName || 'Anonymous').replace(/[^a-zA-Z0-9 _-]/g, '');
  var safeAudience = String(audience || '').replace(/[^a-zA-Z0-9]/g, '');
  var prefix = (safeAudience ? safeAudience + ' · ' : '') + (safeUser || 'submission');
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
  var name = prefix + ' · ' + stamp + '.html';
  var file = folder.createFile(name, html, MimeType.HTML);
  // Anyone with the link can view → enables iframe embedding via /preview
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (sharingErr) {
    // If domain policy blocks anyone-with-link, the parent folder must be set
    // to anyone-with-link manually. Continue regardless — the Sheet still has
    // the file ID and the facilitator can flip permissions in Drive UI.
    console.warn('setSharing failed; check folder permissions', sharingErr);
  }
  return file.getId();
}

// =========================================================================
// READ
// =========================================================================

function getSubmissions(type, moduleId) {
  var tabName = SHEET_TABS[type];
  if (!tabName) return [];

  var sheet = getOrCreateTab(tabName, type);
  if (sheet.getLastRow() <= 1) return [];

  var rawData = sheet.getDataRange().getValues();
  var result = [];

  // Common columns
  var COL_TIMESTAMP = 0;
  var COL_MODULE = 1;
  var COL_USERID = 2;
  var COL_USERNAME = 3;
  var COL_USEREMAIL = 4;
  var COL_DATA_START = 5;

  for (var i = rawData.length - 1; i >= 1; i--) {
    var row = rawData[i];
    if (moduleId && row[COL_MODULE] !== moduleId) continue;

    var doc = {
      id: 'row_' + i,
      moduleId: row[COL_MODULE] || '',
      userName: row[COL_USERNAME] || 'Anonymous',
      userId: row[COL_USERID] || '',
      userEmail: row[COL_USEREMAIL] || '',
      createdAt: row[COL_TIMESTAMP] ? new Date(row[COL_TIMESTAMP]).toISOString() : '',
      data: {}
    };

    if (type === 'poll') {
      doc.data = { tediousTask: row[COL_DATA_START] || '' };
    } else if (type === 'project') {
      doc.data = {
        audience: row[COL_DATA_START] || '',
        title: row[COL_DATA_START + 1] || '',
        description: row[COL_DATA_START + 2] || '',
        members: row[COL_DATA_START + 3] || '',
        driveFileId: row[COL_DATA_START + 4] || '',
        fileName: row[COL_DATA_START + 5] || ''
      };
    } else if (type === 'feedback') {
      doc.data = {
        whatSurprised: row[COL_DATA_START] || '',
        confidenceNow: row[COL_DATA_START + 1] || 0,
        teacherTraining: row[COL_DATA_START + 2] || 0,
        whatNext: row[COL_DATA_START + 3] || '',
        moreTrainings: row[COL_DATA_START + 4] || '',
        sessionRating: row[COL_DATA_START + 5] || 0,
        comments: row[COL_DATA_START + 6] || ''
      };
    } else if (type === 'wishlist') {
      doc.data = {
        response: row[COL_DATA_START] || ''
      };
    }
    result.push(doc);
  }
  return result;
}

// =========================================================================
// HELPERS
// =========================================================================

function getOrCreateTab(tabName, type) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    sheet.appendRow(SHEET_HEADERS[type]);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS[type]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
