"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Sparkles, Hexagon, Component as LayoutIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "../../store/useAuthStore";
import { useNavigate } from "react-router-dom";

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

const Pupil = ({ 
  size = 12, 
  maxDistance = 5,
  pupilColor = "black",
  forceLookX,
  forceLookY
}: PupilProps) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const [pupilPosition, setPupilPosition] = useState({ x: 0, y: 0 });
  const pupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      if (forceLookX !== undefined && forceLookY !== undefined) {
        setPupilPosition({ x: forceLookX, y: forceLookY });
        return;
      }
      if (!pupilRef.current) return;

      const pupil = pupilRef.current.getBoundingClientRect();
      const pupilCenterX = pupil.left + pupil.width / 2;
      const pupilCenterY = pupil.top + pupil.height / 2;

      const deltaX = mouseX - pupilCenterX;
      const deltaY = mouseY - pupilCenterY;
      const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

      const angle = Math.atan2(deltaY, deltaX);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      setPupilPosition({ x, y });
    };

    raf = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(raf);
  }, [mouseX, mouseY, maxDistance, forceLookX, forceLookY]);

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  );
};

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

const EyeBall = ({ 
  size = 48, 
  pupilSize = 16, 
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY
}: EyeBallProps) => {
  return (
    <div
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
        overflow: 'hidden',
      }}
    >
      {!isBlinking && (
        <Pupil
          size={pupilSize}
          maxDistance={maxDistance}
          pupilColor={pupilColor}
          forceLookX={forceLookX}
          forceLookY={forceLookY}
        />
      )}
    </div>
  );
};

export default function AnimatedCharactersLoginPage() {
  const { login, register, googleLogin, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [role, setRole] = useState<"Business" | "JuniorPro">("Business");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  const isJunior = role === "JuniorPro";

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;
    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => {
          setIsPurpleBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());
      return blinkTimeout;
    };
    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;
    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());
      return blinkTimeout;
    };
    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => {
        setIsLookingAtEachOther(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setIsLookingAtEachOther(false);
    }
  }, [isTyping]);

  useEffect(() => {
    if (password.length > 0 && showPassword) {
      const schedulePeek = () => {
        const peekInterval = setTimeout(() => {
          setIsPurplePeeking(true);
          setTimeout(() => {
            setIsPurplePeeking(false);
          }, 800);
        }, Math.random() * 3000 + 2000);
        return peekInterval;
      };
      const firstPeek = schedulePeek();
      return () => clearTimeout(firstPeek);
    } else {
      setIsPurplePeeking(false);
    }
  }, [password, showPassword]);

  const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));
    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));
    return { faceX, faceY, bodySkew };
  };

  const [purplePos, setPurplePos] = useState({ faceX: 0, faceY: 0, bodySkew: 0 });
  const [blackPos, setBlackPos] = useState({ faceX: 0, faceY: 0, bodySkew: 0 });
  const [yellowPos, setYellowPos] = useState({ faceX: 0, faceY: 0, bodySkew: 0 });
  const [orangePos, setOrangePos] = useState({ faceX: 0, faceY: 0, bodySkew: 0 });

  useEffect(() => {
    let raf = 0;
    raf = window.requestAnimationFrame(() => {
      setPurplePos(calculatePosition(purpleRef));
      setBlackPos(calculatePosition(blackRef));
      setYellowPos(calculatePosition(yellowRef));
      setOrangePos(calculatePosition(orangeRef));
    });
    return () => window.cancelAnimationFrame(raf);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const onResize = () => {
      setPurplePos(calculatePosition(purpleRef));
      setBlackPos(calculatePosition(blackRef));
      setYellowPos(calculatePosition(yellowRef));
      setOrangePos(calculatePosition(orangeRef));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLoginMode && !name)) return;
    
    localStorage.setItem('udyaam_intended_role', role);
    if (isLoginMode) {
      await login(email, password, role);
    } else {
      await register(name, email, password, role);
    }
    const { user } = useAuthStore.getState();
    if (user) {
      const finalRole = user.role || role;
      navigate(finalRole === 'Business' ? '/business' : '/junior-pro');
    }
  };

  const handleGoogleSubmit = async () => {
    localStorage.setItem('udyaam_intended_role', role);
    await googleLogin(role);
    const { user } = useAuthStore.getState();
    if (user) {
      const finalRole = user.role || role;
      navigate(finalRole === 'Business' ? '/business' : '/junior-pro');
    }
  };

  return (
    <div className={cn(
      "min-h-screen grid lg:grid-cols-2",
      isJunior ? "theme-junior" : "theme-business"
    )}>
      {/* Left Content Section */}
      <div className={cn(
        "relative hidden lg:flex flex-col justify-between p-12 transition-all duration-700 overflow-hidden",
        isJunior 
          ? "bg-[#F2F0ED] text-[#111111]" 
          : "bg-[#111111] text-white" // Business Left Bg and Text
      )}>
        <div className="relative z-20">
          <div className="flex items-center gap-2 text-lg font-bold tracking-tighter">
            <div className={cn(
              "size-8 rounded-lg flex items-center justify-center transition-colors duration-700",
              isJunior ? "bg-background/10 text-background" : "bg-white/10 text-white" // Business Logo Colors
            )}>
               {isJunior ? <Hexagon className="size-4" /> : <LayoutIcon className="size-4" />}
            </div>
            <span className="uppercase">Udyaam {isJunior ? "Pro" : "Business"}</span>
          </div>
        </div>

        <div className="relative z-20 flex items-end justify-center h-[500px]">
          <div className="relative" style={{ width: '550px', height: '400px' }}>
            {/* Purple Character */}
            <div 
              ref={purpleRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '70px',
                width: '180px',
                height: (isTyping || (password.length > 0 && !showPassword)) ? '440px' : '400px',
                backgroundColor: '#804CE4',
                borderRadius: '10px 10px 0 0',
                zIndex: 1,
                transform: (password.length > 0 && showPassword)
                  ? `skewX(0deg)`
                  : (isTyping || (password.length > 0 && !showPassword))
                    ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)` 
                    : `skewX(${purplePos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div 
                className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${20}px` : isLookingAtEachOther ? `${55}px` : `${45 + purplePos.faceX}px`,
                  top: (password.length > 0 && showPassword) ? `${35}px` : isLookingAtEachOther ? `${65}px` : `${40 + purplePos.faceY}px`,
                }}
              >
                <EyeBall 
                  size={18} 
                  pupilSize={7} 
                  maxDistance={5} 
                  eyeColor="white" 
                  pupilColor="#2D2D2D" 
                  isBlinking={isPurpleBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
                <EyeBall 
                  size={18} 
                  pupilSize={7} 
                  maxDistance={5} 
                  eyeColor="white" 
                  pupilColor="#2D2D2D" 
                  isBlinking={isPurpleBlinking}
                  forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                  forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                />
              </div>
            </div>

            {/* Black Character */}
            <div 
              ref={blackRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '240px',
                width: '120px',
                height: '310px',
                backgroundColor: '#2D2D2D',
                borderRadius: '8px 8px 0 0',
                zIndex: 2,
                transform: (password.length > 0 && showPassword)
                  ? `skewX(0deg)`
                  : isLookingAtEachOther
                    ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                    : (isTyping || (password.length > 0 && !showPassword))
                      ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)` 
                      : `skewX(${blackPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div 
                className="absolute flex gap-6 transition-all duration-700 ease-in-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${10}px` : isLookingAtEachOther ? `${32}px` : `${26 + blackPos.faceX}px`,
                  top: (password.length > 0 && showPassword) ? `${28}px` : isLookingAtEachOther ? `${12}px` : `${32 + blackPos.faceY}px`,
                }}
              >
                <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking} forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined} />
                <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#2D2D2D" isBlinking={isBlackBlinking} forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined} />
              </div>
            </div>

            {/* Orange Character */}
            <div 
              ref={orangeRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '0px',
                width: '240px',
                height: '200px',
                zIndex: 3,
                backgroundColor: '#FF9B6B',
                borderRadius: '120px 120px 0 0',
                transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div 
                className="absolute flex gap-8 transition-all duration-200 ease-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${50}px` : `${82 + (orangePos.faceX || 0)}px`,
                  top: (password.length > 0 && showPassword) ? `${85}px` : `${90 + (orangePos.faceY || 0)}px`,
                }}
              >
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
              </div>
            </div>

            {/* Yellow Character */}
            <div 
              ref={yellowRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: '310px',
                width: '140px',
                height: '230px',
                backgroundColor: '#E8D754',
                borderRadius: '70px 70px 0 0',
                zIndex: 4,
                transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew || 0}deg)`,
                transformOrigin: 'bottom center',
              }}
            >
              <div 
                className="absolute flex gap-6 transition-all duration-200 ease-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${20}px` : `${52 + (yellowPos.faceX || 0)}px`,
                  top: (password.length > 0 && showPassword) ? `${35}px` : `${40 + (yellowPos.faceY || 0)}px`,
                }}
              >
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
              </div>
              <div 
                className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
                style={{
                  left: (password.length > 0 && showPassword) ? `${10}px` : `${40 + (yellowPos.faceX || 0)}px`,
                  top: (password.length > 0 && showPassword) ? `${88}px` : `${88 + (yellowPos.faceY || 0)}px`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="relative z-20 flex items-center gap-8 text-sm opacity-60">
          <a href="#" className="hover:opacity-100 transition-opacity">Privacy Policy</a>
          <a href="#" className="hover:opacity-100 transition-opacity">Terms of Service</a>
        </div>

        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
      </div>

      {/* Right Login Section */}
      <div className={cn(
        "flex items-center justify-center p-8 transition-colors duration-700",
        isJunior 
          ? "bg-[#111111] text-[#F2F0ED]" 
          : "bg-[#F2F2F2] text-[#0F172A]" // Business Right Bg and Text
      )}>
        <div className={cn("w-full max-w-[420px]", isJunior && "dark-mode-text-fix")}>
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 text-lg font-bold mb-12">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="size-4 text-primary" />
            </div>
            <span>Udyaam</span>   
          </div>

          <div className="text-center mb-10">
            <h1 className={cn("text-4xl font-bold tracking-tight mb-2", !isJunior && "text-[#0F172A]")}>
              {isLoginMode ? "Welcome Back!" : "Create an Account"}
            </h1>
            <p className={cn("text-sm", isJunior ? "text-white/60" : "text-[#64748B]")}>
              {isLoginMode ? "Please enter your details" : "Join the Udyaam OS today"}
            </p>
          </div>

          {/* Role Toggle Button */}
          <div className="flex justify-center mb-10">
            <button
               onClick={() => setRole(isJunior ? "Business" : "JuniorPro")}
               className={cn(
                 "relative w-[280px] h-14 rounded-full overflow-hidden transition-all duration-500 flex items-center p-1.5",
                 isJunior ? "bg-[#222222] border border-white/5" : "bg-[#F2F2F2] border border-[#E2E8F0]"
               )}
            >
              <div 
                className={cn(
                  "absolute h-11 rounded-full transition-all duration-500 shadow-md flex items-center justify-center font-bold text-xs uppercase tracking-widest",
                  isJunior 
                    ? "left-[calc(50%+3px)] w-[calc(50%-9px)] bg-[#804CE4] text-white" 
                    : "left-1.5 w-[calc(50%-9px)] bg-white text-[#0F172A]"
                )}
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                {role === "Business" ? "Business" : "Junior Pro"}
              </div>
              <div className={cn("w-1/2 text-center text-xs font-bold uppercase tracking-widest z-10 transition-colors duration-500", !isJunior ? "opacity-0" : "text-white/50 hover:text-white/80")} style={{ fontFamily: 'var(--font-jakarta)' }}>Business</div>
              <div className={cn("w-1/2 text-center text-xs font-bold uppercase tracking-widest z-10 transition-colors duration-500", isJunior ? "opacity-0" : "text-[#64748B] hover:text-[#0F172A]")} style={{ fontFamily: 'var(--font-jakarta)' }}>Junior Pro</div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLoginMode && (
              <div className="space-y-2">
                <Label htmlFor="name" className={isJunior ? "text-white/80" : "text-[#0F172A]"}>
                  {role === "Business" ? "Company Name" : "Full Name"}
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={role === "Business" ? "Sangam Textiles" : "Alex Coder"}
                  value={name}
                  autoComplete="name"
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  required
                  className={cn(
                    "h-12 border", 
                    isJunior 
                      ? "border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-white/30" 
                      : "border-[#E2E8F0] bg-[#F2F2F2] text-[#0F172A] focus-visible:ring-[#804CE4]"
                  )}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className={isJunior ? "text-white/80" : "text-[#0F172A]"}>Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="anna@gmail.com"
                value={email}
                autoComplete="off"
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                required
                className={cn(
                  "h-12 border", 
                  isJunior 
                    ? "border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-white/30" 
                    : "border-[#E2E8F0] bg-[#F2F2F2] text-[#0F172A] focus-visible:ring-[#804CE4]"
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className={isJunior ? "text-white/80" : "text-[#0F172A]"}>Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={cn(
                    "h-12 pr-10 border", 
                    isJunior 
                      ? "border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-white/30"
                      : "border-[#E2E8F0] bg-[#F2F2F2] text-[#0F172A] focus-visible:ring-[#7C3AED]"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className={cn("size-5", isJunior ? "text-white/60" : "text-[#64748B]")} /> : <Eye className={cn("size-5", isJunior ? "text-white/60" : "text-[#64748B]")} />}
                </button>
              </div>
            </div>

            {isLoginMode && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" className={cn(isJunior ? "border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-black" : "border-[#E2E8F0] data-[state=checked]:bg-[#0A0A0A] data-[state=checked]:text-white")} />
                  <Label htmlFor="remember" className={cn("text-sm font-normal cursor-pointer", isJunior ? "text-white/80" : "text-[#64748B]")}>
                    Remember me
                  </Label>
                </div>
                <a href="#" className={cn("text-sm hover:underline font-medium", isJunior ? "text-[#FF9B6B]" : "text-[#111111]")}>Forgot password?</a>
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="size-4" />
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className={cn(
                "w-full h-12 text-base !font-bold !uppercase !tracking-widest transition-all shadow-md", 
                isJunior 
                  ? "bg-[#804CE4] text-white hover:bg-[#FF9B6B]/90"
                  : "bg-[#111111] text-white hover:bg-[#2D2D2D]"
              )} 
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : isLoginMode ? "Log in" : "Sign Up"}
            </Button>
          </form>

          <div className="mt-6">
            <Button 
              variant="outline" 
              className={cn(
                "w-full h-12 shadow-sm transition-all !font-medium !normal-case !tracking-normal", 
                isJunior 
                  ? "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white" 
                  : "bg-[#F2F2F2] border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]"
              )} 
              type="button" 
              onClick={handleGoogleSubmit} 
              disabled={isLoading}
            >
              <Mail className="mr-2 size-5" />
              {isLoginMode ? "Log in with Google" : "Sign up with Google"}
            </Button>
          </div>

          <div className="mt-10 text-center">
            <p className={cn("text-sm font-medium", isJunior ? "text-white/60" : "text-[#64748B]")}>
              {isLoginMode ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                className={cn("ml-2 !font-bold hover:underline !normal-case !tracking-normal", isJunior ? "text-white" : "text-[#0F172A]")}
                onClick={() => setIsLoginMode(!isLoginMode)}
              >
                {isLoginMode ? "Sign up" : "Log in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
