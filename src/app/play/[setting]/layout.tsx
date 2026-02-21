import React from "react";
import { GameProvider } from "@/context/gameContext";

const Layout = ({ children }: React.PropsWithChildren) => {
    return (
        <div data-full-width="true" data-immersive="true">
            <GameProvider>{children}</GameProvider>
        </div>
    );
};

export default Layout;