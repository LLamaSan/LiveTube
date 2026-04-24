
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger, 
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"; 
import { APP_URL } from "@/constants";
import { PlaylistAddModal } from "@/modules/playlists/ui/components/playlist-add-modal";
import { ListPlusIcon, MoreVerticalIcon, ShareIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast, Toaster } from "sonner";


interface VideoMenuProps {
    videoId: string;
    variant?: "ghost" | "secondary";
    onRemove?: () => void;
}



export const VideoMenu = ({
    videoId,
    variant = "ghost",
    onRemove,
}: VideoMenuProps) => {
    const [isOpenPlaylistAddModal, setIsOpenPlaylistAddModal] = useState(false);
    const onShare = () => {
        // TODO: Change if deployed outside of vercel
        const fullUrl = `${APP_URL}/videos/${videoId}`;
        navigator.clipboard.writeText(fullUrl);
        toast.success("URL copied");
        <Toaster
        position="top-right"
        expand
        richColors
        toastOptions={{
            style: {
            zIndex: 999999,
            },
        }}
/>

    }

    return (
    <>
        <PlaylistAddModal 
        videoId={videoId}
        open={isOpenPlaylistAddModal}
        onOpenChange={setIsOpenPlaylistAddModal}
        />
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    size="icon"
                    className="rounded-full"
                >
                    <MoreVerticalIcon />
                </Button>
             </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={onShare}>
                    <ShareIcon className="mr-2 size-4" />
                    Share
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => setIsOpenPlaylistAddModal(true)}>
                    <ListPlusIcon className="mr-2 size-4" />
                    Add to playlist
                </DropdownMenuItem>
                 {onRemove && (
                    <DropdownMenuItem onClick={onRemove}>
                    <Trash2Icon className="mr-2 size-4" />
                    Remove
                    </DropdownMenuItem>
                 )}
             </DropdownMenuContent>
        </DropdownMenu>
    </>
    );
};

