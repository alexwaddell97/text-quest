import { motion } from "framer-motion";
import { ReactNode } from "react";


export default function Button({children, onClick} : { children: ReactNode; onClick?: () => void }) {
    return (
        <motion.button onClick={onClick}
        initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
whileHover={{ scale: 1.1 }}
whileTap={{ scale: 0.9 }}
transition={{ type: "spring", stiffness: 400, damping: 17 }} className="bg-[url('/button.png')] bg-center bg-cover text-[24px] h-fit w-[250px] cursor-pointer px-12 py-[20px] uppercase font-extrabold">{children}</motion.button>
    )

}