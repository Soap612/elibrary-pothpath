import { Separator } from "@/components/ui/separator";
import {
    DribbbleIcon,
    GithubIcon,
    TwitchIcon,
    TwitterIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const footerLinks = [
    {
        title: "Home",
        href: "/",
    },
    {
        title: "Library",
        href: "/library",
    },
    {
        title: "Upload",
        href: "/upload",
    },
];

const Footer = () => {
    return (
        <footer className="border-t">
            <div className="max-w-(--breakpoint-xl) mx-auto">
                <div className="py-12 flex flex-col justify-start items-center">
                    {/* Logo */}
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <Image src="/logo.png" alt="Pothpath Logo" width={40} height={40} className="object-contain" />
                        Pothpath
                    </div>
                    <ul className="mt-6 flex items-center gap-4 flex-wrap">
                        {footerLinks.map(({ title, href }) => (
                            <li key={title}>
                                <Link
                                    href={href}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    {title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
                <Separator />
                <div className="py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6 xl:px-0">
                    {/* Copyright */}
                    <span className="text-muted-foreground">
                        &copy; {new Date().getFullYear()}{" "}
                        <Link href="/" target="_blank">
                            PothPath
                        </Link>
                        . All rights reserved.
                    </span>

                    <div className="flex items-center gap-5 text-muted-foreground">
                        <Link href="#" target="_blank">
                            <TwitterIcon className="h-5 w-5" />
                        </Link>
                        <Link href="#" target="_blank">
                            <DribbbleIcon className="h-5 w-5" />
                        </Link>
                        <Link href="#" target="_blank">
                            <TwitchIcon className="h-5 w-5" />
                        </Link>
                        <Link href="#" target="_blank">
                            <GithubIcon className="h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
