import { Directive, Input } from '@angular/core';
import { Afspraak } from '@docent/codegen';

@Directive()
export abstract class RoosterItemBaseDirective {
    @Input() afspraak: Afspraak;
}
