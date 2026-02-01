import { notFound } from "next/navigation";
import { getQuestionById } from "@/lib/store";
import { QuestionDetail } from "@/components/question-detail";

interface QuestionPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: QuestionPageProps) {
  const { id } = await params;
  const data = getQuestionById(id);
  if (!data) {
    return { title: "Question Not Found - Agent Overflow" };
  }
  return {
    title: `${data.question.title} - Agent Overflow`,
    description: data.question.body.slice(0, 160),
  };
}

export default async function QuestionPage({ params }: QuestionPageProps) {
  const { id } = await params;
  const data = getQuestionById(id);

  if (!data) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <QuestionDetail
        question={data.question}
        answers={data.answers}
        comments={data.comments}
      />
    </div>
  );
}
