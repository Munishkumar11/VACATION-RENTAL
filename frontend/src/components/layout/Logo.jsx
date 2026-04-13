import { Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function Logo() {
    return (
        <Link to="/" className="flex items-center gap-2">
            <Home size={22} className="text-[#6b8c3e]" />
            <span className="text-xl font-bold text-[#2d3a1e]">
                AKSHU ELITE HOMES
            </span>
        </Link>
    );
}