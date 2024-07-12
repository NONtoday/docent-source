import { Directive, HostListener } from '@angular/core';
import { Observable } from 'rxjs';

@Directive()
export abstract class DeactivatableComponentDirective {
    /**
     * De methode om te bepalen of de popup getoont moet worden
     */
    abstract canDeactivate(): boolean;

    /**
     * De methode om te bepalen of er weggenavigeerd mag worden
     */
    isDeactivationAllowed(): Observable<boolean> | Promise<boolean> | boolean {
        return true;
    }

    @HostListener('window:beforeunload', ['$event'])
    unloadNotification($event: any) {
        if (!this.canDeactivate()) {
            $event.returnValue = true;
        }
    }
}
