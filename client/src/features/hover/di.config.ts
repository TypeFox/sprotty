import { ContainerModule } from "inversify"
import { TYPES } from "../../base/types"
import { HoverListener, HoverCommand, SetPopupModelCommand } from "./hover"

const hoverModule = new ContainerModule(bind => {
    bind(TYPES.ICommand).toConstructor(HoverCommand)
    bind(TYPES.ICommand).toConstructor(SetPopupModelCommand)
    bind(TYPES.MouseListener).to(HoverListener)
})

export default hoverModule