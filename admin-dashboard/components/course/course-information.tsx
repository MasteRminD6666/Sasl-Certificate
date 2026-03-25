import { Button } from "@nextui-org/react";
import React, { useState } from "react";

const CourseInformation = ({
  courseInfo,
  setCourseInfo,
  active,
  setActive,
}: {
  courseInfo: courseInfoType;
  setCourseInfo: (e: courseInfoType) => void;
  active: number;
  setActive: (active: number) => void;
}) => {
  const [dragging, setDragging] = useState(false);

  const categories = [
    {
      title: "Programming",
    },
    {
      title: "Graphics Design",
    },
    {
      title: "Digital Marketing",
    },
  ];

  const handleSubmit = (e: any) => {
    // e?.preventDefault();
    const slug = courseInfo.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setCourseInfo({ ...courseInfo, slug });
    setActive(active + 1);
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        if (reader.readyState === 2) {
          setCourseInfo({ ...courseInfo, thumbnail: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: any) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = () => {
        setCourseInfo({ ...courseInfo, thumbnail: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-[85%] ml-10 mt-24">
      <form
        onSubmit={handleSubmit}
        className={`text-[16px] font-Poppins text-white`}
      >
        <div>
          <label htmlFor="">Course Name</label>
          <input
            type="name"
            name=""
            required
            value={courseInfo.name}
            onChange={(e: any) =>
              setCourseInfo({ ...courseInfo, name: e.target.value })
            }
            id="name"
            placeholder="Build your mobile app development career with React Native"
            className={`w-full text-white bg-transparent border rounded h-[40px] px-2 outline-none mt-[10px] font-Poppins`}
          />
        </div>

        <div className="my-5">
          <label className={`text-[16px] font-Poppins text-white`}>
            Course Description
          </label>
          <textarea
            name=""
            id=""
            cols={30}
            rows={8}
            placeholder="Write something amazing..."
            className={`w-full text-white bg-transparent border rounded px-2 outline-none mt-[10px] font-Poppins !h-min !py-2`}
            value={courseInfo.description}
            onChange={(e: any) =>
              setCourseInfo({ ...courseInfo, description: e.target.value })
            }
          ></textarea>
        </div>

        <div className="w-full flex justify-between">
          <div className="w-[45%]">
            <label className={`text-[16px] font-Poppins text-white`}>
              Course Price
            </label>
            <input
              type="number"
              name=""
              required
              value={courseInfo.price}
              onChange={(e: any) =>
                setCourseInfo({ ...courseInfo, price: e.target.value })
              }
              id="price"
              placeholder="29"
              className={`w-full text-white bg-transparent border rounded h-[40px] px-2 outline-none mt-[10px] font-Poppins`}
            />
          </div>
          <div className="w-[50%]">
            <label className={`text-[16px] font-Poppins text-white w-[50%]`}>
              Estimated Price (optional)
            </label>
            <input
              type="number"
              name=""
              value={courseInfo.estimatedPrice}
              onChange={(e: any) =>
                setCourseInfo({ ...courseInfo, estimatedPrice: e.target.value })
              }
              id="price"
              placeholder="79"
              className={`w-full text-white bg-transparent border rounded h-[40px] px-2 outline-none mt-[10px] font-Poppins`}
            />
          </div>
        </div>

        <div className="w-full flex justify-between my-5">
          <div className="w-[45%]">
            <label className={`text-[16px] font-Poppins text-white`}>
              Course Tags
            </label>
            <input
              type="text"
              name=""
              required
              value={courseInfo.tags}
              onChange={(e: any) =>
                setCourseInfo({ ...courseInfo, tags: e.target.value })
              }
              id="tags"
              placeholder="React Native,Expo,Mobile Apps Development"
              className={`w-full text-white bg-transparent border rounded h-[40px] px-2 outline-none mt-[10px] font-Poppins`}
            />
          </div>
          <div className="w-[50%]">
            <label className={`text-[16px] font-Poppins text-white w-[50%]`}>
              Course Category
            </label>
            <select
              name=""
              id=""
              className={`w-full text-white bg-transparent border rounded h-[40px] px-2 outline-none mt-[10px] font-Poppins`}
              value={courseInfo.categories}
              onChange={(e: any) =>
                setCourseInfo({ ...courseInfo, categories: e.target.value })
              }
            >
              <option value="">Select Category</option>
              {categories &&
                categories.map((item: any) => (
                  <option value={item.title} key={item.title}>
                    {item.title}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="w-full flex justify-between my-5">
          <div className="w-[45%]">
            <label className={`text-[16px] font-Poppins text-white`}>
              Course Level
            </label>
            <input
              type="text"
              name=""
              required
              value={courseInfo.level}
              onChange={(e: any) =>
                setCourseInfo({ ...courseInfo, level: e.target.value })
              }
              id="level"
              placeholder="Beginner/Intermediate/Expert"
              className={`w-full text-white bg-transparent border rounded h-[40px] px-2 outline-none mt-[10px] font-Poppins`}
            />
          </div>
          <div className="w-[50%]">
            <label className={`text-[16px] font-Poppins text-white w-[50%]`}>
              Demo Url
            </label>
            <input
              type="text"
              name=""
              value={courseInfo.demoUrl}
              onChange={(e: any) =>
                setCourseInfo({ ...courseInfo, demoUrl: e.target.value })
              }
              id="demoUrl"
              placeholder="Youtube Demo Url *(emhf56)"
              className={`w-full text-white bg-transparent border rounded h-[40px] px-2 outline-none mt-[10px] font-Poppins`}
            />
          </div>
        </div>

        <div className="w-full">
          <input
            type="file"
            accept="image/*"
            id="file"
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            htmlFor="file"
            className={`w-full min-h-[15vh] dark:border-white border-[#00000026] p-3 border flex items-center justify-center ${
              dragging ? "bg-blue-500" : "bg-transparent"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {courseInfo.thumbnail ? (
              <img
                src={courseInfo.thumbnail}
                alt=""
                className="max-h-full w-full object-cover"
              />
            ) : (
              <span className="text-black dark:text-white">
                Drag and drop your thumbnail here or click to browse
              </span>
            )}
          </label>
        </div>
        <br />
        <div className="w-full flex justify-end">
          <Button
            color="primary"
            className="text-lg"
            onPress={(e) => handleSubmit(e)}
          >
            Next
          </Button>
        </div>
        <br />
        <br />
      </form>
    </div>
  );
};

export default CourseInformation;
