import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { BrandStrip } from "@/components/landing/BrandStrip";
import { Catalogo } from "@/components/landing/Catalogo";
import { Modalidad } from "@/components/landing/Modalidad";
import { Pagos } from "@/components/landing/Pagos";
import { ClosingPoster } from "@/components/landing/ClosingPoster";
import { Footer } from "@/components/landing/Footer";
import { getCourses } from "@/lib/data/courses";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const [courses, user] = await Promise.all([getCourses(), getCurrentUser()]);

  return (
    <>
      <Header user={user} />
      <main>
        <Hero />
        <BrandStrip />
        <Catalogo courses={courses} />
        <Modalidad />
        <Pagos />
        <ClosingPoster />
      </main>
      <Footer />
    </>
  );
}
