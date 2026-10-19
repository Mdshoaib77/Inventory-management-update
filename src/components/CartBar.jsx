// // import React from "react";
// // import { useNavigate } from "react-router-dom";
// // import { ShoppingCart, ChevronRight } from "lucide-react";
// // import { useCart } from "../context/CartContext";

// // // Floating cart summary. Bottom-center on phones (above the tab bar),
// // // docked bottom-right on laptops / desktops so it never covers table content.
// // export default function CartBar() {
// //   const { itemCount, subtotal } = useCart();
// //   const navigate = useNavigate();

// //   if (itemCount === 0) return null;

// //   return (
// //     <div className="fixed inset-x-0 z-40 flex justify-center px-4 pointer-events-none bottom-20 md:inset-x-auto md:bottom-6 md:right-6 md:justify-end md:px-0">
// //       <button
// //         className="flex items-center w-full max-w-md px-4 py-3 transition pointer-events-auto rounded-2xl bg-slate-900 shadow-pop ring-1 ring-white/10 hover:bg-slate-800 md:w-80"
// //         onClick={() => navigate("/checkout")}
// //       >
// //         <div className="relative flex-shrink-0 mr-3">
// //           <ShoppingCart size={20} className="text-white" />
// //           <span className="absolute -right-2.5 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-slate-900 bg-red-500 px-1 text-[10px] font-bold text-white">
// //             {itemCount > 99 ? "99+" : itemCount}
// //           </span>
// //         </div>
// //         <div className="flex-1 min-w-0 mr-2 text-left">
// //           <p className="text-sm font-bold text-white truncate">View Cart</p>
// //           <p className="truncate text-[11px] text-slate-400">
// //             {itemCount} item{itemCount === 1 ? "" : "s"}
// //           </p>
// //         </div>
// //         <p className="mr-1 whitespace-nowrap text-[15px] font-bold tabular-nums text-indigo-300">৳{subtotal.toFixed(2)}</p>
// //         <ChevronRight size={18} className="text-indigo-300" />
// //       </button>
// //     </div>
// //   );
// // }


// import React from "react";
// import { useNavigate } from "react-router-dom";
// import { ShoppingCart, ChevronRight } from "lucide-react";
// import { useCart } from "../context/CartContext";

// // Floating cart summary. Bottom-center on phones (above the tab bar),
// // hidden on laptops / desktops.
// export default function CartBar() {
//   const { itemCount, subtotal } = useCart();
//   const navigate = useNavigate();

//   if (itemCount === 0) return null;

//   return (
//     <div className="fixed inset-x-0 z-40 flex justify-center px-4 pointer-events-none bottom-20 md:hidden">
//       <button
//         className="flex items-center w-full max-w-md px-4 py-3 transition pointer-events-auto rounded-2xl bg-slate-900 shadow-pop ring-1 ring-white/10 hover:bg-slate-800"
//         onClick={() => navigate("/checkout")}
//       >
//         <div className="relative flex-shrink-0 mr-3">
//           <ShoppingCart size={20} className="text-white" />
//           <span className="absolute -right-2.5 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-slate-900 bg-red-500 px-1 text-[10px] font-bold text-white">
//             {itemCount > 99 ? "99+" : itemCount}
//           </span>
//         </div>
//         <div className="flex-1 min-w-0 mr-2 text-left">
//           <p className="text-sm font-bold text-white truncate">View Cart</p>
//           <p className="truncate text-[11px] text-slate-400">
//             {itemCount} item{itemCount === 1 ? "" : "s"}
//           </p>
//         </div>
//         <p className="mr-1 whitespace-nowrap text-[15px] font-bold tabular-nums text-indigo-300">৳{subtotal.toFixed(2)}</p>
//         <ChevronRight size={18} className="text-indigo-300" />
//       </button>
//     </div>
//   );
// }

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, ChevronRight } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function CartBar() {
  const { itemCount, subtotal } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // ১. যদি Cart-এ কোনো আইটেম না থাকে
  // ২. অথবা ইউজার যদি ইতিমধ্যে '/checkout' পেজে অবস্থান করে
  // ৩. অথবা ইউজার যদি Desktop view (md breakpoint)-এ থাকে
  // তাহলে CartBar টি দেখাবে না।
  if (itemCount === 0 || location.pathname === "/checkout") {
    return null;
  }

  return (
    <div className="fixed inset-x-0 z-40 flex justify-center px-4 pointer-events-none bottom-20 md:hidden">
      <button
        className="flex items-center w-full max-w-md px-4 py-3 transition pointer-events-auto rounded-2xl bg-slate-900 shadow-pop ring-1 ring-white/10 hover:bg-slate-800"
        onClick={() => navigate("/checkout")}
      >
        <div className="relative flex-shrink-0 mr-3">
          <ShoppingCart size={20} className="text-white" />
          <span className="absolute -right-2.5 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-slate-900 bg-red-500 px-1 text-[10px] font-bold text-white">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        </div>
        <div className="flex-1 min-w-0 mr-2 text-left">
          <p className="text-sm font-bold text-white truncate">View Cart</p>
          <p className="truncate text-[11px] text-slate-400">
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </p>
        </div>
        <p className="mr-1 whitespace-nowrap text-[15px] font-bold tabular-nums text-indigo-300">
          ৳{subtotal.toFixed(2)}
        </p>
        <ChevronRight size={18} className="text-indigo-300" />
      </button>
    </div>
  );
}