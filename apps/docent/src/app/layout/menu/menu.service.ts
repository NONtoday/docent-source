import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class MenuService {
    private menuState = new Map<string, boolean>();
    public menuStateChanges = new BehaviorSubject(this.menuState);

    public openMenu(menu: string) {
        this.menuState.set(menu, true);
        this.menuStateChanges.next(this.menuState);
    }
    public closeMenu(menu: string) {
        this.menuState.set(menu, false);
        this.menuStateChanges.next(this.menuState);
    }
    public closeAllMenus() {
        this.menuState.forEach((value, key) => this.menuState.set(key, false));
        this.menuStateChanges.next(this.menuState);
    }
}
