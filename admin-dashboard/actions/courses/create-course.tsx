"use server";

import prisma from "@/utils/prisma";
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "",
  api_key: "",
  api_secret: "",
  secure: true,
});

const uploadImageToCloudinary = async (image: string) => {
  try {
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

export const CreateCourse = async ({
  courseInfo,
  benefits,
  prerequisites,
  courseContentData,
}: any) => {
  try {
    // Step 1: Upload the thumbnail to a cloud storage (e.g., Cloudinary)
    let uploadedThumbnailUrl = courseInfo.thumbnail;
    if (courseInfo.thumbnail.startsWith("data:image")) {
      uploadedThumbnailUrl = await uploadImageToCloudinary(
        courseInfo.thumbnail
      );
    }

    // Step 2: Create the course
    const course = await prisma.course.create({
      data: {
        name: courseInfo.name,
        description: courseInfo.description,
        categories: courseInfo.categories,
        price: parseFloat(courseInfo.price),
        estimatedPrice: parseFloat(courseInfo.estimatedPrice),
        thumbnail: uploadedThumbnailUrl,
        tags: courseInfo.tags,
        level: courseInfo.level,
        demoUrl: courseInfo.demoUrl,
        slug: courseInfo.slug,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Step 3: Create course benefits
    if (benefits.length > 0) {
      await Promise.all(
        benefits.map((benefit: { title: string }) =>
          prisma.courseBenefits.create({
            data: {
              title: benefit.title,
              courseId: course.id,
            },
          })
        )
      );
    }

    // Step 4: Create course prerequisites
    if (prerequisites.length > 0) {
      await Promise.all(
        prerequisites.map((prerequisite: { title: string }) =>
          prisma.coursePrerequisites.create({
            data: {
              title: prerequisite.title,
              courseId: course.id,
            },
          })
        )
      );
    }

    // Step 5: Create course content and links
    if (courseContentData.length > 0) {
      await Promise.all(
        courseContentData.map(async (content: any) => {
          const createdContent = await prisma.courseData.create({
            data: {
              title: content.title,
              videoUrl: content.videoUrl,
              videoSection: content.videoSection,
              description: content.description,
              videoLength: content.videoLength,
              courseId: course.id,
            },
          });

          if (content.links && content.links.length > 0) {
            await Promise.all(
              content.links.map((link: { title: string; url: string }) =>
                prisma.courseLinks.create({
                  data: {
                    title: link.title,
                    url: link.url,
                    contentId: createdContent.id,
                  },
                })
              )
            );
          }
        })
      );
    }
    return { success: true, message: "Course created successfully." };
  } catch (error) {
    console.error("Error creating course:", error);
    return { success: false, message: "Error creating course.", error };
  }
};
