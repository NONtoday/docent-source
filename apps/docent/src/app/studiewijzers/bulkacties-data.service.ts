import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import reject from 'lodash-es/reject';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { all, mod, updateAll } from 'shades';
import {
    DifferentiatieToekennenBulkDocument,
    SjabloonViewDocument,
    SjabloonViewQuery,
    StudiewijzerViewDocument,
    StudiewijzerViewQuery,
    Studiewijzeritem,
    Toekenning,
    UpdateZichtbaarheidBulkSjabloonDocument,
    UpdateZichtbaarheidBulkStudiewijzerDocument,
    VerwijderBulkSjabloonDocument,
    VerwijderStudiewijzeritemsDocument,
    WeekToekenning
} from '../../generated/_types';
import { Differentiatie } from '../core/models/studiewijzers/shared.model';
import { DeviceService } from '../core/services/device.service';

export interface StudiewijzerChecked {
    studiewijzeritemId: string;
    isChecked: boolean;
    toekenningId?: string;
}

export interface BulkactieSelectie {
    studiewijzeritem: Studiewijzeritem;
    differentiatie: Differentiatie;
    toekenningId: string;
}

@Injectable()
export class BulkactiesDataService {
    private dataClient = inject(Apollo);
    private deviceService = inject(DeviceService);
    private _values: BulkactieSelectie[] = [];
    private _inEditMode = new BehaviorSubject(false);
    private itemCheckedSubject = new BehaviorSubject<StudiewijzerChecked>({ studiewijzeritemId: '-1', isChecked: false });
    cleanSubject = new Subject();
    itemChecked$ = this.itemCheckedSubject.asObservable();

    public toggleStudiewijzeritem(item: Studiewijzeritem, isChecked: boolean, differentiatie: Differentiatie, toekenningId: string) {
        if (isChecked) {
            this._values.push({ studiewijzeritem: item, differentiatie, toekenningId });
        } else {
            this._values = this._values.filter((studiewijzeritemContainer) => item.id !== studiewijzeritemContainer.studiewijzeritem.id);
        }

        if (this.deviceService.isDesktop()) {
            this.setEditMode(this._values.length > 0);
        }

        this.itemCheckedSubject.next({
            studiewijzeritemId: item.id,
            isChecked,
            toekenningId
        });
    }

    get length(): number {
        return this._values.length;
    }

    get values(): BulkactieSelectie[] {
        return [...this._values];
    }

    set values(values: BulkactieSelectie[]) {
        this._values = values;
    }

    get inEditMode(): Observable<boolean> {
        return this._inEditMode.asObservable();
    }

    setEditMode(inEditMode: boolean) {
        if (inEditMode !== this._inEditMode.value) {
            this._inEditMode.next(inEditMode);

            if (!inEditMode) {
                this.clean();
            }
        }
    }

    shouldBeSelected(swiId: string) {
        return this._values.some((entry) => entry.studiewijzeritem.id === swiId);
    }

    toekenningGewijzigd(swiId: string, differentiatie: Differentiatie, nieuwToekenningId: string) {
        const index = this._values.findIndex((entry) => entry.studiewijzeritem.id === swiId);
        this._values[index] = { studiewijzeritem: this._values[index].studiewijzeritem, differentiatie, toekenningId: nieuwToekenningId };
    }

    clean() {
        this.cleanSubject.next(true);
        this._values = [];
    }

    updateZichtbaarheidStudiewijzeritems(zichtbaarVoorLeerling: boolean) {
        this.dataClient
            .mutate({
                mutation: UpdateZichtbaarheidBulkStudiewijzerDocument,
                variables: {
                    zichtbaarVoorLeerling,
                    studiewijzeritemIds: this.values.map((studiewijzeritemContainer) => studiewijzeritemContainer.studiewijzeritem.id)
                }
            })
            .subscribe(() => {
                this._inEditMode.next(false);
                this.clean();
            });
    }

    verwijderStudiewijzeritems(studiewijzerId: string) {
        const values = this.values;
        this.dataClient
            .mutate({
                mutation: VerwijderStudiewijzeritemsDocument,
                variables: {
                    studiewijzeritemIds: this.values.map((studiewijzeritemContainer) => studiewijzeritemContainer.studiewijzeritem.id),
                    verwijderUitSjabloon: false
                },
                update: (cache) => {
                    let view = cache.readQuery({
                        query: StudiewijzerViewDocument,
                        variables: {
                            studiewijzer: studiewijzerId
                        }
                    })!.studiewijzerView;

                    const rejectFilter = (toekenning: Toekenning) =>
                        values.some(
                            (studiewijzeritemContainer) => toekenning.studiewijzeritem.id === studiewijzeritemContainer.studiewijzeritem.id
                        );

                    const removeToekenningen = (toekenningen: StudiewijzerViewQuery['studiewijzerView']['weken'][number]['toekenningen']) =>
                        reject(toekenningen, rejectFilter);

                    const removeFromWeken = mod('weken', all(), 'toekenningen')(removeToekenningen);
                    const removeFromDagen = mod('weken', all(), 'dagen', all(), 'toekenningen')(removeToekenningen);
                    const removeFromAfspraken = mod(
                        'weken',
                        all(),
                        'dagen',
                        all(),
                        'afspraken',
                        all()
                    )(mod('toekenningen')(removeToekenningen));

                    view = updateAll<StudiewijzerViewQuery['studiewijzerView']>(
                        removeFromWeken,
                        removeFromDagen,
                        removeFromAfspraken
                    )(view);

                    cache.writeQuery({
                        query: StudiewijzerViewDocument,
                        data: { studiewijzerView: view },
                        variables: {
                            studiewijzer: studiewijzerId
                        }
                    });
                }
            })
            .subscribe(() => {
                this._inEditMode.next(false);
                this.clean();
            });
    }

    updateZichtbaarheidSjabloonitems(zichtbaarVoorLeerling: boolean) {
        this.dataClient
            .mutate({
                mutation: UpdateZichtbaarheidBulkSjabloonDocument,
                variables: {
                    zichtbaarVoorLeerling,
                    studiewijzeritemIds: this.values.map((studiewijzeritemContainer) => studiewijzeritemContainer.studiewijzeritem.id)
                }
            })
            .subscribe(() => {
                this._inEditMode.next(false);
                this.clean();
            });
    }

    verwijderSjabloonitems(sjabloonId: string) {
        const values = this.values;
        this.dataClient
            .mutate({
                mutation: VerwijderBulkSjabloonDocument,
                variables: {
                    studiewijzeritemIds: this.values.map((studiewijzeritemContainer) => studiewijzeritemContainer.studiewijzeritem.id)
                },
                update: (cache) => {
                    let view = cache.readQuery({
                        query: SjabloonViewDocument,
                        variables: {
                            sjabloon: sjabloonId
                        }
                    })!.sjabloonView;

                    const rejectFilter = (toekenning: WeekToekenning) =>
                        values.some(
                            (studiewijzeritemContainer) => toekenning.studiewijzeritem.id === studiewijzeritemContainer.studiewijzeritem.id
                        );

                    view = mod(
                        'weken',
                        all(),
                        'toekenningen'
                    )((toekenningen: SjabloonViewQuery['sjabloonView']['weken'][number]['toekenningen']) =>
                        reject(toekenningen, rejectFilter)
                    )(view);

                    cache.writeQuery({
                        query: SjabloonViewDocument,
                        data: { sjabloonView: view },
                        variables: {
                            sjabloon: sjabloonId
                        }
                    });
                }
            })
            .subscribe(() => {
                this._inEditMode.next(false);
                this.clean();
            });
    }

    differentiatieToekennenBulk$(
        toekenningIds: string[],
        differentiatieleerlingenIds: string[],
        differentiatiegroepenIds: string[],
        differentiatieVervangen: boolean
    ) {
        return this.dataClient.mutate({
            mutation: DifferentiatieToekennenBulkDocument,
            variables: {
                toekenningIds,
                differentiatieleerlingenIds,
                differentiatiegroepenIds,
                differentiatieVervangen
            },
            update: (cache, { data }) => {
                data?.differentiatieToekennenBulk.forEach((toekenning) => {
                    cache.modify({
                        id: cache.identify({ __typename: toekenning['__typename'], id: toekenning.id }),
                        fields: {
                            differentiatiegroepen: () => toekenning.differentiatiegroepen,
                            differentiatieleerlingen: () => toekenning.differentiatieleerlingen
                        }
                    });
                    if (toekenning.studiewijzeritem.inleverperiode) {
                        cache.modify({
                            id: cache.identify({ __typename: toekenning['__typename'], id: toekenning.id, isStartInleverperiode: true }),
                            fields: {
                                differentiatiegroepen: () => toekenning.differentiatiegroepen,
                                differentiatieleerlingen: () => toekenning.differentiatieleerlingen
                            }
                        });
                    }
                });
            }
        });
    }
}
