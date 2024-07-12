import { ElementRef } from '@angular/core';
import find from 'lodash-es/find';
import map from 'lodash-es/map';
import { Optional } from '../../rooster-shared/utils/utils';
import { PopupPositionCandidates } from './popup-position-candidates';
import { PopupPositionData } from './popup-position-data';
import { defaultPopupOffsets, HorizontalOffset, PopupDirection, PopupSettings, VerticalOffset } from './popup.settings';

export class PopupPositionCalculator {
    public width: number;
    public height: number;
    private positionCandidates: PopupPositionCandidates;

    private appendInElement: Optional<Element>;

    constructor(
        private connectedElement: HTMLElement,
        private popupSettings: PopupSettings,
        private popupRef: ElementRef
    ) {
        if (popupSettings.appendInChildSelector) {
            this.appendInElement = document.querySelector(popupSettings.appendInChildSelector);
        }
    }

    /*
     * Returned de best mogelijke position voor de popup popup.
     */
    public calculatePosition(): PopupPositionData {
        // Referentiepunt is het midden van het geklikte element
        const ref = this.centerOfConnectedElement;

        // Bereken de posities van de popup en de arrow voor elke richting (left, top, bottom, right)
        this.positionCandidates = this.calculatePositionCandidates({
            units: 'px',
            height: this.calculateHeight()!,
            width: this.calculateWidth(),
            left: ref.left,
            top: ref.top,
            innerTop: 0,
            innerLeft: 0,
            direction: PopupDirection.Auto
        });

        // apply eventuele offsets van de settings
        this.positionCandidates = this.applyOffsets(this.positionCandidates, this.popupSettings.offsets);

        // Als de popup buiten de viewport ligt, shift de popup dan weer naar binnen
        this.positionCandidates = this.fitInsideScreen(this.positionCandidates);

        // Bepaal welke richting geschikt is om de popup in weer te geven
        const direction = this.calculateDirection(this.positionCandidates);

        // scroll
        this.applyScrolling(this.positionCandidates, direction);

        if (this.popupSettings.appendAsChild) {
            this.positionCandidates = {
                directionBottom: {
                    ...this.positionCandidates.directionBottom,
                    left: this.popupSettings.offsets.bottom.left,
                    top: this.popupSettings.offsets.bottom.top
                },
                directionLeft: {
                    ...this.positionCandidates.directionLeft,
                    left: this.popupSettings.offsets.left.left,
                    top: this.popupSettings.offsets.left.top
                },
                directionRight: {
                    ...this.positionCandidates.directionRight,
                    left: this.popupSettings.offsets.right.left,
                    top: this.popupSettings.offsets.right.top
                },
                directionTop: {
                    ...this.positionCandidates.directionTop,
                    left: this.popupSettings.offsets.top.left,
                    top: this.popupSettings.offsets.top.top
                }
            };
        }

        // Return de beste positie
        switch (direction) {
            case PopupDirection[PopupDirection.Right]:
                return this.positionCandidates.directionRight;
            case PopupDirection[PopupDirection.Left]:
                return this.positionCandidates.directionLeft;
            case PopupDirection[PopupDirection.Top]:
                return this.positionCandidates.directionTop;
            case PopupDirection[PopupDirection.Bottom]:
            default:
                return this.positionCandidates.directionBottom;
        }
    }

    get windowBounds() {
        return {
            scrollY: window.scrollY,
            scrollX: window.scrollX,
            viewPortWidth: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
            viewPortHeight: Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
            documentOffsetHeight: document.body.offsetHeight
        };
    }

    private applyScrolling(candidates: PopupPositionCandidates, direction: string) {
        if (direction === 'Left' && candidates.directionLeft.scrollTo) {
            window.scrollTo({ left: 0, top: candidates.directionLeft.scrollTo, behavior: 'smooth' });
            this.windowBounds.scrollY = candidates.directionLeft.scrollTo;
        } else if (direction === 'Right' && candidates.directionRight.scrollTo) {
            window.scrollTo({ left: 0, top: candidates.directionRight.scrollTo, behavior: 'smooth' });
            this.windowBounds.scrollY = candidates.directionRight.scrollTo;
        }
    }

    private applyOffsets(candidates: PopupPositionCandidates, offsets: typeof defaultPopupOffsets) {
        if (offsets.left) {
            candidates.directionLeft.left += offsets.left.left;
            candidates.directionLeft.top += offsets.left.top;
        }

        if (offsets.right) {
            candidates.directionRight.left += offsets.right.left;
            candidates.directionRight.top += offsets.right.top;
        }

        if (offsets.top) {
            candidates.directionTop.left += offsets.top.left;
            candidates.directionTop.top += offsets.top.top;
        }

        if (offsets.bottom) {
            candidates.directionBottom.left += offsets.bottom.left;
            candidates.directionBottom.top += offsets.bottom.top;
        }
        return candidates;
    }

    private calculatePositionCandidates(defaultPosition: PopupPositionData) {
        let candidates: PopupPositionCandidates = {
            directionTop: { ...defaultPosition, direction: PopupDirection.Top },
            directionRight: { ...defaultPosition, direction: PopupDirection.Right },
            directionBottom: { ...defaultPosition, direction: PopupDirection.Bottom },
            directionLeft: { ...defaultPosition, direction: PopupDirection.Left }
        };

        candidates = this.calculateForRight(candidates);
        candidates = this.calculateForLeft(candidates);
        candidates = this.calculateForTop(candidates);
        candidates = this.calculateForBottom(candidates);

        if (this.popupSettings.applyClickedElementOffset) {
            candidates = this.applyClickedElementOffsetForRight(candidates);
            candidates = this.applyClickedElementOffsetForLeft(candidates);
            candidates = this.applyClickedElementOffsetForTop(candidates);
            candidates = this.applyClickedElementOffsetForBottom(candidates);
        }

        return candidates;
    }

    private calculateForRight(popupPos: PopupPositionCandidates): PopupPositionCandidates {
        const ref = this.centerOfConnectedElement;
        popupPos.directionRight = {
            ...popupPos.directionRight,
            left: ref.left + this.connectedElement.offsetWidth / 2,
            top: ref.top,
            innerTop: this.calculateInnerTop(),
            innerLeft: 0
        };
        return popupPos;
    }

    private applyClickedElementOffsetForRight(popupPos: PopupPositionCandidates): PopupPositionCandidates {
        popupPos.directionRight.left = popupPos.directionRight.left + this.popupSettings.offsetToConnectedElementHorizontal;
        return popupPos;
    }

    private calculateForLeft(popupPos: PopupPositionCandidates): PopupPositionCandidates {
        const ref = this.centerOfConnectedElement;
        popupPos.directionLeft = {
            ...popupPos.directionLeft,
            left: ref.left - this.popupSettings.width - this.connectedElement.offsetWidth / 2,
            top: ref.top,
            innerTop: this.calculateInnerTop()
        };
        return popupPos;
    }

    private applyClickedElementOffsetForLeft(popupPos: PopupPositionCandidates): PopupPositionCandidates {
        popupPos.directionLeft.left = popupPos.directionLeft.left - this.popupSettings.offsetToConnectedElementHorizontal;
        return popupPos;
    }

    private calculateForTop(popupPos: PopupPositionCandidates): PopupPositionCandidates {
        const ref = this.centerOfConnectedElement;
        popupPos.directionTop = {
            ...popupPos.directionTop,
            left: ref.left,
            top: ref.top - this.popupSettings.height! - this.connectedElement.offsetHeight / 2,
            innerLeft: this.calculateInnerLeft()
        };
        return popupPos;
    }

    private applyClickedElementOffsetForTop(popupPos: PopupPositionCandidates): PopupPositionCandidates {
        popupPos.directionTop.top = popupPos.directionTop.top - this.popupSettings.offsetToConnectedElementVertical;
        return popupPos;
    }

    private calculateForBottom(popupPos: PopupPositionCandidates): PopupPositionCandidates {
        const ref = this.centerOfConnectedElement;
        popupPos.directionBottom = {
            ...popupPos.directionBottom,
            left: ref.left,
            top: ref.top + this.connectedElement.offsetHeight / 2,
            innerLeft: this.calculateInnerLeft()
        };
        return popupPos;
    }

    private applyClickedElementOffsetForBottom(popupPos: PopupPositionCandidates): PopupPositionCandidates {
        popupPos.directionBottom.top = popupPos.directionBottom.top + this.popupSettings.offsetToConnectedElementVertical;
        return popupPos;
    }

    private get centerOfConnectedElement(): { left: number; top: number } {
        const connectedElementBounds = this.connectedElement.getBoundingClientRect();
        const distanceToTop: number = connectedElementBounds.top + window.scrollY + this.appendInElementTop;
        const distanceToLeft: number = connectedElementBounds.left + window.scrollX + this.appendInElementLeft;

        // return het midden van het element waarop geklikt is
        return {
            left: distanceToLeft + this.connectedElement.offsetWidth / 2,
            top: distanceToTop + this.connectedElement.offsetHeight / 2
        };
    }

    private calculateInnerTop() {
        let innerTop = -(this.popupSettings.height! / 2);
        if (this.popupSettings.verticalOffset === VerticalOffset.Top) {
            innerTop = -(this.popupSettings.height! - 2);
        } else if (this.popupSettings.verticalOffset === VerticalOffset.Bottom) {
            innerTop = 0;
        }
        return innerTop;
    }

    private calculateInnerLeft() {
        let innerLeft = -(this.popupSettings.width / 2);
        if (this.popupSettings.horizontalOffset === HorizontalOffset.Left) {
            innerLeft = -(this.popupSettings.width - 2) + this.popupSettings.horizontalEdgeOffset;
        } else if (this.popupSettings.horizontalOffset === HorizontalOffset.Right) {
            innerLeft = -2 - this.popupSettings.horizontalEdgeOffset;
        }
        return innerLeft;
    }

    private calculateDirection(candidates: PopupPositionCandidates): string {
        // Calculate for each direction if the popup fits and save this into a map
        const directionFitsMap = {
            [PopupDirection.Top]:
                candidates.directionTop.top + candidates.directionTop.innerTop - this.windowBounds.scrollY > this.popupSettings.margin.top,
            [PopupDirection.Bottom]:
                candidates.directionBottom.top -
                    this.windowBounds.scrollY +
                    candidates.directionBottom.innerTop +
                    this.popupSettings.height! +
                    this.popupSettings.margin.bottom <
                this.windowBounds.viewPortHeight,
            [PopupDirection.Right]:
                candidates.directionRight.left +
                    candidates.directionRight.innerLeft +
                    this.popupSettings.width +
                    this.popupSettings.margin.right <
                this.windowBounds.viewPortWidth,
            [PopupDirection.Left]: candidates.directionLeft.left + candidates.directionLeft.innerLeft > this.popupSettings.margin.left
        };

        // sort map by prefered order from settings
        const directionsSortedByPreference = map(this.popupSettings.preferedDirection, (pref) => ({
            [pref]: (<any>directionFitsMap)[pref]
        }));

        // pick the first direction which fits
        const bestDirection = find(directionsSortedByPreference, (item) => item[<any>Object.keys(item)[0]]);

        // if no best fit can be found, just return the user's first prefered direction
        if (bestDirection) {
            return PopupDirection[<any>Object.keys(bestDirection)[0]];
        } else {
            return PopupDirection[this.popupSettings.preferedDirection[0]];
        }
    }

    private fitInsideScreen(positionCandidates: PopupPositionCandidates): PopupPositionCandidates {
        // calculate the absolute coordinates of the candidates in the window
        let absoluteCoordinates = this.toAbsoluteCoordinates(positionCandidates);

        // calculate screen boundaries
        const yTopBoundary = this.windowBounds.scrollY + this.popupSettings.margin.top;
        const yBottomBoundary = this.windowBounds.scrollY + this.windowBounds.viewPortHeight - this.popupSettings.margin.bottom;
        const xLeftBoundary = this.windowBounds.scrollX + this.popupSettings.margin.left;
        const xRightBoundary = this.windowBounds.viewPortWidth - this.popupSettings.margin.right;

        /**
         * For each direction check if the corresponding x or y coordinate is outside the screen boundaries
         * if so then if there is enough space to display the popup, scroll the viewport such that the popup is
         * in view. If there is not enough space to scroll, then shift the popup back inside the viewport
         */

        // left
        if (absoluteCoordinates.leftDirection.y2 > yBottomBoundary) {
            const diff = absoluteCoordinates.leftDirection.y2 - yBottomBoundary;
            if (absoluteCoordinates.leftDirection.y2 < this.windowBounds.documentOffsetHeight) {
                positionCandidates.directionLeft.scrollTo = window.scrollY + diff + this.popupSettings.margin.left;
            } else {
                positionCandidates.directionLeft.innerTop -= diff;
            }
        }
        absoluteCoordinates = this.toAbsoluteCoordinates(positionCandidates);
        if (absoluteCoordinates.leftDirection.y1 < yTopBoundary) {
            const diff = yTopBoundary - absoluteCoordinates.leftDirection.y1;
            if (absoluteCoordinates.leftDirection.y1 > this.popupSettings.margin.left) {
                positionCandidates.directionLeft.scrollTo = absoluteCoordinates.leftDirection.y1 - this.popupSettings.margin.left;
            } else {
                positionCandidates.directionLeft.innerTop += diff;
            }
        }

        // right
        if (absoluteCoordinates.rightDirection.y2 > yBottomBoundary) {
            const diff = absoluteCoordinates.rightDirection.y2 - yBottomBoundary;
            if (absoluteCoordinates.rightDirection.y2 < this.windowBounds.documentOffsetHeight) {
                positionCandidates.directionRight.scrollTo = window.scrollY + diff + this.popupSettings.margin.right;
            } else {
                positionCandidates.directionRight.innerTop -= diff;
            }
        }
        absoluteCoordinates = this.toAbsoluteCoordinates(positionCandidates);
        if (absoluteCoordinates.rightDirection.y1 < yTopBoundary) {
            const diff = yTopBoundary - absoluteCoordinates.rightDirection.y1;
            if (absoluteCoordinates.rightDirection.y1 > this.popupSettings.margin.right) {
                positionCandidates.directionRight.scrollTo = absoluteCoordinates.rightDirection.y1 - this.popupSettings.margin.right;
            } else {
                positionCandidates.directionRight.innerTop += diff;
            }
        }

        // top
        if (absoluteCoordinates.topDirection.x1 < xLeftBoundary) {
            positionCandidates.directionTop.innerLeft += xLeftBoundary - absoluteCoordinates.topDirection.x1;
        }
        absoluteCoordinates = this.toAbsoluteCoordinates(positionCandidates);
        if (absoluteCoordinates.topDirection.x2 > xRightBoundary) {
            positionCandidates.directionTop.innerLeft -= absoluteCoordinates.topDirection.x2 - xRightBoundary;
        }

        // bottom
        if (absoluteCoordinates.bottomDirection.x1 < xLeftBoundary) {
            positionCandidates.directionBottom.innerLeft += xLeftBoundary - absoluteCoordinates.bottomDirection.x1;
        }
        absoluteCoordinates = this.toAbsoluteCoordinates(positionCandidates);
        if (absoluteCoordinates.bottomDirection.x2 > xRightBoundary) {
            positionCandidates.directionBottom.innerLeft -= absoluteCoordinates.bottomDirection.x2 - xRightBoundary;
        }

        return positionCandidates;
    }

    private toAbsoluteCoordinates(positionCandidates: PopupPositionCandidates) {
        return {
            leftDirection: this.toAbsoluteCoordinate(positionCandidates.directionLeft),
            rightDirection: this.toAbsoluteCoordinate(positionCandidates.directionRight),
            topDirection: this.toAbsoluteCoordinate(positionCandidates.directionTop),
            bottomDirection: this.toAbsoluteCoordinate(positionCandidates.directionBottom)
        };
    }

    private toAbsoluteCoordinate(position: PopupPositionData) {
        return {
            x1: position.left + position.innerLeft,
            y1: position.top + position.innerTop,
            x2: position.left + position.innerLeft + this.popupSettings.width,
            y2: position.top + position.innerTop + this.popupSettings.height!
        };
    }

    calculateWidth() {
        return this.popupSettings.width;
    }

    calculateHeight() {
        this.popupSettings.height = this.popupRef.nativeElement.offsetHeight;
        if (this.popupSettings.scrollable) {
            return window.innerHeight < this.popupSettings.height! ? window.innerHeight : this.popupSettings.height;
        }
        return this.popupSettings.height;
    }

    private get appendInElementLeft() {
        return this.appendInElement?.scrollLeft ?? 0;
    }

    private get appendInElementTop() {
        return this.appendInElement?.scrollTop ?? 0;
    }
}
