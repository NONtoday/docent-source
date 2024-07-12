import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs/operators';
import { matching, mod, set, updateAll } from 'shades';
import {
    CachedStudiewijzeritemDocument,
    CachedStudiewijzeritemQuery,
    DagToekenningStudiewijzeritemDocument,
    DeleteProjectgroepDocument,
    LeerlingenVanLesgroepDocument,
    PartialLeerlingFragment,
    Projectgroep,
    ProjectgroepFieldsFragment,
    SaveProjectgroepDocument,
    SaveProjectgroepMutationVariables,
    VerplaatsProjectgroepLeerlingDocument,
    namedOperations
} from '../../../generated/_types';
import { addItem, equalsId, removeItem } from '../../rooster-shared/utils/utils';
import { sortLeerlingByAchternaamVoornaam } from '../../shared/utils/leerling.utils';

@Injectable({
    providedIn: 'root'
})
export class ProjectgroepenDataService {
    private apollo = inject(Apollo);

    public saveProjectgroep(projectgroep: ProjectgroepFieldsFragment, studiewijzeritemId: string) {
        const projectgroepInput: SaveProjectgroepMutationVariables['projectgroep'] = {
            id: projectgroep.id,
            studiewijzeritemId,
            naam: projectgroep.naam,
            leerlingen: projectgroep.leerlingen.map((leerling) => leerling.id),
            heeftInlevering: projectgroep.heeftInlevering
        };

        return this.apollo.mutate({
            mutation: SaveProjectgroepDocument,
            variables: {
                projectgroep: projectgroepInput
            },
            update: (cache, { data }) => {
                cache.evict({ fieldName: namedOperations.Query.inleveringenOverzicht });
                let studiewijzeritemResult = cache.readQuery({
                    query: CachedStudiewijzeritemDocument,
                    variables: {
                        id: studiewijzeritemId
                    }
                });

                const saveProjectgroep = data!.saveProjectgroep;

                if (projectgroep.id) {
                    studiewijzeritemResult = set(
                        'studiewijzeritem',
                        'projectgroepen',
                        matching({ id: saveProjectgroep.id })
                    )(saveProjectgroep)(studiewijzeritemResult!);
                } else {
                    studiewijzeritemResult = mod('studiewijzeritem', 'projectgroepen')(addItem(saveProjectgroep))(studiewijzeritemResult!);
                }

                studiewijzeritemResult = set(
                    'studiewijzeritem',
                    'inleverperiode',
                    'inleveringenVerwacht'
                )(studiewijzeritemResult.studiewijzeritem.projectgroepen.length)(studiewijzeritemResult as any);

                cache.writeQuery({
                    query: CachedStudiewijzeritemDocument,
                    data: studiewijzeritemResult
                });
            }
        });
    }

    public getCachedStudiewijzeritem(studiewijzeritemId: string) {
        return this.apollo
            .watchQuery({
                query: CachedStudiewijzeritemDocument,
                variables: {
                    id: studiewijzeritemId
                }
            })
            .valueChanges.pipe(map(({ data }) => data?.studiewijzeritem));
    }

    public getLeerlingenVanLesgroep(lesgroepId: string) {
        return this.apollo
            .watchQuery({
                query: LeerlingenVanLesgroepDocument,
                variables: {
                    lesgroepId
                }
            })
            .valueChanges.pipe(map((result) => (result.data ? result.data.leerlingenVanLesgroep : [])));
    }

    public deleteProjectgroep(projectgroepId: string, studiewijzeritemId: string, toekenningId: string, isLast: boolean) {
        this.apollo
            .mutate({
                mutation: DeleteProjectgroepDocument,
                variables: {
                    projectgroep: projectgroepId
                },
                update: (cache) => {
                    cache.evict({ fieldName: namedOperations.Query.inleveringenOverzicht });
                    // wanneer de laatste projectgroep verwijderd wordt halen we de studiewijzeritem
                    // opnieuw op van core, zodat het aantal verwachte inleveringen weer juist is
                    if (isLast) {
                        this.apollo
                            .query({
                                query: DagToekenningStudiewijzeritemDocument,
                                variables: {
                                    id: toekenningId
                                },
                                fetchPolicy: 'network-only'
                            })
                            .subscribe();
                    } else {
                        let studiewijzeritemResult = cache.readQuery({
                            query: CachedStudiewijzeritemDocument,
                            variables: {
                                id: studiewijzeritemId
                            }
                        });

                        studiewijzeritemResult = mod('studiewijzeritem', 'projectgroepen')(removeItem(projectgroepId))(
                            studiewijzeritemResult!
                        );

                        studiewijzeritemResult = set(
                            'studiewijzeritem',
                            'inleverperiode',
                            'inleveringenVerwacht'
                        )(studiewijzeritemResult.studiewijzeritem.projectgroepen.length)(studiewijzeritemResult as any);

                        cache.writeQuery({
                            query: CachedStudiewijzeritemDocument,
                            data: studiewijzeritemResult
                        });
                    }
                }
            })
            .subscribe();
    }

    public verplaatsLeerling(
        studiewijzeritemId: string,
        leerlingId: string,
        vanProjectgroep: Projectgroep,
        naarProjectgroep: Projectgroep
    ) {
        return this.apollo.mutate({
            mutation: VerplaatsProjectgroepLeerlingDocument,
            variables: {
                leerlingId,
                vanProjectgroepId: vanProjectgroep.id,
                naarProjectgroepId: naarProjectgroep.id
            },
            optimisticResponse: {
                __typename: 'Mutation',
                verplaatsProjectgroepLeerling: true
            },
            update: (cache) => {
                let studiewijzeritemResult = cache.readQuery({
                    query: CachedStudiewijzeritemDocument,
                    variables: {
                        id: studiewijzeritemId
                    }
                });

                const van = studiewijzeritemResult!.studiewijzeritem.projectgroepen.find(equalsId(vanProjectgroep.id));
                const verplaatsteLeerling = van!.leerlingen.find(equalsId(leerlingId));
                studiewijzeritemResult = updateAll<CachedStudiewijzeritemQuery>(
                    mod('studiewijzeritem', 'projectgroepen', matching({ id: vanProjectgroep.id }), 'leerlingen')(removeItem(leerlingId)),
                    mod(
                        'studiewijzeritem',
                        'projectgroepen',
                        matching({ id: naarProjectgroep.id }),
                        'leerlingen'
                    )(addItem(verplaatsteLeerling)),
                    mod(
                        'studiewijzeritem',
                        'projectgroepen',
                        matching({ id: naarProjectgroep.id }),
                        'leerlingen'
                    )((leerlingen: PartialLeerlingFragment[]) => leerlingen.sort(sortLeerlingByAchternaamVoornaam))
                )(studiewijzeritemResult!);

                cache.writeQuery({
                    query: CachedStudiewijzeritemDocument,
                    data: studiewijzeritemResult
                });
            }
        });
    }
}
