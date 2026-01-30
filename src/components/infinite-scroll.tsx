import { useIntersectionObserver } from "@/hooks/user-intersection-observer";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface InfiniteScrollProps {
    isManual?: boolean;
    hasNextPage: boolean;
    isFetchingNextpage: boolean;
    fetchNextPage: () => void;
};

export const InfiniteScroll = ({
    isManual = false,
    hasNextPage,
    isFetchingNextpage,
    fetchNextPage,
}: InfiniteScrollProps) => {
    const { targetRef, isIntersecting } = useIntersectionObserver({
        threshold: 0.5,
        rootMargin: "100px",
    });

    useEffect  (() => {
        if(isIntersecting && hasNextPage && !isFetchingNextpage && !isManual) {
            fetchNextPage();
        }
    }, [isIntersecting, hasNextPage, isFetchingNextpage, isManual, fetchNextPage]);
    return (
        <div className="flex flex-col items-center gap-5 p-4">
            <div ref={targetRef} className="h-1" />
            {hasNextPage ? (
                <Button
                    variant="secondary"
                    disabled={!hasNextPage || isFetchingNextpage}
                    onClick = {() => fetchNextPage}>
                    {isFetchingNextpage ? "Loading...": "Load more"} 
                </Button>
            ) : (
                <p className="text-xs text-muted-foreground">
                    You have reached the end of the list
                </p>
            )}
        </div>
    )
}