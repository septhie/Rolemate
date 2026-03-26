import ResultsDisplay from "@/components/ResultsDisplay";

export default function ResultsPage({ params, searchParams }) {
  return <ResultsDisplay reviewId={params.id} signupPrompt={searchParams?.signupPrompt === "1"} />;
}
