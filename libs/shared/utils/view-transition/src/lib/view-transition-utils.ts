import { ApplicationRef } from '@angular/core';

export function startViewTransition(appRef: ApplicationRef, callback: () => void) {
    // wanneer viewTransitions worden ondersteund in de browser
    if ((<any>document).startViewTransition) {
        (<any>document).startViewTransition(() => {
            callback();
            // anders krijg je altijd de default animatie bij production builds
            appRef.tick();
        });
    } else {
        callback();
    }
}
