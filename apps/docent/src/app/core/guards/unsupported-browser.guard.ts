import { inject } from '@angular/core';
import { Router } from '@angular/router';
import * as UAParser from 'ua-parser-js';

export const unsupportedBrowserGuard = () => {
    if ('CSS' in window && CSS.supports('display', 'grid')) {
        return true;
    } else {
        const parser = new UAParser(navigator.userAgent);

        const browser = parser.getBrowser();
        const os = parser.getOS();

        try {
            const osVersion = parseFloat(os.version!);
            if ((browser.name === 'Mobile Safari' && osVersion >= 10.3) || (browser.name === 'Safari' && osVersion >= 10.1)) {
                return true;
            }
        } catch (error) {
            // ignore
        }
    }

    return inject(Router).parseUrl('/unsupportedbrowser');
};
