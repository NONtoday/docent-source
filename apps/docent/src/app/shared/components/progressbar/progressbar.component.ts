import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'dt-progressbar',
    templateUrl: './progressbar.component.html',
    styleUrls: ['./progressbar.component.scss'],
    standalone: true
})
export class ProgressbarComponent implements OnInit, OnDestroy {
    @Input() progress: Subject<number>;
    private _destroyed$ = new Subject<void>();

    public barwidth = '0%';

    ngOnInit() {
        this.progress.pipe(takeUntil(this._destroyed$)).subscribe((value) => (this.barwidth = `${value}%`));
    }

    public ngOnDestroy(): void {
        this._destroyed$.next();
    }
}
