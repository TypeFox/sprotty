/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { Container, ContainerModule } from "inversify"
import {
    defaultModule, TYPES, ViewRegistry, overrideViewerOptions, SGraphView, SLabelView, SCompartmentView,
    ControlPointView, PolylineEdgeView, ConsoleLogger, LogLevel, WebSocketDiagramServer, boundsModule, moveModule,
    selectModule, undoRedoModule, viewportModule, hoverModule, LocalModelSource, HtmlRootView, PreRenderedView,
    editModule
} from "../../../src"
import { ClassNodeView } from "./views"
import { ClassDiagramFactory } from "./model-factory"
import { popupModelFactory } from "./popup"

const classDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope()
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.log)
    rebind(TYPES.IModelFactory).to(ClassDiagramFactory).inSingletonScope()
    bind(TYPES.PopupModelFactory).toConstantValue(popupModelFactory)
})

export default (useWebsocket: boolean, containerId: string) => {
    const container = new Container()
    container.load(defaultModule, selectModule, moveModule, boundsModule, undoRedoModule, viewportModule,
        hoverModule, classDiagramModule, editModule)
    if (useWebsocket)
        container.bind(TYPES.ModelSource).to(WebSocketDiagramServer).inSingletonScope()
    else
        container.bind(TYPES.ModelSource).to(LocalModelSource).inSingletonScope()
    overrideViewerOptions(container, {
        needsClientLayout: true,
        baseDiv: containerId
    })

    // Register views
    const viewRegistry = container.get<ViewRegistry>(TYPES.ViewRegistry)
    viewRegistry.register('graph', SGraphView)
    viewRegistry.register('node:class', ClassNodeView)
    viewRegistry.register('label:heading', SLabelView)
    viewRegistry.register('label:text', SLabelView)
    viewRegistry.register('comp:comp', SCompartmentView)
    viewRegistry.register('edge:straight', PolylineEdgeView)
    viewRegistry.register('html', HtmlRootView)
    viewRegistry.register('pre-rendered', PreRenderedView)
    viewRegistry.register('volatile-control-point', ControlPointView)
    viewRegistry.register('control-point', ControlPointView)

    return container
}
