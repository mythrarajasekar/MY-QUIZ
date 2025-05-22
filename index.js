import { message } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllExams } from "../../../apicalls/exams";
import { getAllReports } from "../../../apicalls/reports";
import { HideLoading, ShowLoading } from "../../../redux/loaderSlice";
import { useNavigate } from "react-router-dom";
import "./home.css";

function Home() {
  const [exams, setExams] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user && user._id) {
          dispatch(ShowLoading());
          const examsResponse = await getAllExams();
          const reportsResponse = await getAllReports();

          if (examsResponse.success) {
            setExams(examsResponse.data);
          } else {
            message.error(examsResponse.message);
          }

          if (reportsResponse.success) {
            const userReports = reportsResponse.data.filter(
              (report) => report.user._id === user._id
            );
            setUserReports(userReports);
          } else {
            message.error(reportsResponse.message);
          }

          dispatch(HideLoading());
        }
      } catch (error) {
        dispatch(HideLoading());
        message.error(error.message);
      }
    };

    fetchData();
  }, [dispatch, user]);

  const hasUserTakenExam = (examId) => {
    return userReports.some((report) => report.exam._id === examId);
  };

  return (
    <div className="home-container">
      <h1 className="home-title">👋 Hey {user?.name}, pick a quiz to begin!</h1>
      <div className="exam-grid">
        {exams.map((exam) => (
          <div className="exam-card" key={exam._id}>
            <h2>{exam.name}</h2>
            <p>🧠 Category: <span>{exam.category}</span></p>
            <p>🎯 Total Marks: <span>{exam.totalMarks}</span></p>
            <p>✅ Passing Marks: <span>{exam.passingMarks}</span></p>
            <p>⏱ Duration: <span>{exam.duration} seconds</span></p>

            {hasUserTakenExam(exam._id) && !user.isAdmin ? (
              <button className="exam-btn disabled" disabled>
                ✅ Already Attempted
              </button>
            ) : (
              <button
                className="exam-btn"
                onClick={() => navigate(`/user/write-exam/${exam._id}`)}
              >
                ▶ Start Quiz
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
