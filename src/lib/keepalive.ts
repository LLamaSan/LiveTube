// lib/keepalive.ts
"use client";

import { useEffect } from "react";

export function KeepAlive() {
    useEffect(() => {
        // Comment this out when done for the day
        const interval = setInterval(() => {
            fetch("/api/keepalive").then(() => console.log("DB pinged"));
        }, 240000); // every 4 minutes

        return () => clearInterval(interval);
    }, []);

    return null;
}