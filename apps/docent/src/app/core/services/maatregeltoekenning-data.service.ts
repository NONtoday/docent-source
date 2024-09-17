import { Injectable, inject } from '@angular/core';
import {
    DeleteMaatregeltoekenningDocument,
    MaatregelToekenningInput,
    MaatregelenDocument,
    MaatregeltoekenningenDocument,
    MaatregeltoekenningenPreviewDocument,
    MaatregeltoekenningenQuery,
    MarkeerMaatregeltoekenningAfgehandeldDocument,
    UpdateMaatregeltoekenningDocument,
    namedOperations
} from '@docent/codegen';
import { Apollo } from 'apollo-angular';
import { orderBy, partition } from 'lodash-es';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { mod, updateAll } from 'shades';
import { addItem, removeItem } from '../../rooster-shared/utils/utils';

@Injectable({
    providedIn: 'root'
})
export class MaatregelToekenningDataService {
    private apollo = inject(Apollo);

    public getMaatregeltoekenningenPreview(leerlingId: string) {
        return this.apollo
            .watchQuery({
                query: MaatregeltoekenningenPreviewDocument,
                variables: { leerlingId }
            })
            .valueChanges.pipe(map(({ data }) => data.maatregeltoekenningenPreview));
    }

    public getMaatregeltoekenningen(leerlingId: string) {
        return this.apollo
            .watchQuery({
                query: MaatregeltoekenningenDocument,
                variables: { leerlingId }
            })
            .valueChanges.pipe(map(({ data }) => data.maatregeltoekenningen));
    }

    public getMaatregeltoekenningenMetStatus(leerlingId: string): Observable<MaatregelToekenningenMetStatus> {
        return this.getMaatregeltoekenningen(leerlingId).pipe(
            map((toekenningen) => {
                const sortedToekenningen = orderBy(toekenningen, (t) => t.maatregelDatum, ['desc']);
                const [actief, afgehandeld] = partition(sortedToekenningen, (toekenning) => !toekenning.nagekomen);

                return { actief, afgehandeld };
            })
        );
    }

    public getMaatregelen(vestigingId: string, actief: boolean) {
        return this.apollo
            .watchQuery({
                query: MaatregelenDocument,
                variables: { vestigingId, actief }
            })
            .valueChanges.pipe(map(({ data }) => data?.maatregelen));
    }

    public saveMaatregeltoekenning(toekenningInput: MaatregelToekenningInput, toekenningId?: string) {
        return this.apollo
            .mutate({
                mutation: UpdateMaatregeltoekenningDocument,
                variables: {
                    toekenningId,
                    toekenningInput
                },
                update: (cache, { data }) => {
                    let maatregeltoekenningQueryData = cache.readQuery({
                        query: MaatregeltoekenningenDocument,
                        variables: { leerlingId: toekenningInput.leerlingId }
                    });

                    const updateMaatregeltoekenning = data!.updateMaatregeltoekenning;

                    if (maatregeltoekenningQueryData) {
                        maatregeltoekenningQueryData = updateAll<MaatregeltoekenningenQuery>(
                            mod('maatregeltoekenningen')(removeItem(toekenningId!) as any),
                            mod('maatregeltoekenningen')(addItem(updateMaatregeltoekenning))
                        )(maatregeltoekenningQueryData);

                        cache.writeQuery({
                            query: MaatregeltoekenningenDocument,
                            variables: { leerlingId: toekenningInput.leerlingId },
                            data: maatregeltoekenningQueryData
                        });
                    }

                    cache.evict({ fieldName: namedOperations.Query.maatregeltoekenningenPreview });
                }
            })
            .pipe(map(({ data }) => data!.updateMaatregeltoekenning))
            .subscribe();
    }

    public updateMaatregeltoekenningAfgehandeld(toekenningId: string, afgehandeld: boolean) {
        return this.apollo.mutate({
            mutation: MarkeerMaatregeltoekenningAfgehandeldDocument,
            variables: {
                toekenningId,
                afgehandeld
            },
            refetchQueries: [namedOperations.Query.maatregeltoekenningenPreview],
            update: (cache) => {
                cache.modify({
                    id: cache.identify({ __typename: 'MaatregelToekenning', id: toekenningId }),
                    fields: {
                        nagekomen: () => afgehandeld
                    }
                });
            }
        });
    }

    public verwijderMaatregeltoekenning(toekenningId: string, leerlingId: string) {
        return this.apollo.mutate({
            mutation: DeleteMaatregeltoekenningDocument,
            variables: {
                toekenningId
            },
            refetchQueries: [namedOperations.Query.maatregeltoekenningenPreview],
            update: (cache) => {
                let maatregeltoekenningQueryData = cache.readQuery({
                    query: MaatregeltoekenningenDocument,
                    variables: { leerlingId }
                });

                if (maatregeltoekenningQueryData) {
                    maatregeltoekenningQueryData = mod('maatregeltoekenningen')(removeItem(toekenningId))(
                        maatregeltoekenningQueryData as any
                    );

                    cache.writeQuery({
                        query: MaatregeltoekenningenDocument,
                        variables: { leerlingId },
                        data: maatregeltoekenningQueryData
                    });
                }
            }
        });
    }
}

export interface MaatregelToekenningenMetStatus {
    actief: MaatregeltoekenningenQuery['maatregeltoekenningen'];
    afgehandeld: MaatregeltoekenningenQuery['maatregeltoekenningen'];
}
