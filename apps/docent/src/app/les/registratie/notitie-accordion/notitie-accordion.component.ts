import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, inject } from '@angular/core';
import { ActueleNotitieItemsQuery, NotitieContext } from '@docent/codegen';
import { IconGroep, provideIcons } from 'harmony-icons';
import { Observable } from 'rxjs';
import { DeviceService } from '../../../core/services/device.service';
import { SidebarService } from '../../../core/services/sidebar.service';
import { ActueleNotitiesSidebarComponent } from '../../../notitieboek/actuele-notities-sidebar/actuele-notities-sidebar.component';
import { Optional } from '../../../rooster-shared/utils/utils';
import { AccordionComponent } from '../../../shared/components/accordion/accordion.component';
import { AantalNotitiesCounterPipe } from './aantal-notities-counter.pipe';
import { ActueleNotitieItemFieldsGroep, OngelezenNotitieGroepComponent } from './ongelezen-notitie-groep/ongelezen-notitie-groep.component';
import { OngelezenNotitieLeerlingComponent } from './ongelezen-notitie-leerling/ongelezen-notitie-leerling.component';

@Component({
    selector: 'dt-notitie-accordion',
    templateUrl: './notitie-accordion.component.html',
    styleUrls: ['./notitie-accordion.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [AccordionComponent, OngelezenNotitieGroepComponent, OngelezenNotitieLeerlingComponent, AsyncPipe, AantalNotitiesCounterPipe],
    providers: [provideIcons(IconGroep)]
})
export class NotitieAccordionComponent implements OnInit, OnChanges {
    private deviceService = inject(DeviceService);
    private sidebarService = inject(SidebarService);
    @Input() actueleNotities: ActueleNotitieItemsQuery['actueleNotitieItems'];
    @Input() afspraakId: Optional<string>;

    aantalActueleNotities = 0;
    hasOngelezenNotitie: boolean;
    ongelezenNotitiesGroepen: Optional<ActueleNotitieItemFieldsGroep[]>;
    ongelezenNotitiesLeerlingen: Optional<ActueleNotitieItemsQuery['actueleNotitieItems']>;

    isPhoneOrTablet$: Observable<boolean>;

    ngOnInit(): void {
        this.isPhoneOrTablet$ = this.deviceService.isPhoneOrTablet$;
    }

    ngOnChanges(): void {
        const actueleNotities = this.actueleNotities ?? [];
        this.aantalActueleNotities = actueleNotities.length;
        this.hasOngelezenNotitie = actueleNotities.some((notitieItem) => notitieItem.ongelezenNotitieAanwezig);
        this.ongelezenNotitiesGroepen = actueleNotities
            .filter((notitieItem) => notitieItem.stamgroep || notitieItem.lesgroep)
            .map((notitieItem) => {
                return {
                    ...notitieItem,
                    groep: notitieItem.stamgroep ?? notitieItem.lesgroep
                };
            });
        this.ongelezenNotitiesLeerlingen = actueleNotities.filter((notitieItem) => notitieItem.leerling);
    }

    openLeerlingActueleNotitiesSidebar(leerling: ActueleNotitieItemsQuery['actueleNotitieItems'][number]['leerling']) {
        if (!leerling) {
            return;
        }
        this.sidebarService.openSidebar(ActueleNotitiesSidebarComponent, {
            context: {
                context: NotitieContext.LEERLING,
                id: leerling.id,
                leerling
            },
            afspraakId: this.afspraakId
        });
    }

    openGroepActueleNotitiesSidebar(groep: ActueleNotitieItemFieldsGroep['groep']) {
        if (groep?.__typename === 'Lesgroep') {
            this.sidebarService.openSidebar(ActueleNotitiesSidebarComponent, {
                context: {
                    context: NotitieContext.LESGROEP,
                    id: groep.id,
                    lesgroep: groep
                }
            });
        } else if (groep?.__typename === 'Stamgroep') {
            this.sidebarService.openSidebar(ActueleNotitiesSidebarComponent, {
                context: {
                    context: NotitieContext.STAMGROEP,
                    id: groep.id,
                    stamgroep: groep
                }
            });
        }
    }
}
