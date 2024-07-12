import { SidebarPage } from '../../core/models/studiewijzers/studiewijzer.model';

export const bijlagenSidebarPage: SidebarPage = {
    titel: 'Jaarbijlagen',
    icon: 'bijlage',
    iconClickable: false,
    pagenumber: 0
};

export const selecteerStudiewijzerSidebarPage: SidebarPage = {
    titel: 'Kies studiewijzer',
    icon: 'pijlLinks',
    iconClickable: true,
    pagenumber: 1
};

export const selecteerSjabloonSidebarPage: SidebarPage = {
    titel: 'Kies sjabloon',
    icon: 'pijlLinks',
    iconClickable: true,
    pagenumber: 1
};

export const selecteerBijlagenSidebarPage: SidebarPage = {
    titel: '',
    icon: 'pijlLinks',
    iconClickable: true,
    pagenumber: 2
};

export const editBijlageURLSidebarPage: SidebarPage = {
    titel: 'Wijzig link',
    icon: 'pijlLinks',
    iconClickable: true,
    pagenumber: 0
};
