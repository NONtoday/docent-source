import { Component, Input, OnChanges, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { addDays, isSameWeek, startOfISOWeek } from 'date-fns';
import { RoosterComponent } from './../rooster.component';
import { DagenBalkDagComponent } from './dagen-balk-dag/dagen-balk-dag.component';

@Component({
    selector: 'dt-rooster-dagen-balk',
    templateUrl: './rooster-dagen-balk.component.html',
    styleUrls: ['./rooster-dagen-balk.component.scss'],
    standalone: true,
    imports: [DagenBalkDagComponent]
})
export class RoosterDagenBalkComponent implements OnInit, OnChanges {
    @Input() date: Date;
    dagen: Array<Date>;

    roosterComponent: RoosterComponent;
    @ViewChildren(DagenBalkDagComponent) dagComponenten: QueryList<DagenBalkDagComponent>;

    ngOnInit() {
        this.updateDays();
    }

    ngOnChanges(changes: SimpleChanges) {
        this.date = changes['date'].currentValue;
        const oldDate = changes['date'].previousValue;
        if (!isSameWeek(this.date, oldDate)) {
            this.updateDays();
        }
    }

    updateDays(): void {
        this.dagen = new Array<Date>();
        const maandag = startOfISOWeek(this.date);
        this.dagen.push(maandag);
        for (let i = 1; i < 7; i++) {
            this.dagen.push(addDays(maandag, i));
        }
        this.updateDagComponenten();
    }

    setRoosterComponent(roosterComponent: RoosterComponent) {
        this.roosterComponent = roosterComponent;
        this.updateDagComponenten();
    }

    scrollToDatumInRooster(datum: Date): void {
        this.roosterComponent?.scrollToDatum(datum);
    }

    updateDagComponenten(): void {
        setTimeout(() => {
            this.dagComponenten.forEach((dag) => (dag.dagenBalkComponent = this));
        });
    }
}
