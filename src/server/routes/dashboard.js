const express = require("express");
const prisma = require("../utils/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/history",
  requireAuth,
  asyncHandler(async (req, res) => {
    const analyses = await prisma.analysis.findMany({
      where: {
        resume: {
          userId: req.user.id
        }
      },
      include: {
        resume: true,
        jobProfile: true,
        verificationLogs: true,
        improvedResumes: {
          orderBy: {
            createdAt: "desc"
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({ analyses });
  })
);

module.exports = router;

