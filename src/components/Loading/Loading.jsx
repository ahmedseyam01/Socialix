import React from "react";
import { Card, CardHeader, CardBody, Skeleton, Divider } from "@heroui/react";

export default function Loading() {
  // Create an array of 3 skeletons to show while loading
  const skeletonList = [1, 2, 3];

  return (
    <>
      {/* ── Post Feed Skeletons ── */}
      {skeletonList.map((item) => (
        <Card key={item} className="w-full bg-white shadow-md border border-gray-100 rounded-[20px] overflow-hidden">
          {/* ── Header Skeleton ── */}
          <CardHeader className="flex justify-between items-center p-5 pb-3">
            <div className="flex gap-3.5 items-center w-full">
              <Skeleton className="flex rounded-full w-[52px] h-[52px]" />
              <div className="flex flex-col gap-2 w-1/3">
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-3 w-1/2 rounded-lg" />
              </div>
            </div>
          </CardHeader>

          {/* ── Body Skeleton ── */}
          <CardBody className="px-5 py-2">
            <div className="flex flex-col gap-3 mb-5">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-5/6 rounded-lg" />
              <Skeleton className="h-4 w-4/6 rounded-lg" />
            </div>

            <Skeleton className="rounded-[20px] w-full aspect-video mb-5" />

            <Divider className="my-2 bg-gray-50" />

            {/* ── Stats Skeleton ── */}
            <div className="flex justify-between items-center py-4 px-1">
              <div className="flex gap-5">
                <Skeleton className="h-8 w-12 rounded-full" />
                <Skeleton className="h-8 w-12 rounded-full" />
              </div>
              <Skeleton className="h-4 w-24 rounded-lg" />
            </div>

            <Divider className="my-2 bg-gray-50" />

            {/* ── Actions Skeleton ── */}
            <div className="flex justify-between items-center py-2 gap-2">
              <Skeleton className="flex-1 h-12 rounded-xl" />
              <Skeleton className="flex-1 h-12 rounded-xl" />
              <Skeleton className="flex-1 h-12 rounded-xl" />
            </div>
          </CardBody>
        </Card>
      ))}
    </>
  );
}

