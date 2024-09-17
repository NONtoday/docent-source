import { EventEmitter } from '@angular/core';
import { createInjectionToken } from 'ngxtension/create-injection-token';

export const [injectToonSchooljaarSelectie, provideToonSchooljaarSelectie] = createInjectionToken(() => new EventEmitter(), {
    isRoot: false
});
