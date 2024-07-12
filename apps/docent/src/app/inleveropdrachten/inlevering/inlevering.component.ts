import { ChangeDetectionStrategy, Component, Input, OnChanges, inject, output } from '@angular/core';
import { isBefore } from 'date-fns';
import { memoize } from 'lodash-es';

import { DecimalPipe } from '@angular/common';
import { IconDirective, SpinnerComponent } from 'harmony';
import { IconDownloaden, IconTijd, IconWaarschuwing, provideIcons } from 'harmony-icons';
import { Inlevering, PlagiaatInfo, PlagiaatType, SubmissionError } from '../../../generated/_types';
import { UriService } from '../../auth/uri-service';
import { SubmissionErrorDescription } from '../../core/models/inleveropdrachten/inleveropdrachten.model';
import { InleveropdrachtenDataService } from '../../core/services/inleveropdrachten-data.service';
import { OutlineButtonComponent } from '../../rooster-shared/components/outline-button/outline-button.component';
import { TooltipDirective } from '../../rooster-shared/directives/tooltip.directive';
import { DtDatePipe } from '../../rooster-shared/pipes/dt-date.pipe';
import { dagenUrenMinutenTussenDatums } from '../../rooster-shared/utils/date.utils';
import { BijlageExtensieComponent } from '../../shared/components/bijlage-extensie/bijlage-extensie.component';

@Component({
    selector: 'dt-inlevering',
    templateUrl: './inlevering.component.html',
    styleUrls: ['./inlevering.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [TooltipDirective, BijlageExtensieComponent, OutlineButtonComponent, SpinnerComponent, DecimalPipe, DtDatePipe, IconDirective],
    providers: [provideIcons(IconTijd, IconDownloaden, IconWaarschuwing)]
})
export class InleveringComponent implements OnChanges {
    private uriService = inject(UriService);
    private inleveropdrachtenDataService = inject(InleveropdrachtenDataService);
    @Input() inlevering: Inlevering;
    @Input() deadline: Date;
    @Input() plagiaatFeatureAan: boolean;

    onDownload = output<Inlevering>();
    onPlagiaatControleren = output<Inlevering>();

    private _teLaat: boolean;
    private _inVerwerking: boolean;
    private _unrecoverableError: boolean;
    private _errorDescription: string | null;

    public teLaatTooltipFn = memoize((inleverdatum: Date) => dagenUrenMinutenTussenDatums(inleverdatum, this.deadline) + ' te laat');

    ngOnChanges(): void {
        this._teLaat = this.deadline ? isBefore(this.deadline, this.inlevering.inleverdatum) : false;
        this._inVerwerking = this.inlevering?.plagiaatInfo?.inVerwerking ?? false;
        this._unrecoverableError =
            !!this.inlevering?.plagiaatInfo?.error && this.inlevering?.plagiaatInfo?.error !== SubmissionError.PROCESSING_ERROR;
        this._errorDescription = this.inlevering.plagiaatInfo?.error
            ? SubmissionErrorDescription[this.inlevering.plagiaatInfo?.error]
            : null;
    }

    get teLaat() {
        return this._teLaat;
    }

    get inVerwerking() {
        return this._inVerwerking;
    }

    get error() {
        return this.inlevering.plagiaatInfo?.error;
    }

    get unrecoverableError() {
        return this._unrecoverableError;
    }

    get percentage() {
        return this.inlevering.plagiaatInfo?.percentage;
    }

    get heeftPlagiaatPercentage() {
        return this.percentage != null && this.percentage >= 0;
    }

    get submissionErrorDescription() {
        return this._errorDescription;
    }

    openRapportage(plagiaatInfo: PlagiaatInfo) {
        if (plagiaatInfo.type === PlagiaatType.TURN_IT_IN) {
            this.inleveropdrachtenDataService.getSimilarityReportUrl(plagiaatInfo.submissionId!).subscribe((result) => {
                setTimeout(() => {
                    window.open(result.data.similarityReportUrl, '_blank');
                });
            });
        } else if (plagiaatInfo.type === PlagiaatType.EPHORUS) {
            window.location.assign(this.uriService.getEphorusRapportageLink(this.inlevering.id, plagiaatInfo.ephorusDocumentGUID!));
        }
    }

    controleren() {
        this.onPlagiaatControleren.emit(this.inlevering);
    }
}
