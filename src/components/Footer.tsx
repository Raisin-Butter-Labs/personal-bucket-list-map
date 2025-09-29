import React from "react";

export const Footer: React.FC = () => {
    return (
        <div className="fixed inset-x-0 bottom-4 z-[1100] flex justify-center pointer-events-none">
            <div className="pointer-events-auto">
                <div className="rounded-full p-[1px] bg-gradient-to-r from-primary/40 via-foreground/30 to-primary/40 shadow-lg">
                    <div className="rounded-full bg-background/80 supports-[backdrop-filter]:backdrop-blur-md border border-border/60 px-4 py-2 text-sm text-muted-foreground">
                        <div className="inline-flex items-center justify-center gap-1.5 sm:gap-2 leading-none">
                            <span>Made with</span>
                            <span className="text-rose-500">❤️</span>
                            <span>by</span>
                            <a
                                href="https://raisinbutterlabs.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-foreground hover:text-primary transition-colors"
                            >
                                Raisin Butter Labs
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Footer;
