import { localOrCookieStorage } from './storage-config';

export function cleanLocalStorageAuthentication() {
    const storage = localOrCookieStorage;
    storage.removeItem('access_token');
    storage.removeItem('id_token');
    storage.removeItem('refresh_token');
    storage.removeItem('expires_at');
    storage.removeItem('id_token_claims_obj');
    storage.removeItem('id_token_expires_at');
    storage.removeItem('id_token_stored_at');
    storage.removeItem('access_token_stored_at');
    storage.removeItem('mockLogin');
}

export function cleanLocalStorageMisc() {
    const storage = localOrCookieStorage;
    storage.removeItem('core_return_url');
    storage.removeItem('somtoday_api_url');
    storage.removeItem('single_logout_identifier');
}

export function cleanLocalStorage() {
    cleanLocalStorageAuthentication();
    cleanLocalStorageMisc();
}

/**
 * Slaat de requestedUrl op in de sessionStorage.
 * Het 'oauth'-endpoint binnen de applicatie wordt uigesloten,
 * omdat dit component alleen de autorisatie regelt.
 */
export function storeRequestedUrl(currentUrl: string) {
    if (currentUrl.indexOf('oauth') === -1) {
        sessionStorage.setItem('requestedUrl', currentUrl);
    }
}
