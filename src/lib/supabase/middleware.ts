import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME, type Rol } from "@/lib/role-home";

function requiredRole(pathname: string): Rol | null {
  if (pathname.startsWith("/panel") || pathname.startsWith("/curso")) return "alumno";
  if (pathname.startsWith("/docente")) return "docente";
  if (pathname.startsWith("/admin")) return "admin";
  return null;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: no sacar esta llamada — es la que refresca el token de sesión
  // guardado en cookies. Sacarla desloguea a cualquiera cuyo access token expiró.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const needsRole = requiredRole(request.nextUrl.pathname);
  if (!needsRole) return supabaseResponse;

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from("users")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  const rol = profile?.rol as Rol | undefined;

  if (rol !== needsRole) {
    const home = (rol && ROLE_HOME[rol]) || "/login";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return supabaseResponse;
}
