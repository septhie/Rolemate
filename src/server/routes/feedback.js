const express = require("express");
const prisma = require("../utils/prisma");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { analysisId, rating, comments } = req.body;

    if (!rating) {
      const error = new Error("Please share whether the result was helpful.");
      error.statusCode = 400;
      throw error;
    }

    const feedback = await prisma.feedback.create({
      data: {
        analysisId,
        rating,
        comments: comments || null,
        userId: req.user?.id || null
      }
    });

    res.status(201).json({ feedback });
  })
);

module.exports = router;

