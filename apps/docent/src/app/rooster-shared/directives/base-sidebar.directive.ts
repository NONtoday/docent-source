import { Directive, Input, inject } from '@angular/core';
import { IconName } from 'harmony-icons';
import { SidebarService } from '../../core/services/sidebar.service';
import { Optional } from '../utils/utils';

export const defaultSidebarOptions = {
    title: '',
    icon: null,
    hideSidebar: false,
    display: true,
    mask: true,
    disableScrolling: true,
    iconClickable: false,
    titleClickable: false
};

export interface SidebarOptions {
    icon: Optional<IconName>;
    title: Optional<string>;
    hideSidebar?: boolean;
    display?: boolean;
    mask?: boolean;
    disableScrolling?: boolean;
    iconClickable?: Optional<boolean>;
    titleClickable?: boolean;
    onMaskClick?: () => void;
    onCloseClick?: () => void;
    onIconClick?: () => void;
    onTitleClick?: () => void;
}

@Directive()
export class BaseSidebar {
    public sidebarService = inject(SidebarService);
    @Input() sidebar: SidebarOptions = defaultSidebarOptions;

    constructor() {
        this.sidebar.onMaskClick = () => this.sidebarService.closeSidebar();
        this.sidebar.onCloseClick = () => this.sidebarService.closeSidebar();
    }
}
