"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import {
    Book,
    CloudUpload,
    User,
    LogOut,
    Menu,
    X,
    Home,
    ChevronDown,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Navigation() {
    const pathname = usePathname()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [user, setUser] = useState<any>(null)

    // Check if user is logged in
    React.useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user || null)
        }

        getSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setIsMenuOpen(false)
    }

    const navItems = [
        { href: "/", label: "Home", icon: Home },
        { href: "/library", label: "Library", icon: Book },
        { href: "/upload", label: "Upload", icon: CloudUpload },
    ]

    const isActive = (path: string) => pathname === path

    // Helper function to get avatar URL
    const getAvatarUrl = () => {
        return user?.user_metadata?.avatar_url || user?.user_metadata?.picture || ""
    }

    // Helper function to get user initials
    const getInitials = () => {
        const name = user?.user_metadata?.full_name || user?.email || ""
        if (name) {
            return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        }
        return user?.email?.slice(0, 2).toUpperCase() || "U"
    }

    // Helper function to get display name
    const getDisplayName = () => {
        return user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User"
    }
    const getprovider = () => {
        const provider = user?.app_metadata?.provider || "email";
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                        <Image src="/logo.png" alt="Pothpath Logo" width={32} height={32} className="object-contain" />
                        Pothpath
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${isActive(item.href) ? "text-primary" : "text-muted-foreground"
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Right side items */}
                    <div className="flex items-center gap-4">
                        {/* Theme Toggle */}
                        <ModeToggle />

                        {/* Auth buttons - Desktop */}
                        <div className="hidden md:flex items-center gap-2">
                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="flex items-center gap-2 px-2 py-1 rounded-full">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage
                                                    src={getAvatarUrl()}
                                                    alt={getDisplayName()}
                                                />
                                                <AvatarFallback className="text-xs">
                                                    {getInitials()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium max-w-24 truncate">
                                                {getDisplayName()}
                                            </span>
                                            <ChevronDown className="w-4 h-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {getDisplayName()}
                                                </p>
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    {getprovider()}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                                                <User className="w-4 h-4" />
                                                Profile
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={handleLogout}
                                            className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Logout
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link href="/login">
                                        <Button variant="ghost" size="sm">
                                            Login
                                        </Button>
                                    </Link>
                                    <Link href="/signup">
                                        <Button size="sm">
                                            Sign Up
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <button
                            className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden border-t py-4">
                        <nav className="flex flex-col gap-4">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md transition-colors ${isActive(item.href)
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:text-primary hover:bg-muted"
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                )
                            })}

                            {/* Mobile Auth buttons */}
                            <div className="border-t pt-4 mt-2">
                                {user ? (
                                    <div className="flex flex-col gap-2">
                                        {/* Mobile User Info */}
                                        <div className="flex items-center gap-3 px-2 py-2 mb-2">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage
                                                    src={getAvatarUrl()}
                                                    alt={getDisplayName()}
                                                />
                                                <AvatarFallback className="text-xs">
                                                    {getInitials()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{getDisplayName()}</span>
                                                <span className="text-xs text-muted-foreground">{user?.raw_app_meta_data?.provider}</span>
                                            </div>
                                        </div>
                                        <Link
                                            href="/profile"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                                        >
                                            <User className="w-5 h-5" />
                                            Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors text-left"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            Logout
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <Link
                                            href="/login"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            href="/signup"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-3 px-2 py-2 text-base font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                        >
                                            Sign Up
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    )
}