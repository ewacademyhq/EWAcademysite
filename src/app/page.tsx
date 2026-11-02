import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { BrandStrip } from "@/components/landing/BrandStrip";
import { Catalogo } from "@/components/landing/Catalogo";
import { Modalidad } from "@/components/landing/Modalidad";
import { Pagos } from "@/components/landing/Pagos";
import { ClosingPoster } from "@/components/landing/ClosingPoster";
import { Footer } from "@/components/landing/Footer";
import { getCourses, getVerticales } from "@/lib/data/courses";
import { getCurrentUser } from "@/lib/auth";
import { dmyToISO, mesAnioLabel, todayISO } from "@/lib/date";

export default async function Home() {
  const [courses, verticales, user] = await Promise.all([
    getCourses(),
    getVerticales(),
    getCurrentUser(),
  ]);

  // Próxima cohorte a arrancar, calculada de los cursos reales — así el
  // badge del hero nunca queda con un mes viejo (ver Hero.tsx).
  const proximoInicioIso = courses
    .filter((c) => c.modalidad === "cohorte")
    .map((c) => dmyToISO(c.fecha))
    .filter((iso): iso is string => iso !== null && iso >= todayISO())
    .sort()[0];
  const proximoInicioLabel = proximoInicioIso ? mesAnioLabel(proximoInicioIso) : null;

  return (
    <>
      <Header user={user} />
      <main>
        <Hero verticales={verticales} proximoInicioLabel={proximoInicioLabel} />
        <BrandStrip />
        <Catalogo courses={courses} verticales={verticales} />
        <Modalidad />
        <Pagos />
        <ClosingPoster />
      </main>
      <Footer />
    </>
  );
}
