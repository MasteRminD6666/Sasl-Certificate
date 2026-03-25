"use server";

import prisma from "@/utils/prisma";
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: "",
  api_key: "",
  api_secret: "",
  secure: true,
});

// Upload image helper function
const uploadImageToCloudinary = async (image: string): Promise<string> => {
  try {
    if (!image) throw new Error("No image provided for upload.");
    const result = await cloudinary.uploader.upload(image, {
      folder: "courses",
      resource_type: "image",
    });
    return result.secure_url;
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw new Error("Image upload failed");
  }
};

// Define types for the input parameters
type Benefit = { title: string };
type Prerequisite = { title: string };
type Link = { title: string; url: string };
type CourseContent = {
  title: string;
  videoUrl: string;
  videoSection: string;
  description: string;
  videoLength: string;
  links: Link[];
};
type CourseInfo = {
  name: string;
  description: string;
  price: number;
  estimatedPrice: number;
  tags: string;
  level: string;
  categories: string | null;
  demoUrl: string;
  thumbnail: string;
  slug: string;
};

// Main EditCourse function
export const EditCourse = async ({
  slug,
  courseInfo,
  benefits = [],
  prerequisites = [],
  courseContentData = [],
}: {
  slug: string;
  courseInfo: CourseInfo;
  benefits: Benefit[];
  prerequisites: Prerequisite[];
  courseContentData: CourseContent[];
}): Promise<{ success: boolean; message: string; error?: any }> => {
  try {
    if (!slug || !courseInfo) {
      throw new Error("Missing required slug or courseInfo.");
    }

    // Step 1: Find the course by slug
    const existingCourse = await prisma.course.findUnique({
      where: { slug },
    });

    if (!existingCourse) {
      throw new Error(`Course with slug "${slug}" not found.`);
    }

    // Step 2: Check if the thumbnail is updated
    let updatedThumbnailUrl = courseInfo.thumbnail;
    if (courseInfo.thumbnail && courseInfo.thumbnail.startsWith("data:image")) {
      updatedThumbnailUrl = await uploadImageToCloudinary(courseInfo.thumbnail);
    }

    // Step 3: Update the course
    await prisma.course.update({
      where: { slug },
      data: {
        name: courseInfo.name,
        description: courseInfo.description,
        categories: courseInfo.categories,
        price: courseInfo.price,
        estimatedPrice: courseInfo.estimatedPrice,
        thumbnail: updatedThumbnailUrl,
        tags: courseInfo.tags,
        level: courseInfo.level,
        demoUrl: courseInfo.demoUrl,
        updatedAt: new Date(),
      },
    });

    // Step 4: Update benefits
    const existingBenefits = await prisma.courseBenefits.findMany({
      where: { courseId: existingCourse.id },
    });

    const benefitsToDelete = existingBenefits.filter(
      (eb) => !benefits.some((b) => b.title === eb.title)
    );
    const benefitsToAdd = benefits.filter(
      (b) => !existingBenefits.some((eb) => eb.title === b.title)
    );

    await Promise.all([
      ...benefitsToDelete.map((b) =>
        prisma.courseBenefits.delete({ where: { id: b.id } })
      ),
      ...benefitsToAdd.map((b) =>
        prisma.courseBenefits.create({
          data: { title: b.title, courseId: existingCourse.id },
        })
      ),
    ]);

    // Step 5: Update prerequisites
    const existingPrerequisites = await prisma.coursePrerequisites.findMany({
      where: { courseId: existingCourse.id },
    });

    const prerequisitesToDelete = existingPrerequisites.filter(
      (ep) => !prerequisites.some((p) => p.title === ep.title)
    );
    const prerequisitesToAdd = prerequisites.filter(
      (p) => !existingPrerequisites.some((ep) => ep.title === p.title)
    );

    await Promise.all([
      ...prerequisitesToDelete.map((p) =>
        prisma.coursePrerequisites.delete({ where: { id: p.id } })
      ),
      ...prerequisitesToAdd.map((p) =>
        prisma.coursePrerequisites.create({
          data: { title: p.title, courseId: existingCourse.id },
        })
      ),
    ]);

    // Step 6: Update course content
    const existingCourseContent = await prisma.courseData.findMany({
      where: { courseId: existingCourse.id },
      include: { links: true },
    });

    const contentToDelete = existingCourseContent.filter(
      (ec) => !courseContentData.some((cc) => cc.title === ec.title)
    );
    const contentToAdd = courseContentData.filter(
      (cc) => !existingCourseContent.some((ec) => ec.title === cc.title)
    );
    const contentToUpdate = courseContentData.filter((cc) =>
      existingCourseContent.some((ec) => ec.title === cc.title)
    );

    await Promise.all([
      ...contentToDelete.map((content) =>
        prisma.courseData.delete({ where: { id: content.id } })
      ),
      ...contentToAdd.map((content) =>
        prisma.courseData.create({
          data: {
            title: content.title,
            videoUrl: content.videoUrl,
            videoSection: content.videoSection,
            description: content.description,
            videoLength: content.videoLength,
            courseId: existingCourse.id,
            links: {
              create: content.links.map((link) => ({
                title: link.title,
                url: link.url,
              })),
            },
          },
        })
      ),
      ...contentToUpdate.map(async (content) => {
        const existingContent = existingCourseContent.find(
          (ec) => ec.title === content.title
        );
        if (!existingContent) return;

        await prisma.courseData.update({
          where: { id: existingContent.id },
          data: {
            videoUrl: content.videoUrl,
            videoSection: content.videoSection,
            description: content.description,
            videoLength: content.videoLength,
            links: {
              deleteMany: {},
              create: content.links.map((link) => ({
                title: link.title,
                url: link.url,
              })),
            },
          },
        });
      }),
    ]);

    return { success: true, message: "Course updated successfully." };
  } catch (error: any) {
    console.error("Error updating course:", error.message);
    return { success: false, message: "Error updating course.", error };
  }
};
