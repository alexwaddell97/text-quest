import React from "react";
import { GameProvider } from "@/context/gameContext";

const Layout = ({ children }: React.PropsWithChildren) => {
    return (
        <div data-full-width="true" data-immersive="true" className="h-screen flex flex-col">
            <GameProvider>{children}</GameProvider>
        </div>
    );
};

export default Layout;