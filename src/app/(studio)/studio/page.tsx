import { DEFAULT_LIMIT } from "@/constants";
import { StudioView } from "@/modules/studio/ui/views/studio-view";
import { HydrateClient, trpc } from "@/trpc/server";

const Page = async () => {
  void trpc.studio.getMany.prefetchInfinite({             // Here we fetch Videos. Only prefetches for the first time, afterwards, everything is on client
    limit: DEFAULT_LIMIT,
  });
  return (
    <HydrateClient>
      <StudioView />
    </HydrateClient>
  );
};

export default Page;