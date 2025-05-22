const authMiddleware = require("../middlewares/authMiddleware");
const Exam = require("../models/examModel");
const Report = require("../models/reportModel");
const router = require("express").Router();

// Add report with scoring logic
router.post("/add-report", authMiddleware, async (req, res) => {
  try {
    const { exam, user, answers } = req.body;

    // Fetch exam data with populated questions (to access correctOption)
    const examData = await Exam.findById(exam).populate("questions");

    if (!examData) {
      return res.status(404).send({
        message: "Exam not found",
        success: false,
      });
    }

    const correctAnswers = [];
    const wrongAnswers = [];

    examData.questions.forEach((question) => {
      // Find user's answer to this question
      const userAnswer = answers.find(
        (a) => a.question === question._id.toString()
      );

      if (userAnswer) {
        // Normalize both answers to lowercase trimmed strings
        const userSelected = String(userAnswer.selectedOption).trim().toLowerCase();
        const correctAnswer = String(question.correctOption).trim().toLowerCase();

        if (userSelected === correctAnswer) {
          correctAnswers.push({
            question: question._id,
            selectedOption: userAnswer.selectedOption,
          });
        } else {
          wrongAnswers.push({
            question: question._id,
            selectedOption: userAnswer.selectedOption,
          });
        }
      }
    });

    // Calculate score percentage
    const totalQuestions = examData.questions.length;
    const passingMarks = examData.passingMarks || 50;
    const percentage = (correctAnswers.length / totalQuestions) * 100;
    const verdict = percentage >= passingMarks ? "Pass" : "Fail";

    // Create and save the report
    const newReport = new Report({
      exam,
      user,
      result: {
        correctAnswers,
        wrongAnswers,
        verdict,
        score: correctAnswers.length,
        totalQuestions,
        percentage,
      },
    });

    await newReport.save();

    res.send({
      message: "Report added and evaluated successfully",
      success: true,
      data: newReport,
    });
  } catch (error) {
    console.error("Error in /add-report:", error);
    res.status(500).send({
      message: error.message,
      success: false,
    });
  }
});

module.exports = router;
