/*
    Create Procedure: protected since we only want the author to create this.
    We use asynchronous context, and destructure from context, the id: as userId,

    We proceed with creating the video, using const [video] = await database,
    with values provided
*/

import { db } from "@/db";
import { videos } from "@/db/schema";
import { mux } from "@/lib/mux";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import z from 'zod';
export const videosRouter = createTRPCRouter({
    create: protectedProcedure.mutation(async ({ ctx }) => {
        const { id: userId } = ctx.user;
        
        const upload = await mux.video.uploads.create({
          new_asset_settings: {
            passthrough: userId,                                // Metadata for us to preserve which user uploaded video, since its going to take time to process, once webhook fires.
            playback_policy: ["public"],
          },
          cors_origin: "*",         // TODO: IN PRODUCTION, set to your url.
        });

        const [video] = await db
            .insert(videos)
            .values({
                userId, 
                title: "Untitled", 
                muxStatus: "waiting",
                muxUploadId: upload.id,
            })
            .returning();
        
        return {
            video: video,
            url: upload.url,
        };
    }),
});