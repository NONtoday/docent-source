import { UntypedFormGroup, ValidatorFn } from '@angular/forms';
import { AfspraakHerhalingDag, AfspraakHerhalingType } from '@docent/codegen';
import { addBusinessDays, addDays, addMonths, addWeeks } from 'date-fns';
import { isEqual } from 'lodash-es';
import { getSchooljaar } from '../../rooster-shared/utils/date.utils';

export const herhalendeAfspraakSchooljaarValidator: ValidatorFn = (formgroup: UntypedFormGroup) => {
    const cyclus = formgroup.get('cyclus')?.value ?? 1;
    const herhalingen = formgroup.get('maxHerhalingen')?.value ?? 0;
    const herhalingsrange = cyclus * herhalingen;
    const beginDatum = formgroup.get('beginDatum')!.value;
    let eindDatum = formgroup.get('eindDatum')!.value;
    if (!eindDatum) {
        switch (formgroup.get('type')!.value) {
            case AfspraakHerhalingType.DAGELIJKS:
                if (isEqual(formgroup.get('afspraakHerhalingDagen')!.value, [AfspraakHerhalingDag.DAG])) {
                    eindDatum = addDays(beginDatum, herhalingsrange);
                } else {
                    eindDatum = addBusinessDays(beginDatum, herhalingsrange);
                }
                break;
            case AfspraakHerhalingType.WEKELIJKS:
                eindDatum = addWeeks(beginDatum, herhalingsrange);
                break;
            case AfspraakHerhalingType.MAANDELIJKS:
                eindDatum = addMonths(beginDatum, herhalingsrange);
                break;
            default:
                eindDatum = beginDatum;
                break;
        }
    }

    const isGelijk = isEqual(getSchooljaar(beginDatum), getSchooljaar(eindDatum));
    return isGelijk ? null : { herhalendeAfspraakSchooljaarValidator: true };
};
