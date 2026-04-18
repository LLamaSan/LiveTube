import { HydrateClient } from "@/trpc/server";

const Page = async () => {
    return(
        <HydrateClient>
            <PlaylistsView />
        </HydrateClient>
    );
}; 

export default Page;