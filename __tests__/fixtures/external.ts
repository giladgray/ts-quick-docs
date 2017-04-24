import * as React from "react";

export interface IReactProps {
    onClick: React.MouseEventHandler<HTMLElement>;
    submenu: React.ReactChild;
}
