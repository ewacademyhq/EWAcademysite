import { notFound } from "next/navigation";
import { COURSES0 } from "@/lib/fixtures";
import { CheckoutHeader } from "@/components/checkout/CheckoutHeader";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const course = COURSES0.find((c) => c.code === code.toUpperCase());

  if (!course) notFound();

  return (
    <>
      <CheckoutHeader />
      <CheckoutClient course={course} />
    </>
  );
}
