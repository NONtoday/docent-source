import { CanDeactivateFn } from '@angular/router';
import { DeactivatableComponentDirective } from '../../shared/components/deactivatable.component';

export const deactivatableGuard: CanDeactivateFn<DeactivatableComponentDirective> = (component) => {
    if (!component.canDeactivate()) {
        return component.isDeactivationAllowed();
    }
    return true;
};
