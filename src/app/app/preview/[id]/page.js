import PreviewView from "@/components/PreviewView";

export default function PreviewPage({ params, searchParams }) {
  return <PreviewView reviewId={params.id} initialMode={searchParams?.mode || "Strict"} />;
}
