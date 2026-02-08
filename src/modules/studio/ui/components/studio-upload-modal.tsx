"use client";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button"

import { Loader2Icon, PlusIcon } from "lucide-react"
import { toast } from "sonner";
import { ResponsiveModal } from "@/components/responsive-modal";
import { StudioUploader } from "./studio-uploader";
import { useRouter } from "next/navigation";

export const StudioUploadModal = () => {
    const router = useRouter();
    const utils = trpc.useUtils();  
    const create = trpc.videos.create.useMutation({
        onSuccess: () => {
            toast.success("Video created");
            utils.studio.getMany.invalidate();
        },
        onError: () => {
            toast.error("Something went wrong"); 
        },
    });

    const onSuccess = () => {
        if (!create.data?.video.id) return;

        create.reset();
        router.push(`/studio/videos/${create.data.video.id}`);
    };
    return (
        <>
        <ResponsiveModal
            title="Upload a video"
            open={!!create.data?.url}
            onOpenChange = {() => create.reset( )}
        >
            {create.data?.url 
                ? <StudioUploader endpoint={create.data.url} onSuccess={onSuccess} /> 
                : <Loader2Icon />
            }
        </ResponsiveModal>
        <Button variant="secondary" onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? <Loader2Icon className="animate-spin"/> : <PlusIcon />}
            Create
        </Button>
        </>
    );
};

/*
    19-01-2026
    Makes it so that now, on clicking Create+ button within studio modal, we can get a video created, a database entry for a video 
    But we seem to be needing to refresh everytime to see the newly created entry.
 */