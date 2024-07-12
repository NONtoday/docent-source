import { FormGroup, ValidatorFn } from '@angular/forms';
import { isBefore } from 'date-fns';
import { get, isNil } from 'lodash-es';
import { toDate } from '../../rooster-shared/utils/date.utils';

const tijdRegEx = new RegExp('^(0[0-9]|1[0-9]|2[0-3]|[0-9]):[0-5][0-9]$');

export const ConceptInleveropdrachtStartVoorEindValidator: ValidatorFn = (formgroup: FormGroup) => {
    const startWeek = get(formgroup.get('startWeek'), 'value');
    const startDag = get(formgroup.get('startDag'), 'value');
    const startTijd = get(formgroup.get('startTijd'), 'value');

    const eindWeek = get(formgroup.get('eindWeek'), 'value');
    const eindDag = get(formgroup.get('eindDag'), 'value');
    const eindTijd = get(formgroup.get('eindTijd'), 'value');

    if (isNil(startWeek) || isNil(startDag) || isNil(startTijd) || isNil(eindWeek) || isNil(eindDag) || isNil(eindTijd)) {
        return { startVoorEind: true };
    }
    if (!tijdRegEx.test(startTijd) || !tijdRegEx.test(eindTijd)) {
        return { ongeldigeTijd: true };
    }

    const startDatum = toDate(startWeek, startDag, startTijd);
    const eindDatum = toDate(eindWeek, eindDag, eindTijd);

    return isBefore(startDatum, eindDatum) ? null : { startVoorEind: true };
};
