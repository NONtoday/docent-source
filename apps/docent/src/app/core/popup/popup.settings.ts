import { IconName } from 'harmony-icons';
import * as HarmonyColor from '../../rooster-shared/colors';
import { Optional } from '../../rooster-shared/utils/utils';

export enum PopupDirection {
    Left,
    Right,
    Top,
    Bottom,
    Auto
}

export enum VerticalOffset {
    Top,
    Bottom,
    Center
}

export enum HorizontalOffset {
    Left,
    Right,
    Center
}

export enum Appearance {
    Popout,
    Window, // modal
    Fullscreen,
    Rollup, // modal
    Rolldown // modal
}

export const defaultPopupOffsets = {
    top: { left: 0, top: 0 },
    bottom: { left: 0, top: 0 },
    left: { left: 0, top: 0 },
    right: { left: 0, top: 0 }
};

export class PopupSettings {
    /** Specifices if clicking the modal background should hide the dialog. */
    clickOutSideToClose = true;
    /** Adds a close icon to the header to hide the dialog. */
    showCloseButton = true;
    /** Display the popup with a header */
    showHeader = true;

    /** Defines the appearance of the popup. Syntax is [ desktop, tablet, mobile] */
    appearance = {
        desktop: Appearance.Popout,
        tablet: Appearance.Window,
        tabletportrait: Appearance.Window,
        mobile: Appearance.Fullscreen
    };

    /** de ruimte tussen het geklikte element en de pijl van de popup */
    offsetToConnectedElementHorizontal = 3;
    offsetToConnectedElementVertical = 3;

    /** de ruimte die tussen de popup en de randen van het scherm moet zitten */
    margin = {
        top: 20,
        bottom: 20,
        left: 20,
        right: 20
    };

    /** If inputFields is set to true, the popup will be scrollable when it's to big to fit on the screen */
    scrollable = false;

    /** Defines the title */
    title = '';

    /** Optional, to set the css-class name to be used in the popup header */
    headerClass = 'header';

    /** Optional, providing the name of an icon will display the icon in the header, to the left of the title */
    headerIcon: IconName | undefined = undefined;

    /** Optional, display a separate pill-style label in the popup header, to the right of the title */
    headerLabel: Optional<string>;

    overlayOpacity = '.25';
    overlayColor = HarmonyColor.typography_1;
    width = 400;
    height: Optional<number> = undefined; // undefined = fit to content

    /** Determines in what order the directions are evaluated to get the best direction for the popup */
    preferedDirection = [PopupDirection.Top, PopupDirection.Bottom, PopupDirection.Left, PopupDirection.Right];

    /** Offset to make the popup appear above (Top) or below (Bottom) of the arrow */
    verticalOffset = VerticalOffset.Center;

    /** Offset to make the popup appear left or right of the arrow */
    horizontalOffset = HorizontalOffset.Center;

    /** The arrows horizontal offset towards the eddge in pixels  */
    horizontalEdgeOffset = 0;

    /** Offsets to move the popup container relative to its calculated position. Use with care! */
    offsets = defaultPopupOffsets;

    /**
     * If set to true then the popup will be calculated a default offset between the clicked element and the arrow
     * */
    applyClickedElementOffset = true;

    /**
     * *********DEPRECATED***********
     * use the properties attribute in de service.popup method */
    data: any;

    /**
     * If set to true the popup has a fixed position to it's parent
     * */
    isFixed = false;
    fixedPopupOffset = 0;
    applicationOffset = 25;

    /**
     * Triggers a full re-render of the popup when the window scrolls.
     * This can be necessary to force correct positioning, e.g. when the popup isFixed to a parent that has sticky positioning.
     */
    rerenderOnScroll = false;

    appendAsChild = false;

    /**
     * Selector of HTML-element where de popup should be rendered in. For scrolling purpose this element needs to be positioned
     * relative if it has it's own scrollbar.
     */
    appendInChildSelector: Optional<string> = null;

    /** Will be called when popup.onClose is called */
    onCloseFunction = () => {
        // do nothing
    };

    // Don't close popup on navigation start
    closeOnNavigationStart = true;
}
