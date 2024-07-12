import { UntypedFormGroup } from '@angular/forms';
import { isValid } from 'date-fns';

export const startVoorEindValidator =
    (begin = 'begin', eind = 'eind') =>
    (formgroup: UntypedFormGroup) => {
        const start = formgroup.get(begin)!.value;
        const end = formgroup.get(eind)!.value;

        const startIsLeeg = !isValid(start);
        const eindIsLeeg = !isValid(end);
        const startIsVoorEind = start < end;

        return startIsLeeg || eindIsLeeg || startIsVoorEind ? null : { startVoorEind: true };
    };
