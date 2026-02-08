import { db } from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs"
import { and, eq } from "drizzle-orm";
import { InferenceClient } from "@huggingface/inference";

interface InputType {
    userId: string;
    videoId: string;
};

const client = new InferenceClient(process.env.HF_TOKEN);
const DESCRIPTION_SYSTEM_PROMPT = `Your task is to summarize the transcript of a video. Please follow these guidelines:
- Be brief. Condense the content into a summary that captures the key points and main ideas without losing important details.
- Avoid jargon or overly complex language unless necessary for the context.
- Focus on the most critical information, ignoring filler, repetitive statements, or irrelevant tangents.
- ONLY return the summary, no other text, annotations, or comments.
- Aim for a summary that is 3-5 sentences long and no more than 200 characters.`;





export const { POST } = serve(
  async (context) => {
    const input = context.requestPayload as InputType;
    const { videoId, userId } = input;

    const video = await context.run("get-video", async() => {
        const [existingVideo] = await db
            .select()
            .from(videos)
            .where(and(
                eq(videos.id, videoId),
                eq(videos.userId, userId),
            ));

        if (!existingVideo) {
            throw new Error("Not found");
        }
        return existingVideo;
    })  

    const videoTranscript = await context.run("get-transcript", async () => {
        const trackUrl = `https://stream.mux.com/${video.muxPlaybackId}/text/${video.muxTrackId}.txt`;
        const response = await fetch(trackUrl);
        const text = response.text();

        if (!text) {
            throw new Error ("Bad request");
        }
    
            return text;
        });

    const prompt = `
            ${DESCRIPTION_SYSTEM_PROMPT}

            Video Transcript:
            ${videoTranscript}

            Generate ONE Description only
        `;

const result = await client.chatCompletion({
  model: "meta-llama/Llama-3.1-8B-Instruct",
  messages: [
    { role: "system", content: prompt},
    { role: "user", content: videoTranscript },
  ],
  max_tokens: 32,
  temperature: 0.2,
});

const rawContent =
  result?.choices?.[0]?.message?.content;

if (typeof rawContent !== "string" || rawContent.trim() === "") {
  console.error("Empty or invalid LLM response:", result);
  throw new Error("LLM returned no usable text");
}

let description = rawContent.trim();
description = description.replace(/^["']+|["']+$/g, "");

    await context.run("update-video", async () => {
      await db
        .update(videos)
        .set({
        description: description || video.description,
        })
        .where(and(
            eq(videos.id, video.id),
            eq(videos.userId, video.userId),
        ))
    })
   }

) 
