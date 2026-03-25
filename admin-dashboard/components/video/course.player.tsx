"use client";
import { Skeleton } from "@nextui-org/react";
import { useEffect, useState } from "react";
import { BsGooglePlay } from "react-icons/bs";
import ReactPlayer from "react-player/youtube";

const CoursePlayer = ({
  isDemo,
  videoUrl,
  videoTitle,
}: {
  isDemo?: boolean;
  videoUrl: string;
  videoTitle: string;
}) => {
  const [isMounted, setisMounted] = useState(false);

  useEffect(() => {
    if (!isMounted) {
      setisMounted(true);
    }
  }, [isMounted]);

  if (!isMounted) {
    return (
      <Skeleton
        className={`w-full rounded-lg ${isDemo ? "h-[34vh]" : "h-[70vh]"}`}
      ></Skeleton>
    );
  }

  return (
    <div>
      <ReactPlayer
        width={"100%"}
        height={isDemo ? "34vh" : "70vh"}
        url={`https://www.youtube.com/embed/${videoUrl}`}
        title={videoTitle}
        frameborder="0"
        controls
        playing
        light
        playIcon={<BsGooglePlay color="#1af21e" size={40} />}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media;
        gyroscope; picture-in-picture;"
        allowfullscreen
      ></ReactPlayer>
    </div>
  );
};

export default CoursePlayer;
