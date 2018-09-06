/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

/** @jsx svg */
import { svg } from 'snabbdom-jsx';

import { VNode } from "snabbdom/vnode";
import { IView, RenderingContext } from "../base/views/view";
import { SNode, SPort } from "../graph/sgraph";
import { ViewportRootElement } from "../features/viewport/viewport-root";
import { SShapeElement } from '../features/bounds/model';
import { Hoverable } from '../features/hover/model';
import { Selectable } from '../features/select/model';
import { Rotatable } from '../features/rotation/model';

export class SvgViewportView implements IView {
    render(model: Readonly<ViewportRootElement>, context: RenderingContext): VNode {
        const transform = `scale(${model.zoom}) translate(${-model.scroll.x},${-model.scroll.y})`;
        return <svg>
            <g transform={transform}>
                {context.renderChildren(model)}
            </g>
        </svg>;
    }
}

export class CircularNodeView implements IView {
    render(node: Readonly<SShapeElement & Hoverable & Selectable>, context: RenderingContext): VNode {
        const radius = this.getRadius(node);
        return <g>
            <circle class-sprotty-node={node instanceof SNode} class-sprotty-port={node instanceof SPort}
                    class-mouseover={node.hoverFeedback} class-selected={node.selected}
                    r={radius} cx={radius} cy={radius}></circle>
            {context.renderChildren(node)}
        </g>;
    }

    protected getRadius(node: SShapeElement): number {
        const d = Math.min(node.size.width, node.size.height);
        return d > 0 ? d / 2 : 0;
    }
}

export class RectangularNodeView implements IView {
    render(node: Readonly<SShapeElement & Hoverable & Selectable>, context: RenderingContext): VNode {
        return <g>
            <rect class-sprotty-node={node instanceof SNode} class-sprotty-port={node instanceof SPort}
                  class-mouseover={node.hoverFeedback} class-selected={node.selected}
                  x="0" y="0" width={Math.max(node.size.width, 0)} height={Math.max(node.size.height, 0)}></rect>
            {context.renderChildren(node)}
        </g>;
    }
}

export class RotatedRectangularNodeView extends RectangularNodeView {
    render(node: Readonly<SShapeElement & Hoverable & Selectable & Rotatable>, context: RenderingContext): VNode {
        const hw = node.bounds.width / 2;
        const hh = node.bounds.height / 2;
        return <g>
            <rect class-sprotty-node={node instanceof SNode} class-sprotty-port={node instanceof SPort}
                  class-mouseover={node.hoverFeedback} class-selected={node.selected}
                  x="0" y="0" width={Math.max(node.size.width, 0)} height={Math.max(node.size.height, 0)}
                  transform={`rotate(${node.rotationInDegrees},${hw},${hh})`}></rect>
            {context.renderChildren(node)}
        </g>;
    }
}
