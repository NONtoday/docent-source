import { map } from 'rxjs/operators';

export const mapToSelectedAfspraakId = () =>
    map(([params, queryParams]) => (queryParams.get('selectedAfspraak') ? queryParams.get('selectedAfspraak') : params.get('id')));
