import React, { useState } from 'react';
import { CheckCircle, ChevronRight, ChevronLeft, PieChart } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const QuickSurveyWidget = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [surveyCompleted, setSurveyCompleted] = useState(false);

  const surveyQuestions = [
    {
      question: 'How satisfied are you with our service?',
      options: ['Very Unsatisfied', 'Unsatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'],
    },
    {
      question: 'How likely are you to recommend us?',
      options: ['Not Likely', 'Somewhat Unlikely', 'Neutral', 'Somewhat Likely', 'Very Likely'],
    },
    {
      question: 'How easy was it to use our product?',
      options: ['Very Difficult', 'Difficult', 'Neutral', 'Easy', 'Very Easy'],
    },
  ];

  const handleAnswerSelect = (answer) => {
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestion] = answer;
    setSelectedAnswers(newSelectedAnswers);

    if (currentQuestion < surveyQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setSurveyCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const resetSurvey = () => {
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setSurveyCompleted(false);
  };

  const resultsData = surveyQuestions.map((q, index) => ({
    name: `Question ${index + 1}`,
    value: q.options.indexOf(selectedAnswers[index] || q.options[0]),
  }));

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 hover:scale-105">
        {!surveyCompleted ? (
          <div className="space-y-6 p-6">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-bold text-gray-800">Quick Satisfaction Survey</h2>
              <p className="mb-6 text-gray-600">{surveyQuestions[currentQuestion].question}</p>
            </div>

            <div className="space-y-4">
              {surveyQuestions[currentQuestion].options.map((option, index) => (
                <button
                  key={option}
                  onClick={() => handleAnswerSelect(option)}
                  className="flex w-full items-center justify-between 
                    rounded-lg bg-gradient-to-r from-blue-100 
                    to-purple-100 p-3 
                    text-left text-gray-700 
                    shadow-md transition-all duration-200
                    hover:from-blue-200 hover:to-purple-200
                    hover:text-gray-900 hover:shadow-lg"
                >
                  <span>{option}</span>
                  <CheckCircle className="ml-2 h-5 w-5 text-blue-600" />
                </button>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              {currentQuestion > 0 && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center text-gray-600 transition-colors hover:text-gray-800"
                >
                  <ChevronLeft className="mr-2" /> Previous
                </button>
              )}
              <div className="text-sm text-gray-500">
                Question {currentQuestion + 1} of {surveyQuestions.length}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 p-6 text-center">
            <div className="mb-4 flex justify-center">
              <PieChart className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Survey Completed!</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={resultsData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label
                  >
                    {resultsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <button
                onClick={resetSurvey}
                className="flex w-full items-center 
                  justify-center rounded-lg bg-gradient-to-r 
                  from-green-400 to-blue-500 
                  p-3 font-bold 
                  text-white transition-all 
                  duration-200 hover:from-green-500 hover:to-blue-600"
              >
                Take Survey Again <ChevronRight className="ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickSurveyWidget;
