import express from "express";
import dotenv from "dotenv";
import prisma from "./utils/prisma.js";
import jwt from "jsonwebtoken";
import { sendToken } from "./utils/sendToken.js";
import { isAuthenticated } from "./middleware/auth.js";
import axios from "axios";


dotenv.config();

const app = express();
const port = process.env.PORT || 6000;
const APPLE_SANDBOX_URL = "https://sandbox.itunes.apple.com/verifyReceipt";
const APPLE_PROD_URL = "https://buy.itunes.apple.com/verifyReceipt";
const APP_SHARED_SECRET = "4a30a73d10874dbfb41e37cf8cc20b48";

//Middleware to parse JSON request bodies
app.use(express.json({ limit: "100mb" }));

// user login
app.post("/login", async (req, res) => {
  try {
    const { signedToken } = req.body;
    const data = jwt.verify(signedToken, process.env.JWT_SECRET_KEY);
    if (data) {
      const isUserExist = await prisma.user.findUnique({
        where: {
          email: data.email,
        },
      });
      if (isUserExist) {
        await sendToken(isUserExist, res);
      } else {
        const user = await prisma.user.create({
          data: {
            name: data.name,
            email: data.email,
            avatar: data.avatar,
          },
        });
        await sendToken(user, res);
      }
    } else {
      res.status(404).json({
        success: false,
        message: "Your request is not authorized!",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

// get logged in user
app.get("/me", isAuthenticated, async (req, res, next) => {
  try {
    const user = req.user;
    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
  }
});

// get courses
app.get("/get-courses", async (req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        courseData: {
          include: {
            links: true,
          },
        },
        benefits: true,
        prerequisites: true,
      },
    });

    res.status(201).json({
      success: true,
      courses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// fetch questions
app.get(
  "/get-questions/:contentId",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const contentId = req.params.contentId;
      const questions = await prisma.courseQuestions.findMany({
        where: {
          contentId,
        },
        include: {
          user: true,
          answers: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      res.status(201).json({
        success: true,
        questions,
      });
    } catch (error) {
      res.status(501).json({ success: false, message: error.message });
    }
  }
);

// adding reply to question
app.put("/adding-reply", isAuthenticated, async (req, res) => {
  try {
    await prisma.courseQuestionAnswers.create({
      data: {
        questionId: req.body.questionId,
        answer: req.body.answer,
        userId: req.user.id,
      },
    });

    const q = await prisma.courseQuestions.findUnique({
      where: {
        id: req.body.questionId,
      },
      include: {
        user: true,
      },
    });

    if (q?.user.id !== req.user.id) {
      function truncateString(str, num) {
        if (str.length > num) {
          let end = str.substring(0, num).lastIndexOf(" ");
          return str.substring(0, end) + "...";
        }
        return str;
      }

      await prisma.notification.create({
        data: {
          title: `New Answer Received`,
          message: `You have a new answer in your question - ${truncateString(
            q.question,
            10
          )}`,
          creatorId: req.user?.id,
          receiverId: q.user.id,
          redirect_link: `https://www.saslcertificate.com${
            req.body.courseSlug
          }?lesson=${req.body.activeVideo + 1}`,
          questionId: req.body.questionId,
        },
      });

      if (q.user.pushToken) {
        const courseData = await prisma.course.findUnique({
          where: {
            slug: req.body.courseSlug,
          },
        });
        const pushData = {
          to: q.user.pushToken,
          sound: "default",
          title: `New Answer Received`,
          body: `You have a new answer in your question - ${truncateString(
            q.question,
            10
          )}`,
          data: {
            ...courseData,
            activeVideo: req.body.activeVideo,
          },
        };

        await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pushData),
        });
      }
    }

    const question = await prisma.courseQuestions.findMany({
      where: {
        contentId: req.body.contentId,
      },
      include: {
        user: true,
        answers: {
          include: {
            user: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      question,
    });
  } catch (error) {
    res.status(501).json({ success: false, message: error.message });
  }
});

// create order
app.post("/create-order", isAuthenticated, async (req, res, next) => {
  const { receipt, courseId, in_app_productId } = req.body;

  if (!receipt || !courseId) {
    return res.status(400).json({ error: "Invalid request data!" });
  }

  try {
    // send receipt to apple for validation
    const response = await axios.post(APPLE_SANDBOX_URL, {
      "receipt-data": receipt,
      password: APP_SHARED_SECRET,
    });
    if (response.data.status !== 0) {
      return res.status(400).json({ error: "Invalid receipt!" });
    }

    const transaction = response.data.receipt.in_app.find(
      (item) => item.product_id === in_app_productId
    );

    const apple_transection_id = transaction.original_transaction_id;

    const existingPurchase = await prisma.orders.findFirst({
      where: {
        transaction_id: apple_transection_id,
      },
    });

    if (existingPurchase) {
      return res
        .status(400)
        .json({ error: "This course has already been purchased!" });
    }
    const order = await prisma.orders.create({
      data: {
        userId: req.user.id,
        product_id: in_app_productId,
        courseId: courseId,
        transaction_id: transaction.transaction_id,
      },
    });

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    console.log(error);
    res.status(501).json({
      success: false,
      message: error.message,
    });
  }
});

app.post("/create-free-order", isAuthenticated, async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
      },
    });

    if (course.price === 0) {
      await prisma.orders.create({
        data: {
          courseId,
          userId: req.user.id,
        },
      });

      res.status(201).json({
        success: true,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "This course isn't free",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(501).json({
      success: true,
      message: error.message,
    });
  }
});

app.get("/get-reviews/:courseId", async (req, res) => {
  const reviewsData = await prisma.reviews.findMany({
    where: {
      courseId: req.params.courseId,
    },
    include: {
      user: true,
      replies: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  res.status(201).json({
    success: true,
    reviewsData,
  });
});

// create review
app.post("/add-review", isAuthenticated, async (req, res) => {
  try {
    const { ratings, review, courseId } = req.body;

    const reviews = await prisma.reviews.create({
      data: {
        rating: ratings,
        comment: review,
        courseId,
        userId: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      reviews,
    });
  } catch (error) {
    res.status(501).json({
      success: false,
      message: error.message,
    });
  }
});

// fetching videoCompleteHistory
app.get("/video-complete-history", isAuthenticated, async (req, res) => {
  try {
    const videos = await prisma.videoCompleteHistory.findMany({
      where: {
        userId: req.user.id,
      },
    });
    res.status(201).json({
      success: true,
      videos,
    });
  } catch (error) {
    console.log(error);
  }
});

// adding to video complete history
app.post("/add-video-complete-history", isAuthenticated, async (req, res) => {
  try {
    const { contentId } = req.body;

    const isVideoExist = await prisma.videoCompleteHistory.findFirst({
      where: {
        userId: req.user.id,
        contentId,
      },
    });

    if (isVideoExist) {
      res.status(201).json({
        success: true,
        video: isVideoExist,
      });
    } else {
      const video = await prisma.videoCompleteHistory.create({
        data: {
          userId: req.user.id,
          contentId,
        },
      });
      res.status(201).json({
        success: true,
        video,
      });
    }
  } catch (error) {
    console.log(error);
  }
});

// updating push token
app.put("/update-push-token", isAuthenticated, async (req, res) => {
  try {
    const user = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        pushToken: req.body.pushToken,
      },
    });
    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(501).json({
      success: false,
      message: error.message,
    });
  }
});

// get notifications
app.get("/get-notifications", isAuthenticated, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [{ receiverId: req.user?.id }, { receiverId: "All" }],
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(201).json({
      success: true,
      notifications,
    });
  } catch (error) {
    res.status(501).json({
      success: false,
      message: error.message,
    });
  }
});

// delete notification
app.delete(
  "/delete-notification/:id",
  isAuthenticated,
  async (req, res, next) => {
    try {
      await prisma.notification.delete({
        where: {
          id: req.params.id,
        },
      });

      const notifications = await prisma.notification.findMany({
        where: {
          OR: [{ receiverId: req.user?.id }, { receiverId: "All" }],
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      res.status(201).json({
        success: true,
        notifications,
      });
    } catch (error) {
      res.status(501).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// create ticket
app.post("/create-ticket", isAuthenticated, async (req, res) => {
  try {
    const { ticketTitle, details } = req.body;

    const ticket = await prisma.tickets.create({
      data: {
        ticketTitle,
        details,
        creatorId: req.user.id,
      },
    });
    res.status(201).json({
      success: true,
      ticket,
    });
  } catch (error) {
    res.status(501).json({
      success: false,
      message: error.message,
    });
  }
});

// get ticket replies
app.get("/get-ticket/:id", isAuthenticated, async (req, res) => {
  try {
    const ticket = await prisma.ticketReply.findMany({
      where: {
        ticketId: req.params.id,
      },
      include: {
        user: true,
      },
    });
    res.status(201).json({
      success: true,
      ticket,
    });
  } catch (error) {
    res.status(501).json({
      success: false,
      message: error.message,
    });
  }
});

// adding new reply
app.put("/ticket-reply", isAuthenticated, async (req, res) => {
  try {
    const { ticketId, ticketReply } = req.body;

    const reply = await prisma.ticketReply.create({
      data: {
        ticketId: ticketId,
        reply: ticketReply,
        replyId: req.user.id,
      },
      include: {
        user: true,
      },
    });

    await prisma.tickets.update({
      where: {
        id: ticketId,
      },
      data: {
        status: req.user.role === "Admin" ? "Answered" : "Pending",
      },
    });

    res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to add reply",
    });
  }
});


// android create order
app.post("/android-create-order", isAuthenticated, async (req, res, next) => {
  try {
    const { purchaseToken, productId, orderId } = req.body;
    if (!purchaseToken || !productId || !orderId) {
      return res.status(400).json({ error: "Invalid request!" });
    }

    const existingPurchase = await prisma.orders.findFirst({
      where: {
        androidOrderId: orderId,
      },
    });
    if (existingPurchase) {
      return res.status(400).json({ error: "🚨 Duplicate purchase detected!" });
    }
    
    const purchseData = response.data;

    if (purchseData.purchaseState !== 0) {
      return res.status(400).json({ error: "🚨 Invalid purchase!" });
    }

    const order = await prisma.orders.create({
      data: {
        userId: req.user.id,
        product_id: productId,
        androidOrderId: orderId,
        purchaseToken,
      },
    });
    res.json({ success: true, order, message: "Order created successfuly!" });
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app;
