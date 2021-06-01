import { readFileSync, writeFileSync } from 'fs';
import { google } from 'googleapis';
import readline from 'readline';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets', 
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/gmail.send'
];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";
const CREDENTIAL_FILE_PATH = "credentials.json";

export class GoogleApiService {
  private oAuth2Client = null;

  constructor() {
    this.authorize().then(authClent => this.oAuth2Client = authClent);
  }

  async getFileMetadata(fileId: string): Promise<any> {
    const drive = google.drive({ version: 'v2', auth: this.oAuth2Client });
    const response = await drive.files.get({ fileId });
    return response.data;
  }

  async getFolderChildren(folderId: string, pageToken: string): Promise<any[]> {
    const drive = google.drive({ version: 'v2', auth: this.oAuth2Client });
    const response = await drive.children.list({ folderId: folderId, pageToken: pageToken });
    return response.data.items;
  }

  async patchFile(fileid: string, title: string, addParents: string, removeParents: string): Promise<any> {
    const params = {
      fileId: fileid,
      addParents: addParents,
      removeParents: removeParents,
      resource: { title }
    };
  
    const drive = google.drive({ version: 'v2', auth: this.oAuth2Client });
    const response = await drive.files.patch(params);
    return response.data;
  }

  async copyFile(fileId: string) {
    const params = { fileId };

    const drive = google.drive({ version: 'v3', auth: this.oAuth2Client });
    const response = await drive.files.copy(params);
    return response.data.id;
  }

  async createSpreadFile(fileName: string): Promise<string> {
    const request = {
      resource: {
        properties: {
          "title" : fileName
        }
      },
      auth: this.oAuth2Client
    };
    
    const sheets = google.sheets({ version: "v4" });
    const response = await sheets.spreadsheets.create(request);
    
    return response.data.spreadsheetId ?? '';
  }

  async spreadSheetValuesGet(spreadsheetId: string, range: string): Promise<any> {
    const params = {
      auth: this.oAuth2Client,
      spreadsheetId: spreadsheetId,
      range: range
    }
  
    const sheets = google.sheets({ version: "v4" });
    const response = await sheets.spreadsheets.values.get(params);
    return response.data;
  }

  async spreadSheetValuesUpdate(spreadsheetId: string, data: { range: string; values: string[][]; }[]): Promise<any> {
    const params = {
      auth: this.oAuth2Client,
      spreadsheetId: spreadsheetId,
      valueInputOption: 'USER_ENTERED',
      resource: {
        valueInputOption: 'USER_ENTERED',
        data: data
      }
    }
  
    const sheets = google.sheets({ version: "v4" });
    const response = await sheets.spreadsheets.values.batchUpdate(params);
    return response.data;
  }

  async spreadSheetUpdate(spreadsheetId: string, requests: any): Promise<any> {
    const params = {
      spreadsheetId: spreadsheetId,
      resource: {
        requests: requests
      },
      auth: this.oAuth2Client
    };
    
    const sheets = google.sheets({ version: "v4" });
    const response = await sheets.spreadsheets.batchUpdate(params);
    return response.data;
  }

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  private async authorize() {
    const content = readFileSync(CREDENTIAL_FILE_PATH, 'utf8');
    // Authorize a client with credentials, then call the Google Sheets API.
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.installed;

    const authClient = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    try {
      const token = readFileSync(TOKEN_PATH, 'utf8');
      authClient.setCredentials(JSON.parse(token));
    } catch (err) {
      return await this.getNewToken(authClient);
    }

    return authClient;
  }

  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   * @param {google.auth.OAuth2} authClient The OAuth2 client to get token for.
   */
  private async getNewToken(authClient) {
    return new Promise((resolve, reject) => {
      const authUrl = authClient.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES
      });
      console.log("Authorize this app by visiting this url:", authUrl);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question("Enter the code from that page here: ", code => {
        rl.close();
        authClient.getToken(code, (err, token) => {
          if (err) {
            return console.error("Error while trying to retrieve access token", err);
          }
  
          authClient.setCredentials(token);
          // Store the token to disk for later program executions
          try {
            writeFileSync(TOKEN_PATH, JSON.stringify(token), 'utf8');
            console.log("Token stored to", TOKEN_PATH);
          } catch (err) {
            console.error(err);
            reject(err);
          }
          
          resolve(authClient);
        });
      });
    });
  } 
}
  