import { Directive, Input } from '@angular/core';
import { Afspraak } from '../../../../generated/_types';

@Directive()
export abstract class RoosterItemBaseDirective {
    @Input() afspraak: Afspraak;
}
