import { Home, CheckCircle2 } from "lucide-react";

export default function LeftPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between bg-[#2d3a1e] p-10 text-white">

      <div className="flex items-center gap-2">
        <Home className="text-[#a3c46a]" />
        <span className="font-bold text-xl">
          AKSHU ELITE HOMES
        </span>
      </div>

      <div className="space-y-6">
        <h2 className="text-3xl font-bold">
          Your perfect stay <br />
          <span className="text-[#a3c46a]">starts here.</span>
        </h2>

        <ul className="space-y-2 text-sm text-[#c5d9a0]">
          <li className="flex gap-2">
            <CheckCircle2 size={16} className="text-[#8aab5c]" /> Secure bookings
          </li>
          <li className="flex gap-2">
            <CheckCircle2 size={16} className="text-[#8aab5c]" /> Verified hosts
          </li>
          <li className="flex gap-2">
            <CheckCircle2 size={16} className="text-[#8aab5c]" /> 24/7 support
          </li>
        </ul>
      </div>

      <p className="text-xs text-[#8aab5c]">
        © 2025 AKSHU ELITE HOMES
      </p>

    </div>
  );
}