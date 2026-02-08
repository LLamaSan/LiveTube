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
const TITLE_SYSTEM_PROMPT = `Your task is to generate an SEO-focused title for a YouTube video based on its transcript. Please follow these guidelines:
- Be concise but descriptive, using relevant keywords to improve discoverability.
- Highlight the most compelling or unique aspect of the video content.
- Avoid jargon or overly complex language unless it directly supports searchability.
- Use action-oriented phrasing or clear value propositions where applicable.
- Ensure the title is 3-8 words long and no more than 100 characters.
- ONLY return the title as plain text. Do not add quotes or any additional formatting.`;





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
            ${TITLE_SYSTEM_PROMPT}

            Video Transcript:
            ${videoTranscript}

            Generate ONE title only.
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

    let title = rawContent.trim();
    title = title.replace(/^["']+|["']+$/g, "");

    await context.run("update-video", async () => {
      await db
        .update(videos)
        .set({
            title: title || video.title,
        })
        .where(and(
            eq(videos.id, video.id),
            eq(videos.userId, video.userId),
        ))
    })
  }
) 