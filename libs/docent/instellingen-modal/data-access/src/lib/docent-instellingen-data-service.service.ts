import { inject, Injectable } from '@angular/core';
import { IngelogdeMedewerkerDocument, SetDagBegintijdDocument, ThemeSettings, UpdateThemeSettingsDocument } from '@docent/codegen';
import { Apollo } from 'apollo-angular';
import { set } from 'shades';

@Injectable()
export class DocentInstellingenDataServiceService {
    private readonly apollo = inject(Apollo);

    updateThemeSettings(medewerkerUuid: string, settings: ThemeSettings) {
        return this.apollo
            .mutate({
                mutation: UpdateThemeSettingsDocument,
                variables: {
                    medewerkerUuid,
                    settings
                },
                update: (cache) => {
                    const medewerkerQueryData = cache.readQuery({
                        query: IngelogdeMedewerkerDocument
                    })?.ingelogdeMedewerker;

                    if (medewerkerQueryData)
                        cache.writeQuery({
                            query: IngelogdeMedewerkerDocument,
                            data: {
                                ingelogdeMedewerker: {
                                    ...medewerkerQueryData,
                                    settings: {
                                        ...medewerkerQueryData.settings,
                                        themeSettings: {
                                            __typename: 'ThemeSettings',
                                            ...settings
                                        }
                                    }
                                }
                            }
                        });
                }
            })
            .subscribe();
    }

    public async setDagBegintijd(medewerkerUuid: string, dagBegintijd: string) {
        this.apollo
            .mutate({
                mutation: SetDagBegintijdDocument,
                variables: {
                    medewerkerUuid,
                    dagBegintijd
                },
                update: (cache) => {
                    let medewerkerQueryData = cache.readQuery({
                        query: IngelogdeMedewerkerDocument
                    })?.ingelogdeMedewerker;

                    if (medewerkerQueryData) {
                        medewerkerQueryData = set('settings', 'dagBegintijd')(dagBegintijd)(medewerkerQueryData);

                        cache.writeQuery({
                            query: IngelogdeMedewerkerDocument,
                            data: { ingelogdeMedewerker: medewerkerQueryData }
                        });
                    }
                }
            })
            .subscribe();
    }
}
