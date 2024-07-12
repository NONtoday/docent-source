import { CookieStorage } from 'cookie-storage';

// CookieStorage met path op '/', zodat de applicatie geopend in een popup
// de values ook deelt met de tab die de popup opent. Denk aan aanmaken teams/google meet links.
export const cookieStorage = new CookieStorage({
    path: '/'
});

export const isCookieStorageInit = cookieStorage.getItem('sd_init_key_e0b9b7a8cd3f') === 'broken_session_storage';

export const localOrCookieStorage = isCookieStorageInit ? cookieStorage : localStorage;
