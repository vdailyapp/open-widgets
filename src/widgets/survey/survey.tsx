import React, { useState, useCallback } from 'react';
import {
  PlusCircle,
  Trash2,
  Move,
  CheckCircle,
  Text,
  ListChecks,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Enum for question types
const QuestionType = {
  SINGLE_SELECT: 'single-select',
  MULTI_SELECT: 'multi-select',
  TEXT: 'text',
};

const ConfigurableSurveyWidget = () => {
  const [questions, setQuestions] = useState([
    {
      id: 'q1',
      text: '',
      type: QuestionType.SINGLE_SELECT,
      options: [''],
      required: false,
    },
  ]);

  const [surveyMode, setSurveyMode] = useState(false);
  const [surveyResponses, setSurveyResponses] = useState({});

  // Add a new question
  const addQuestion = () => {
    const newQuestion = {
      id: `q${questions.length + 1}`,
      text: '',
      type: QuestionType.SINGLE_SELECT,
      options: [''],
      required: false,
    };
    setQuestions([...questions, newQuestion]);
  };

  // Update question details
  const updateQuestion = (id, updates) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  // Remove a question
  const removeQuestion = (id) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  // Handle drag and drop reordering
  const onDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedQuestions = Array.from(questions);
    const [reorderedItem] = reorderedQuestions.splice(result.source.index, 1);
    reorderedQuestions.splice(result.destination.index, 0, reorderedItem);

    setQuestions(reorderedQuestions);
  };

  // Render question type selector
  const renderQuestionTypeSelector = (question) => (
    <div className="mb-2 flex space-x-2">
      {Object.values(QuestionType).map((type) => (
        <button
          key={type}
          onClick={() => updateQuestion(question.id, { type })}
          className={`flex items-center rounded p-2 ${
            question.type === type ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          {type === QuestionType.SINGLE_SELECT && <CheckCircle className="mr-2" />}
          {type === QuestionType.MULTI_SELECT && <ListChecks className="mr-2" />}
          {type === QuestionType.TEXT && <Text className="mr-2" />}
          {type}
        </button>
      ))}
    </div>
  );

  // Render option inputs for select questions
  const renderQuestionOptions = (question) => {
    if (question.type === QuestionType.TEXT) return null;

    return (
      <div>
        {question.options.map((option, index) => (
          <div key={index} className="mb-2 flex items-center">
            <input
              type="text"
              value={option}
              onChange={(e) => {
                const newOptions = [...question.options];
                newOptions[index] = e.target.value;
                updateQuestion(question.id, { options: newOptions });
              }}
              placeholder="Enter option"
              className="mr-2 flex-grow rounded border p-2"
            />
            <button
              onClick={() => {
                const newOptions = question.options.filter((_, i) => i !== index);
                updateQuestion(question.id, { options: newOptions });
              }}
              className="text-red-500"
            >
              <Trash2 />
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const newOptions = [...question.options, ''];
            updateQuestion(question.id, { options: newOptions });
          }}
          className="flex items-center rounded p-2 text-green-500 hover:bg-green-50"
        >
          <PlusCircle className="mr-2" /> Add Option
        </button>
      </div>
    );
  };

  // Configuration UI
  const renderConfigurationUI = () => (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="questions">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4 p-4">
            {questions.map((question, index) => (
              <Draggable key={question.id} draggableId={question.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="rounded-lg bg-white p-4 shadow"
                  >
                    <div
                      {...provided.dragHandleProps}
                      className="mb-2 flex cursor-move items-center"
                    >
                      <Move className="mr-2 text-gray-500" />
                      <span>Drag to Reorder</span>
                    </div>
                    <input
                      type="text"
                      value={question.text}
                      onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                      placeholder="Enter question text"
                      className="mb-2 w-full rounded border p-2"
                    />
                    {renderQuestionTypeSelector(question)}
                    {renderQuestionOptions(question)}
                    <div className="mt-2 flex items-center">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) =>
                          updateQuestion(question.id, { required: e.target.checked })
                        }
                        className="mr-2"
                      />
                      <label>Required Question</label>
                      <button
                        onClick={() => removeQuestion(question.id)}
                        className="ml-auto rounded p-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <div className="flex space-x-4 p-4">
        <button
          onClick={addQuestion}
          className="flex items-center rounded bg-green-500 p-2 text-white hover:bg-green-600"
        >
          <PlusCircle className="mr-2" /> Add Question
        </button>
        <button
          onClick={() => setSurveyMode(true)}
          className="rounded bg-blue-500 p-2 text-white hover:bg-blue-600"
        >
          Start Survey
        </button>
      </div>
    </DragDropContext>
  );

  // Render survey mode
  const renderSurveyMode = () => {
    const handleResponseChange = (questionId, response) => {
      setSurveyResponses((prev) => ({
        ...prev,
        [questionId]: response,
      }));
    };

    return (
      <div className="space-y-6 p-6">
        {questions.map((question) => (
          <div key={question.id} className="rounded-lg bg-white p-4 shadow">
            <h3 className="mb-3 text-lg font-semibold">{question.text}</h3>

            {question.type === QuestionType.SINGLE_SELECT && (
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={surveyResponses[question.id] === option}
                      onChange={() => handleResponseChange(question.id, option)}
                      className="mr-2"
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}

            {question.type === QuestionType.MULTI_SELECT && (
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      value={option}
                      checked={(surveyResponses[question.id] || []).includes(option)}
                      onChange={(e) => {
                        const currentResponses = surveyResponses[question.id] || [];
                        const newResponses = e.target.checked
                          ? [...currentResponses, option]
                          : currentResponses.filter((r) => r !== option);
                        handleResponseChange(question.id, newResponses);
                      }}
                      className="mr-2"
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}

            {question.type === QuestionType.TEXT && (
              <textarea
                value={surveyResponses[question.id] || ''}
                onChange={(e) => handleResponseChange(question.id, e.target.value)}
                className="w-full rounded border p-2"
                placeholder="Enter your response"
              />
            )}
          </div>
        ))}
        <button
          onClick={() => {
            console.log('Survey Responses:', surveyResponses);
            setSurveyMode(false);
          }}
          className="w-full rounded bg-blue-500 p-2 text-white hover:bg-blue-600"
        >
          Submit Survey
        </button>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="p-6">
          <h2 className="mb-4 text-center text-2xl font-bold">
            {surveyMode ? 'Survey' : 'Survey Configuration'}
          </h2>
          {surveyMode ? renderSurveyMode() : renderConfigurationUI()}
        </div>
      </div>
    </div>
  );
};

export default ConfigurableSurveyWidget;
