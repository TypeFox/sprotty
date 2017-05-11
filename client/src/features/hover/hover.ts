import { SChildElement, SModelElement, SModelRoot, SModelRootSchema } from "../../base/model/smodel"
import { MouseListener } from "../../base/view/mouse-tool"
import { Action } from "../../base/intent/actions"
import { hasPopupFeature, isHoverable } from "./model"
import { Command, CommandExecutionContext, CommandResult, PopupCommand } from "../../base/intent/commands"
import { EMPTY_ROOT } from "../../base/model/smodel-factory"
import { Bounds } from "../../utils/geometry"

export class HoverAction implements Action {
    kind = HoverCommand.KIND

    constructor(public readonly mouseoverElement: string, public readonly mouseIsOver: boolean) {
    }
}

export class RequestPopupModelAction implements Action {
    static readonly KIND = 'requestPopupModel'
    readonly kind = RequestPopupModelAction.KIND

    constructor(public readonly element: string, public readonly bounds: Bounds) {

    }
}

export class SetPopupModelAction implements Action {
    readonly kind = SetPopupModelCommand.KIND

    modelType: string
    modelId: string

    constructor(public newRoot: SModelRootSchema) {
        this.modelType = newRoot.type
        this.modelId = newRoot.id
    }

}

export class SetPopupModelCommand extends PopupCommand {

    static readonly KIND = 'setPopupModel'

    oldRoot: SModelRoot
    newRoot: SModelRoot

    constructor(public action: SetPopupModelAction) {
        super()
    }

    execute(context: CommandExecutionContext): SModelRoot {
        this.oldRoot = context.root
        this.newRoot = context.modelFactory.createRoot(this.action.newRoot)

        return this.newRoot
    }

    undo(context: CommandExecutionContext): SModelRoot {
        return this.oldRoot
    }

    redo(context: CommandExecutionContext): SModelRoot {
        return this.newRoot
    }

}

export class HoverCommand extends Command {
    static readonly KIND = 'elementHovered'

    constructor(public action: HoverAction) {
        super()
    }

    execute(context: CommandExecutionContext): SModelRoot {

        const model: SModelRoot = context.root
        const modelElement: SModelElement | undefined = model.index.getById(this.action.mouseoverElement)

        if (modelElement) {
            if (isHoverable(modelElement)) {
                modelElement.mouseover = this.action.mouseIsOver
            }
        }

        return this.redo(context)
    }

    undo(context: CommandExecutionContext): SModelRoot {
        return context.root
    }

    redo(context: CommandExecutionContext): SModelRoot {
        return context.root
    }


}

export class HoverListener extends MouseListener {
    private hoverTimer: number | undefined
    private popupOpen: boolean = false
    private previousPopupElement: SModelElement | undefined

    private startTimer(targetId: string, event: MouseEvent): Promise<Action> {
        this.stopTimer()
        return new Promise((resolve, reject) => {
            this.hoverTimer = window.setTimeout(() => {

                resolve(new RequestPopupModelAction(targetId,
                    {
                        x: event.clientX - 20,
                        y: event.clientY + 20,
                        width: -1,
                        height: -1
                    })) //TODO get offset from options

                this.popupOpen = true
            }, 700) //TODO get time from options
        })
    }

    private stopTimer(): void {
        if (this.hoverTimer !== undefined) {
            window.clearTimeout(this.hoverTimer)
            this.hoverTimer = undefined
        }
    }

    protected targetWithFeature(target: SModelElement, checkFeature: (t: SModelElement) => boolean): SModelElement | undefined {
        let current: SModelElement | undefined = target

        while (current !== undefined) {
            if (checkFeature(current))
                return current
            else if (current instanceof SChildElement)
                current = current.parent
            else
                current = undefined
        }

        return current
    }

    mouseOver(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        const result: (Action | Promise<Action>)[] = []
        const popupTarget = this.targetWithFeature(target, hasPopupFeature)

        if (popupTarget === undefined ||
            this.previousPopupElement !== undefined && this.previousPopupElement.id !== popupTarget.id) {
            if (this.popupOpen) {
                this.popupOpen = false
                result.push(new SetPopupModelAction({type: EMPTY_ROOT.type, id: EMPTY_ROOT.id}))
            }
        }
        if (popupTarget !== undefined &&
            (this.previousPopupElement === undefined || this.previousPopupElement.id !== popupTarget.id)) {
            result.push(this.startTimer(popupTarget.id, event))
        }

        this.previousPopupElement = popupTarget


        const hoverTarget = this.targetWithFeature(target, isHoverable)
        if (hoverTarget !== undefined)
            result.push(new HoverAction(hoverTarget.id, true))

        return result
    }

    mouseOut(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        const result: (Action | Promise<Action>)[] = []

        if (!this.popupOpen)
            this.stopTimer()

        if (isHoverable(target))
            result.push(new HoverAction(target.id, false))

        return result
    }

    mouseMove(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        const popupTarget = this.targetWithFeature(target, hasPopupFeature)
        return this.popupOpen || popupTarget === undefined ? [] : [this.startTimer(popupTarget.id, event)]
    }


}