import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    LogOut,
    Hexagon,
    TrendingUp
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { Sidebar, SidebarBody, SidebarButton, SidebarLink } from "@/components/ui/sidebar";
import { motion } from "framer-motion";

export default function BusinessLayout() {
    const { user, logout } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const navItems = [
        { name: "TradeSync", path: "/business", icon: LayoutDashboard },
        { name: "TalentBridge", path: "/business/talent", icon: Users },
        { name: "Project Timelines", path: "/business/timelines", icon: TrendingUp },
        { name: "Messages", path: "/business/messages", icon: MessageSquare },
        { name: "Udhyaam Network", path: "/business/network", icon: MessageSquare },
        { name: "Digital Vault", path: "/business/vault", icon: Hexagon },
    ];

    return (
        <div className="theme-business min-h-screen font-sans selection:bg-primary/20 selection:text-primary flex flex-col md:flex-row w-full overflow-hidden" style={{ backgroundColor: '#F2F2F2', color: '#0F172A' }}>
            
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="justify-between gap-10 z-20" style={{ backgroundColor: '#F2F2F2' }}>
                    <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden pt-2">
                        {open ? <Logo /> : <LogoIcon />}
                        
                        <div className="mt-8 flex flex-col gap-2">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path || (item.path !== '/business' && location.pathname.startsWith(item.path));
                                return (
                                    <SidebarLink 
                                        key={item.path} 
                                        link={{ 
                                            label: item.name, 
                                            href: item.path, 
                                            icon: <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-white" : "text-[#64748B]"}`} /> 
                                        }} 
                                        className={isActive ? "bg-[#356DDA] text-white" : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"}
                                    />
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 pb-2">
                        <SidebarLink
                            link={{
                                label: user?.name || 'Business User',
                                href: "/business/profile",
                                icon: (
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${location.pathname === '/business/profile' ? 'bg-white text-[#356DDA]' : 'bg-[#356DDA] text-white'}`}>
                                        {user?.name?.charAt(0) || 'B'}
                                    </div>
                                ),
                            }}
                            className={`transition-all ${location.pathname === '/business/profile' ? 'bg-[#356DDA] text-white' : 'hover:bg-[#F1F5F9] text-[#0F172A]'}`}
                        />
                        <SidebarButton
                            onClick={handleLogout}
                            link={{
                                label: "Sign Out",
                                href: "#",
                                icon: <LogOut className="h-5 w-5 flex-shrink-0" />
                            }}
                            className="text-[#64748B] hover:text-white hover:bg-red-600 transition-colors"
                        />
                    </div>
                </SidebarBody>
            </Sidebar>

            {/* Main Content */}
            <main className="flex-1 flex flex-col w-full h-screen overflow-hidden relative z-10 pt-2 md:pt-4">
                <div className="flex-1 rounded-t-2xl md:rounded-tr-none md:rounded-tl-3xl border border-[#E2E8F0] flex flex-col overflow-hidden mr-2 md:pr-0 md:mr-0" style={{ backgroundColor: '#E5E6E1' }}>
                    <div className="flex-1 overflow-y-auto pb-8 rounded-2xl">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}

const Logo = () => {
    return (
        <Link
            to="/business"
            className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20 h-8"
        >
            <div className="w-8 h-8 rounded-2xl bg-[#356DDA]/15 flex items-center justify-center shrink-0">
                <Hexagon className="w-5 h-5 text-[#1E40AF] fill-[#356DDA]/40" />
            </div>
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-black text-xl tracking-tight whitespace-pre text-[#0F172A]"
            >
                Udhyaam<span className="text-[#1E40AF]"> BUSINESS</span>
            </motion.span>
        </Link>
    );
};

const LogoIcon = () => {
    return (
        <Link
            to="/business"
            className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20 h-8"
        >
            <div className="w-8 h-8 rounded-2xl bg-[#356DDA]/15 flex items-center justify-center shrink-0">
                <Hexagon className="w-5 h-5 text-[#1E40AF] fill-[#356DDA]/40" />
            </div>
        </Link>
    );
};
