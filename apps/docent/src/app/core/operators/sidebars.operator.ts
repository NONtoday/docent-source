import { Observable } from 'rxjs';
import { filter, map, scan } from 'rxjs/operators';
import { OpenSidebarArgs } from '../services/sidebar.service';

/**
 * Deze operator zorgt ervoor dat de sidebar observable alleen reageert op acties die bedoeld zijn voor die sidebar (filter)
 * en mapt naar de meegeven data aan openSidebar(..).
 *
 * Omdat je de sidebar ook stukjes nieuwe data wil kunnen sturen via sidebarService.updateData(..),
 * wil je niet elke keer ook alle huidige data weer meesturen. De scan zorgt ervoor dat wanneer data updateData wordt aangeroepen
 * (met de 'Data' action) dat dit samen gaat met de vorige keer dat er data door de pipe kwam.
 */
export function sidebarFilter(sidebar: unknown) {
    return function <T>(source$: Observable<OpenSidebarArgs<T>>) {
        return source$.pipe(
            filter((args) => args.action === 'CloseAll' || args.filter === sidebar),
            scan(
                (huidigeData, nieuw) => {
                    if (nieuw.action === 'Data') {
                        // negeer de nieuwe data wanneer er geen bestaande data is
                        // bv wanneer updateData wordt aangeroepen voor een sidebar,
                        // terwijl de sidebar dicht zit
                        if (!huidigeData.data) {
                            return huidigeData;
                        }
                        // vul de data in de sidebar aan met de nieuwe data.
                        // Dit wordt de 'huidigeData' variable bij de volgende
                        // waarde die door de pipe gaat
                        return {
                            filter: nieuw.filter,
                            action: 'Data',
                            data: {
                                ...(huidigeData.data as any),
                                ...nieuw.data,
                                sidebar: {
                                    ...(<any>huidigeData.data)?.sidebar,
                                    ...nieuw.data?.sidebar
                                }
                            }
                        };
                    }
                    return nieuw;
                },
                {
                    filter: sidebar,
                    action: 'Open',
                    data: null
                }
            ),
            map((action) => action.data)
        );
    };
}
