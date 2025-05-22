import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { message } from "antd";
import { getExamById } from "../../../apicalls/exams";
import { addReport } from "../../../apicalls/reports";
import { ShowLoading, HideLoading } from "../../../redux/loaderSlice";
import Instructions from "./Instructions";
import Compiler from "./compiler";
import "./nocopy.css";

function WriteExam() {
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [result, setResult] = useState(null);
  const [view, setView] = useState("instructions");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timeUp, setTimeUp] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);

  // Fetch Exam
  const fetchExam = async () => {
    try {
      dispatch(ShowLoading());
      const res = await getExamById({ examId: id });
      dispatch(HideLoading());

      if (res.success) {
        const shuffled = shuffleArray(res.data.questions);
        setQuestions(shuffled);
        setExamData(res.data);
        setSecondsLeft(res.data.duration); // assuming duration in seconds
      } else {
        message.error(res.message);
      }
    } catch (err) {
      dispatch(HideLoading());
      message.error(err.message);
    }
  };

  const shuffleArray = (arr) => {
    return [...arr].sort(() => Math.random() - 0.5);
  };

  // Start Timer
  useEffect(() => {
    if (view === "questions" && secondsLeft > 0) {
      const timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setTimeUp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [view]);

  // Handle Time Up
  useEffect(() => {
    if (timeUp) {
      examData?.examType === "quiz"
        ? handleQuizSubmission()
        : handleCodingSubmission([]);
    }
  }, [timeUp]);

  // Submit Quiz
  const handleQuizSubmission = async () => {
    const correctAnswers = questions.filter(
      (q, i) => q.correctOption === selectedOptions[i]
    );
    const wrongAnswers = questions.filter(
      (q, i) => q.correctOption !== selectedOptions[i]
    );

    const totalMarks = correctAnswers.reduce((sum, q) => sum + q.marks, 0);
    const verdict = totalMarks >= examData.passingMarks ? "Pass" : "Fail";

    const finalResult = {
      correctAnswers,
      wrongAnswers,
      totalMarks,
      verdict,
    };

    await saveResult(finalResult);
  };

  // Submit Coding
  const handleCodingSubmission = async (results = []) => {
    const passed = results.every((res) => res === true);
    const totalMarks = passed
      ? questions.reduce((sum, q) => sum + q.marks, 0)
      : 0;

    const finalResult = {
      correctAnswers: passed ? 1 : 0,
      wrongAnswers: passed ? [] : questions,
      totalMarks,
      verdict: passed ? "Pass" : "Fail",
    };

    await saveResult(finalResult);
  };

  const saveResult = async (finalResult) => {
    setResult(finalResult);
    try {
      dispatch(ShowLoading());
      const res = await addReport({
        exam: id,
        user: user._id,
        result: finalResult,
      });
      dispatch(HideLoading());
      if (res.success) setView("result");
      else message.error(res.message);
    } catch (err) {
      dispatch(HideLoading());
      message.error(err.message);
    }
  };

  useEffect(() => {
    if (id) fetchExam();
  }, [id]);

  return (
    examData && (
      <div className="mt-2 no-copy">
        <div className="divider"></div>
        <h1 className="text-center">{examData.name}</h1>
        <div className="divider"></div>

        {view === "instructions" && (
          <Instructions examData={examData} setView={setView} startTimer={() => setView("questions")} />
        )}

        {view === "questions" && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl">
                {selectedQuestionIndex + 1}.{" "}
                {questions[selectedQuestionIndex]?.name}
              </h2>
              <div className="text-lg font-bold text-red-500">{secondsLeft}s</div>
            </div>

            {examData.examType === "quiz" ? (
              <div className="flex flex-col gap-2">
                {Object.entries(
                  questions[selectedQuestionIndex].options
                ).map(([key, value]) => (
                  <div
                    key={key}
                    className={`option ${
                      selectedOptions[selectedQuestionIndex] === key
                        ? "selected-option"
                        : ""
                    }`}
                    onClick={() =>
                      setSelectedOptions((prev) => ({
                        ...prev,
                        [selectedQuestionIndex]: key,
                      }))
                    }
                  >
                    {key}: {value}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  {questions[selectedQuestionIndex].testCases.map(
                    (testCase, index) => (
                      <div key={index} className="p-2 border rounded">
                        <p><strong>Input:</strong> {testCase.input}</p>
                        <p><strong>Expected:</strong> {testCase.expectedOutput}</p>
                      </div>
                    )
                  )}
                </div>
                <Compiler
                  testCases={questions[selectedQuestionIndex].testCases}
                  onResult={(results) => handleCodingSubmission(results)}
                />
              </>
            )}

            <div className="flex justify-between mt-4">
              {selectedQuestionIndex > 0 && (
                <button
                  onClick={() =>
                    setSelectedQuestionIndex((prev) => prev - 1)
                  }
                >
                  Previous
                </button>
              )}
              {selectedQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={() =>
                    setSelectedQuestionIndex((prev) => prev + 1)
                  }
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => {
                    examData.examType === "quiz"
                      ? handleQuizSubmission()
                      : handleCodingSubmission([]);
                  }}
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        )}

        {view === "result" && result && (
          <div className="text-center">
            <h2 className="text-2xl mb-4">Result</h2>
            {examData.examType === "quiz" ? (
              <>
                <p>Total Questions: {questions.length}</p>
                <p>Correct: {result.correctAnswers.length}</p>
                <p>Wrong: {result.wrongAnswers.length}</p>
              </>
            ) : (
              <>
                <p>Total Test Cases: {questions.length}</p>
                <p>Passed: {result.correctAnswers}</p>
              </>
            )}
            <p>Total Marks: {result.totalMarks}</p>
            <p>Verdict: <strong>{result.verdict}</strong></p>

            <button onClick={() => navigate("/")}>Go to Home</button>
          </div>
        )}
      </div>
    )
  );
}

export default WriteExam;
