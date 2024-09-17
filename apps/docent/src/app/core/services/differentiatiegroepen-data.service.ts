import { Injectable, inject } from '@angular/core';
import {
    DeleteDifferentiatiegroepDocument,
    Differentiatiegroep,
    DifferentiatiegroepenDocument,
    DifferentiatiegroepenQuery,
    Leerling,
    LeerlingenVanLesgroepMetDifferentiatiegroepenDocument,
    LeerlingenVanLesgroepMetDifferentiatiegroepenQuery,
    SaveDifferentiatiegroepDocument,
    SaveDifferentiatiegroepMutation,
    VerplaatsLeerlingDocument
} from '@docent/codegen';
import { sortLeerlingByAchternaamVoornaam } from '@shared/utils/persoon-utils';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { matching, mod, set, updateAll } from 'shades';
import { addItem, equalsId, removeItem } from '../../rooster-shared/utils/utils';
import { toDifferentiatiegroepInput } from '../converters/differentiatiegroep.converter';

@Injectable({
    providedIn: 'root'
})
export class DifferentiatiegroepenDataService {
    private dataClient = inject(Apollo);

    public getDifferentiatiegroepen(lesgroepId: string): Observable<DifferentiatiegroepenQuery['differentiatiegroepen']> {
        return this.dataClient
            .watchQuery({
                query: DifferentiatiegroepenDocument,
                variables: {
                    lesgroep: lesgroepId
                }
            })
            .valueChanges.pipe(
                filter((result) => Boolean(result.data)),
                map((result) => result.data.differentiatiegroepen)
            );
    }

    public saveDifferentiatiegroep(differentiatiegroep: Differentiatiegroep, lesgroepId: string) {
        const differentiatiegroepInput = toDifferentiatiegroepInput(lesgroepId, differentiatiegroep);

        return this.dataClient.mutate({
            mutation: SaveDifferentiatiegroepDocument,
            variables: {
                differentiatiegroep: differentiatiegroepInput
            },
            optimisticResponse: {
                __typename: 'Mutation',
                saveDifferentiatiegroep: {
                    __typename: 'Differentiatiegroep',
                    ...differentiatiegroep,
                    id: differentiatiegroep.id ? differentiatiegroep.id : 'optimistic-new-projectgroep'
                } as SaveDifferentiatiegroepMutation['saveDifferentiatiegroep']
            },
            update: (cache, response) => {
                cache.evict({ fieldName: 'leerlingenVanLesgroepMetDifferentiatiegroepen' });
                const groep = { ...response.data!.saveDifferentiatiegroep };

                let view = cache.readQuery({
                    query: DifferentiatiegroepenDocument,
                    variables: {
                        lesgroep: lesgroepId
                    }
                });

                if (differentiatiegroepInput.id) {
                    view = set('differentiatiegroepen', matching({ id: differentiatiegroepInput.id }))(groep)(view as any);
                } else {
                    view = set('differentiatiegroepen')([...view!.differentiatiegroepen, groep])(view as any);
                }

                cache.writeQuery({
                    query: DifferentiatiegroepenDocument,
                    variables: {
                        lesgroep: lesgroepId
                    },
                    data: view
                });
            }
        });
    }

    public verplaatsLeerling(
        lesgroepId: string,
        leerlingId: string,
        vanDifferentiatiegroep: Differentiatiegroep,
        naarDifferentiatiegroep: Differentiatiegroep
    ) {
        return this.dataClient.mutate({
            mutation: VerplaatsLeerlingDocument,
            variables: {
                leerlingId,
                vanDifferentiatiegroepId: vanDifferentiatiegroep.id,
                naarDifferentiatiegroepId: naarDifferentiatiegroep.id
            },
            optimisticResponse: {
                __typename: 'Mutation',
                verplaatsLeerling: true
            },
            update: (cache) => {
                let view = cache.readQuery({
                    query: DifferentiatiegroepenDocument,
                    variables: {
                        lesgroep: lesgroepId
                    }
                });

                const van = view!.differentiatiegroepen.find(equalsId(vanDifferentiatiegroep.id));
                const verplaatsteLeerling = van!.leerlingen!.find(equalsId(leerlingId));
                view = updateAll<DifferentiatiegroepenQuery>(
                    mod('differentiatiegroepen', matching({ id: vanDifferentiatiegroep.id }), 'leerlingen')(removeItem(leerlingId) as any),
                    mod('differentiatiegroepen', matching({ id: naarDifferentiatiegroep.id }), 'leerlingen')(addItem(verplaatsteLeerling)),
                    mod(
                        'differentiatiegroepen',
                        matching({ id: naarDifferentiatiegroep.id }),
                        'leerlingen'
                    )((leerlingen: Leerling[]) => leerlingen.sort(sortLeerlingByAchternaamVoornaam) as any)
                )(view!);

                cache.writeQuery({
                    query: DifferentiatiegroepenDocument,
                    variables: {
                        lesgroep: lesgroepId
                    },
                    data: view
                });
            }
        });
    }

    public getLeerlingenMetDifferentiatiegroepenVanLesgroep(
        lesgroepId: string
    ): Observable<LeerlingenVanLesgroepMetDifferentiatiegroepenQuery['leerlingenVanLesgroepMetDifferentiatiegroepen']> {
        return this.dataClient
            .watchQuery({
                query: LeerlingenVanLesgroepMetDifferentiatiegroepenDocument,
                variables: {
                    lesgroep: lesgroepId
                }
            })
            .valueChanges.pipe(
                filter((result) => Boolean(result.data)),
                map((result) => result.data.leerlingenVanLesgroepMetDifferentiatiegroepen)
            );
    }

    public deleteDifferentiatiegroep(differentiatiegroepId: string) {
        return this.dataClient
            .mutate({
                mutation: DeleteDifferentiatiegroepDocument,
                variables: {
                    differentiatiegroep: differentiatiegroepId
                },
                optimisticResponse: { __typename: 'Mutation', deleteDifferentiatiegroep: true },
                update: (cache) => {
                    cache.evict({ id: `Differentiatiegroep:${differentiatiegroepId}` });
                }
            })
            .subscribe();
    }
}
