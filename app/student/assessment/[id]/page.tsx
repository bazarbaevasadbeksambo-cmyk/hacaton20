import type { Metadata } from "next";
import { Suspense } from "react";
import { AssessmentRunner } from "./assessment-runner";

export const metadata: Metadata = { title: "Nazorat ishi · Daftar" };

export default function AssessmentPage({ params }: PageProps<"/student/assessment/[id]">) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-[12px] bg-grid/40" aria-hidden />}>
      <AssessmentFromParams params={params} />
    </Suspense>
  );
}

async function AssessmentFromParams({ params }: Pick<PageProps<"/student/assessment/[id]">, "params">) {
  const { id } = await params;
  return <AssessmentRunner id={id} />;
}
