import { notFound } from "next/navigation";
import { getCourseByCode } from "@/lib/data/courses";
import { CheckoutHeader } from "@/components/checkout/CheckoutHeader";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const course = await getCourseByCode(code);

  if (!course) notFound();

  return (
    <>
      <CheckoutHeader />
      <CheckoutClient course={course} />
    </>
  );
}
