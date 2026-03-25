import axios from "axios";
import { useEffect, useState } from "react";

// Mock courses data
const mockCourses: CourseType[] = [
  {
    id: "1",
    name: "Complete React Native Development Course",
    description: "Master React Native and build amazing mobile apps for iOS and Android",
    categories: "Mobile Development",
    price: 49,
    estimatedPrice: 99,
    thumbnail: "https://res.cloudinary.com/dkg6jv4l0/image/upload/v1711468889/courses/spe7bcczfpjmtsdjzm6x.png",
    tags: "React Native, Mobile, JavaScript",
    level: "Beginner",
    demoUrl: "",
    slug: "complete-react-native-development-course",
    lessons: 45,
    payment_id: null,
    ratings: 4.8,
    purchased: 1250,
    benefits: [
      { id: "1", title: "Build real-world mobile applications", courseId: "1", createdAt: new Date(), updatedAt: new Date() },
      { id: "2", title: "Understand React Native fundamentals", courseId: "1", createdAt: new Date(), updatedAt: new Date() },
      { id: "3", title: "Deploy apps to App Store and Play Store", courseId: "1", createdAt: new Date(), updatedAt: new Date() }
    ],
    prerequisites: [
      { id: "1", title: "Basic JavaScript knowledge", courseId: "1", createdAt: new Date(), updatedAt: new Date() },
      { id: "2", title: "Understanding of React basics", courseId: "1", createdAt: new Date(), updatedAt: new Date() }
    ],
    courseData: [
      {
        id: "1",
        title: "Introduction to React Native",
        videoUrl: "",
        videoSection: "Getting Started",
        description: "Learn the basics of React Native",
        videoLength: "15:30",
        links: [],
        questions: [],
        courseId: "1"
      }
    ],
    reviews: [],
    orders: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "2",
    name: "Advanced JavaScript & ES6+ Mastery",
    description: "Deep dive into modern JavaScript features and best practices",
    categories: "Web Development",
    price: 39,
    estimatedPrice: 79,
    thumbnail: "https://res.cloudinary.com/dkg6jv4l0/image/upload/v1711468889/courses/spe7bcczfpjmtsdjzm6x.png",
    tags: "JavaScript, ES6, Programming",
    level: "Intermediate",
    demoUrl: "",
    slug: "advanced-javascript-es6-mastery",
    lessons: 32,
    payment_id: null,
    ratings: 4.7,
    purchased: 980,
    benefits: [
      { id: "4", title: "Master ES6+ features", courseId: "2", createdAt: new Date(), updatedAt: new Date() },
      { id: "5", title: "Write clean and efficient code", courseId: "2", createdAt: new Date(), updatedAt: new Date() },
      { id: "6", title: "Understand async programming", courseId: "2", createdAt: new Date(), updatedAt: new Date() }
    ],
    prerequisites: [
      { id: "3", title: "Basic JavaScript knowledge", courseId: "2", createdAt: new Date(), updatedAt: new Date() }
    ],
    courseData: [
      {
        id: "2",
        title: "ES6 Features Overview",
        videoUrl: "",
        videoSection: "Fundamentals",
        description: "Introduction to ES6 features",
        videoLength: "20:15",
        links: [],
        questions: [],
        courseId: "2"
      }
    ],
    reviews: [],
    orders: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "3",
    name: "Full Stack Web Development Bootcamp",
    description: "Build complete web applications with React, Node.js, and MongoDB",
    categories: "Full Stack",
    price: 59,
    estimatedPrice: 129,
    thumbnail: "https://res.cloudinary.com/dkg6jv4l0/image/upload/v1711468889/courses/spe7bcczfpjmtsdjzm6x.png",
    tags: "React, Node.js, MongoDB, Full Stack",
    level: "Advanced",
    demoUrl: "",
    slug: "full-stack-web-development-bootcamp",
    lessons: 68,
    payment_id: null,
    ratings: 4.9,
    purchased: 2100,
    benefits: [
      { id: "7", title: "Build complete full-stack applications", courseId: "3", createdAt: new Date(), updatedAt: new Date() },
      { id: "8", title: "Learn RESTful API development", courseId: "3", createdAt: new Date(), updatedAt: new Date() },
      { id: "9", title: "Deploy applications to production", courseId: "3", createdAt: new Date(), updatedAt: new Date() }
    ],
    prerequisites: [
      { id: "4", title: "JavaScript fundamentals", courseId: "3", createdAt: new Date(), updatedAt: new Date() },
      { id: "5", title: "HTML and CSS basics", courseId: "3", createdAt: new Date(), updatedAt: new Date() }
    ],
    courseData: [
      {
        id: "3",
        title: "Setting Up Development Environment",
        videoUrl: "",
        videoSection: "Setup",
        description: "Configure your development environment",
        videoLength: "12:45",
        links: [],
        questions: [],
        courseId: "3"
      }
    ],
    reviews: [],
    orders: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "4",
    name: "UI/UX Design Fundamentals",
    description: "Learn the principles of great user interface and experience design",
    categories: "Design",
    price: 29,
    estimatedPrice: 59,
    thumbnail: "https://res.cloudinary.com/dkg6jv4l0/image/upload/v1711468889/courses/spe7bcczfpjmtsdjzm6x.png",
    tags: "Design, UI, UX, Figma",
    level: "Beginner",
    demoUrl: "",
    slug: "ui-ux-design-fundamentals",
    lessons: 28,
    payment_id: null,
    ratings: 4.6,
    purchased: 750,
    benefits: [
      { id: "10", title: "Master design principles", courseId: "4", createdAt: new Date(), updatedAt: new Date() },
      { id: "11", title: "Create beautiful user interfaces", courseId: "4", createdAt: new Date(), updatedAt: new Date() },
      { id: "12", title: "Understand user experience", courseId: "4", createdAt: new Date(), updatedAt: new Date() }
    ],
    prerequisites: [],
    courseData: [
      {
        id: "4",
        title: "Introduction to UI/UX",
        videoUrl: "",
        videoSection: "Basics",
        description: "What is UI/UX design?",
        videoLength: "18:20",
        links: [],
        questions: [],
        courseId: "4"
      }
    ],
    reviews: [],
    orders: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "5",
    name: "Python for Data Science",
    description: "Learn Python programming for data analysis and machine learning",
    categories: "Data Science",
    price: 54,
    estimatedPrice: 109,
    thumbnail: "https://res.cloudinary.com/dkg6jv4l0/image/upload/v1711468889/courses/spe7bcczfpjmtsdjzm6x.png",
    tags: "Python, Data Science, Machine Learning",
    level: "Intermediate",
    demoUrl: "",
    slug: "python-for-data-science",
    lessons: 52,
    payment_id: null,
    ratings: 4.8,
    purchased: 1650,
    benefits: [
      { id: "13", title: "Analyze data with Python", courseId: "5", createdAt: new Date(), updatedAt: new Date() },
      { id: "14", title: "Work with pandas and numpy", courseId: "5", createdAt: new Date(), updatedAt: new Date() },
      { id: "15", title: "Build machine learning models", courseId: "5", createdAt: new Date(), updatedAt: new Date() }
    ],
    prerequisites: [
      { id: "6", title: "Basic programming knowledge", courseId: "5", createdAt: new Date(), updatedAt: new Date() }
    ],
    courseData: [
      {
        id: "5",
        title: "Python Basics for Data Science",
        videoUrl: "",
        videoSection: "Introduction",
        description: "Getting started with Python",
        videoLength: "22:10",
        links: [],
        questions: [],
        courseId: "5"
      }
    ],
    reviews: [],
    orders: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const useGetCourses = () => {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_SERVER_URI}/get-courses`
        );

        // Use API courses if available, otherwise use mock data
        if (response.data.courses && response.data.courses.length > 0) {
          setCourses(response.data.courses);
        } else {
          setCourses(mockCourses);
        }
        setLoading(false);
      } catch (error: any) {
        setCourses(mockCourses);
        setLoading(false);
        setError(error.message);
      }
    };

    fetchCourses();
  }, []);

  return { courses, loading, error };
};

export default useGetCourses;