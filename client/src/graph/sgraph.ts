/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { SChildElement, SModelElementSchema, SModelRootSchema } from "../base/model/smodel"
import { Bounds, Point, ORIGIN_POINT, Dimension, EMPTY_DIMENSION, isBounds } from "../utils/geometry"
import { ViewportRootElement } from "../features/viewport/viewport-root"
import { Selectable, selectFeature } from "../features/select/model"
import { Locateable, moveFeature } from "../features/move/model"
import { BoundsAware, boundsFeature, layoutFeature, Layouting } from "../features/bounds/model"
import { Fadeable, fadeFeature } from "../features/fade/model"
import { Hoverable, hoverFeedbackFeature, popupFeature } from "../features/hover/model"
import { Editable, editFeature } from "../features/edit/model"

export interface SGraphSchema extends SModelRootSchema {
    children: SGraphElementSchema[]
    bounds?: Bounds
    scroll?: Point
    zoom?: number
}

export class SGraph extends ViewportRootElement {
}

export interface SShapeElementSchema extends SModelElementSchema {
    position?: Point
    size?: Dimension
    children?: SGraphElementSchema[]
}

export abstract class SShapeElement extends SChildElement implements BoundsAware, Locateable {
    position: Point = ORIGIN_POINT
    size: Dimension = EMPTY_DIMENSION

    get bounds(): Bounds {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.size.width,
            height: this.size.height
        }
    }

    set bounds(newBounds: Bounds) {
        this.position = {
            x: newBounds.x,
            y: newBounds.y
        }
        this.size = {
            width: newBounds.width,
            height: newBounds.height
        }
    }

    localToParent(point: Point | Bounds): Bounds {
        if (isBounds(point)) {
            return {
                x: point.x + this.position.x,
                y: point.y + this.position.y,
                width: point.width,
                height: point.height
            }
        } else {
            return {
                x: point.x + this.position.x,
                y: point.y + this.position.y,
                width: -1,
                height: -1
            }
        }
    }
}

export interface SNodeSchema extends SShapeElementSchema {
    layout?: string
    resizeContainer?: boolean
}

export class SNode extends SShapeElement implements Selectable, Fadeable, Hoverable {
    hoverFeedback: boolean = false
    children: SCompartmentElement[]
    layout?: string
    selected: boolean = false
    opacity: number = 1
    resizeContainer: boolean = true

    hasFeature(feature: symbol): boolean {
        return feature === selectFeature || feature === moveFeature || feature === boundsFeature
            || feature === layoutFeature || feature === fadeFeature || feature === hoverFeedbackFeature
            || feature === popupFeature
    }
}

export interface SEdgeSchema extends SModelElementSchema {
    sourceId: string
    targetId: string
    routingPoints?: Point[]
}

export interface SEdgeAnchorsSchema {
    sourceAnchor: Point
    targetAnchor: Point
}

export class SEdge extends SChildElement implements Fadeable, Selectable, Editable {
    controlPointsVisible: boolean = false
    inEditMode: boolean = false
    sourceId: string
    targetId: string
    anchors: SEdgeAnchorsSchema = {sourceAnchor: ORIGIN_POINT, targetAnchor: ORIGIN_POINT}
    routingPoints: SControlPoint[] = []
    opacity: number = 1
    selected: boolean = false

    get source(): SNode | undefined {
        return this.index.getById(this.sourceId) as SNode
    }

    get target(): SNode | undefined {
        return this.index.getById(this.targetId) as SNode
    }

    hasFeature(feature: symbol): boolean {
        return feature === fadeFeature || feature === selectFeature || feature === editFeature
    }
}

export class SControlPoint extends SChildElement implements Selectable, Locateable, Hoverable {
    hoverFeedback: boolean = false
    selected: boolean = false
    position: Point = {x: 0, y: 0}
    volatile: boolean = false

    hasFeature(feature: symbol): boolean {
        return feature === selectFeature || feature === moveFeature || feature === hoverFeedbackFeature
    }
}

export type SGraphElementSchema = SNodeSchema | SEdgeSchema
export type SGraphElement = SNode | SEdge
export type SCompartmentElementSchema = SCompartmentSchema | SLabelSchema
export type SCompartmentElement = SCompartment | SLabel

export interface SLabelSchema extends SShapeElementSchema {
    text: string
    selected?: boolean
}

export class SLabel extends SShapeElement implements Selectable {
    text: string
    selected: boolean = false

    hasFeature(feature: symbol) {
        return feature === boundsFeature
    }
}

export interface SCompartmentSchema extends SShapeElementSchema {
    layout?: string
    resizeContainer?: boolean
}

export class SCompartment extends SShapeElement implements BoundsAware, Layouting {
    children: SCompartmentElement[]
    layout: string
    resizeContainer: boolean = true

    hasFeature(feature: symbol) {
        return feature === boundsFeature || feature === layoutFeature
    }
}
