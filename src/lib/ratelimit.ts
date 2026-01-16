import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

export const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "10 s"),    //10 requests in 10 seconds causes timeout
});