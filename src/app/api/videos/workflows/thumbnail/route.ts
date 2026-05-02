import { db } from "@/db";
import { videos } from "@/db/schema";
import { serve } from "@upstash/workflow/nextjs";
import { and, eq } from "drizzle-orm";
import { InferenceClient } from "@huggingface/inference";
import { UTApi } from "uploadthing/server";

interface InputType {
  userId: string;
  videoId: string;
  prompt: string;
}

const client = new InferenceClient(process.env.HF_TOKEN);

export const { POST } = serve(async (context) => {
  const utapi = new UTApi();
  const input = context.requestPayload as InputType;
  const { videoId, userId, prompt } = input;

  // 1. Fetch existing video data to ensure it exists before starting heavy tasks
  const video = await context.run("get-video", async () => {
    const [existingVideo] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.userId, userId)));

    if (!existingVideo) {
      throw new Error("Video not found");
    }
    return existingVideo;
  });

  // 2. Generate and Upload in one step to bypass the 1MB Upstash state limit
  const uploadedThumbnail = await context.run("generate-and-upload", async () => {
    
    // Use 'unknown' instead of 'any' to satisfy strict TS rules
    const result = await client.textToImage({
      model: "black-forest-labs/FLUX.1-schnell",
      inputs: prompt,
      parameters: { width: 1024, height: 576, num_inference_steps: 5 },
    }) as unknown; 

    let imageBuffer: Buffer;

    // Strict type checks for AI output now safely narrow the 'unknown' type
    if (result instanceof Blob) {
      const arrayBuffer = await result.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } 
    else if (typeof result === "string") {
      const base64Data = result.startsWith("data:image") 
        ? result.split(",")[1] 
        : result;
      imageBuffer = Buffer.from(base64Data, "base64");
    } 
    else if (typeof result === "object" && result !== null && "arrayBuffer" in result) {
      const arrayBuffer = await (result as Response).arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } 
    else {
      throw new Error("AI generated an image in an unknown format.");
    }

    // Wrap buffer in Uint8Array to satisfy the File/BlobPart type definition
    const imageFile = new File(
      [new Uint8Array(imageBuffer)], 
      `thumbnail_${videoId}.png`, 
      { type: "image/png" }
    );

    // Upload directly to UploadThing
    const response = await utapi.uploadFiles([imageFile]);
    const uploadResult = response[0];

    if (!uploadResult.data) {
      throw new Error(uploadResult.error?.message || "UploadThing upload failed");
    }

    // Return only the metadata to keep the Upstash workflow state light
    return {
      key: uploadResult.data.key,
      url: uploadResult.data.url
    };
  });

  // 3. Cleanup existing assets if they exist 
  await context.run("cleanup-thumbnail", async () => {
    if (video.thumbnailKey) {
      await utapi.deleteFiles(video.thumbnailKey);
    }
  });

  // 4. Final Database Update with the new UploadThing assets
  await context.run("update-video", async () => {
    await db
      .update(videos)
      .set({
        thumbnailKey: uploadedThumbnail.key,
        thumbnailUrl: uploadedThumbnail.url,
      })
      .where(and(eq(videos.id, video.id), eq(videos.userId, video.userId)));
  });
});