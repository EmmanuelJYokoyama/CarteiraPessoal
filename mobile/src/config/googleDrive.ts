export const GOOGLE_DRIVE_WEB_CLIENT_ID = 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com';
export const GOOGLE_DRIVE_REDIRECT_URL = 'com.carteirapessoal:/oauthredirect';
export const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const GOOGLE_DRIVE_BACKUP_FOLDER_NAME = 'Carteira Pessoal';
export const GOOGLE_DRIVE_SESSION_SERVICE = 'carteira-pessoal-google-drive-session';
export const GOOGLE_DRIVE_BACKUP_FILE_PREFIX = 'carteira-pessoal-backup';

export function isGoogleDriveConfigReady(): boolean {
  return GOOGLE_DRIVE_WEB_CLIENT_ID !== 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com';
}
