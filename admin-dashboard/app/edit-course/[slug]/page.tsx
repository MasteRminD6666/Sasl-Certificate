"use client";
import {
  CourseData,
  CourseInformation,
  CourseContent,
  CourseOptions,
  CoursePreview,
} from "@/components/course";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EditCourse } from "@/actions/courses/edit-course";

const EditCoursePage = () => {
  const router = useRouter();
  const params = useParams<{ slug: string }>();

  const [courseInfo, setCourseInfo] = useState({
    name: "",
    description: "",
    price: 0,
    estimatedPrice: 0,
    tags: "",
    level: "",
    categories: "",
    demoUrl: "",
    thumbnail: "",
    slug: "",
  });
  const [benefits, setBenefits] = useState([{ title: "" }]);
  const [prerequisites, setPrerequisites] = useState([{ title: "" }]);
  const [courseContentData, setCourseContentData] = useState([
    {
      videoUrl: "",
      title: "",
      description: "",
      videoSection: "Untitled Section",
      videoLength: "",
      links: [
        {
          title: "",
          url: "",
        },
      ],
    },
  ]);
  const [courseData, setCourseData] = useState({});
  const [active, setActive] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!params.slug) return;

      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/get-course/${params.slug}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        const course = result.course;

        setCourseInfo({
          name: course.name || "",
          description: course.description || "",
          price: course.price || 0,
          estimatedPrice: course.estimatedPrice || 0,
          tags: course.tags || "",
          level: course.level || "",
          categories: course.categories || "",
          demoUrl: course.demoUrl || "",
          thumbnail: course.thumbnail || "",
          slug: course.slug || "",
        });

        setBenefits(
          course.benefits.map((benefit: { title: string }) => ({
            title: benefit.title,
          }))
        );

        setPrerequisites(
          course.prerequisites.map((prerequisite: { title: string }) => ({
            title: prerequisite.title,
          }))
        );

        setCourseContentData(
          course.courseData.map((content: any) => ({
            videoUrl: content.videoUrl || "",
            title: content.title || "",
            description: content.description || "",
            videoSection: content.videoSection || "Untitled Section",
            videoLength: content.videoLength || "",
            links: content.links.map(
              (link: { title: string; url: string }) => ({
                title: link.title,
                url: link.url,
              })
            ),
          }))
        );
      } catch (err: any) {
        setError(err.message || "Failed to fetch course data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
  }, [params.slug]);

  const handleSubmit = async () => {
    const formattedBenefits = benefits.map((benefit) => ({
      title: benefit.title,
    }));
    const formattedPrerequisites = prerequisites.map((prerequisite) => ({
      title: prerequisite.title,
    }));
    const formattedCourseContentData = courseContentData.map((content) => ({
      videoUrl: content.videoUrl,
      title: content.title,
      description: content.description,
      videoLength: content.videoLength,
      videoSection: content.videoSection,
      links: content.links.map((link) => ({
        title: link.title,
        url: link.url,
      })),
    }));

    const data = {
      name: courseInfo.name,
      description: courseInfo.description,
      categories: courseInfo.categories,
      price: courseInfo.price,
      estimatedPrice: courseInfo.estimatedPrice,
      tags: courseInfo.tags,
      thumbnail: courseInfo.thumbnail,
      level: courseInfo.level,
      demoUrl: courseInfo.demoUrl,
      totalVideos: courseContentData.length,
      benefits: formattedBenefits,
      prerequisites: formattedPrerequisites,
      courseData: formattedCourseContentData,
    };

    setCourseData(data);
  };

  const handleCourseUpdate = async () => {
    await EditCourse({
      slug: courseInfo.slug,
      courseInfo,
      benefits,
      prerequisites,
      courseContentData,
    }).then(() => {
      router.push("/live-courses");
    });
  };

  if (isLoading) return <p>Loading course data...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="w-full flex min-h-screen">
      <div className="w-[80%]">
        {active === 0 && (
          <CourseInformation
            courseInfo={courseInfo}
            setCourseInfo={setCourseInfo}
            active={active}
            setActive={setActive}
          />
        )}
        {active === 1 && (
          <CourseData
            benefits={benefits}
            setBenefits={setBenefits}
            prerequisites={prerequisites}
            setPrerequisites={setPrerequisites}
            active={active}
            setActive={setActive}
          />
        )}
        {active === 2 && (
          <CourseContent
            active={active}
            setActive={setActive}
            isEditingMode={true}
            courseContentData={courseContentData}
            setCourseContentData={setCourseContentData}
            handleSubmit={handleSubmit}
          />
        )}
        {active === 3 && (
          <CoursePreview
            active={active}
            setActive={setActive}
            courseData={courseData}
            handleCourseCreate={handleCourseUpdate}
          />
        )}
      </div>
      <div className="w-[20%] mt-[100px] h-screen fixed top-18 right-0">
        <CourseOptions active={active} setActive={setActive} />
      </div>
    </div>
  );
};

export default EditCoursePage;
