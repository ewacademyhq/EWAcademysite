import { Document, Page, View, Text, Image, Font, StyleSheet } from "@react-pdf/renderer";

Font.register({
  family: "Great Vibes",
  src: "https://fonts.gstatic.com/s/greatvibes/v18/RWmMoKWR9v4ksMfaWd_JN-XCg6UKDXlq.ttf",
});

const ACCENT = "#FF6A1A";
const INK = "#14161A";
const DIM = "#6B6F76";
const PAPER = "#F4F1EA";
const LINE = "#D8D3C6";

const styles = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    padding: 48,
    fontFamily: "Helvetica",
    color: INK,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontSize: 20, fontWeight: 700, letterSpacing: 1 },
  brandAccent: { color: ACCENT },
  tagline: { fontSize: 9, letterSpacing: 2, color: DIM },
  title: { marginTop: 28, fontSize: 34, fontWeight: 700, letterSpacing: 1 },
  titleRule: { marginTop: 10, width: 90, height: 3, backgroundColor: ACCENT },
  lead: { marginTop: 26, fontSize: 12, color: DIM },
  nombre: { marginTop: 8, fontSize: 40, fontFamily: "Great Vibes", color: INK },
  nombreRule: { marginTop: 6, height: 1, backgroundColor: LINE },
  lead2: { marginTop: 22, fontSize: 12, color: DIM },
  curso: { marginTop: 6, fontSize: 20, fontWeight: 700, color: ACCENT },
  sub: { marginTop: 6, fontSize: 10.5, color: DIM },
  infoBox: {
    marginTop: 26,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: LINE,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: { flexDirection: "column" },
  infoLabel: { fontSize: 8.5, color: DIM },
  infoValue: { marginTop: 3, fontSize: 11, fontWeight: 700 },
  footerRow: { marginTop: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  signatureBlock: { width: 190 },
  signatureName: { fontSize: 22, fontFamily: "Great Vibes" },
  signatureRule: { marginTop: 2, height: 1, backgroundColor: INK },
  signatureLabel: { marginTop: 4, fontSize: 9, fontWeight: 700 },
  signatureSub: { fontSize: 8, color: DIM },
  qrBlock: { alignItems: "center" },
  qrImage: { width: 72, height: 72 },
  qrLabel: { marginTop: 4, fontSize: 7, color: DIM, width: 100, textAlign: "center" },
});

export function CertificadoPdf({
  alumnoNombre,
  cursoTitulo,
  duracion,
  area,
  fechaLabel,
  qrDataUrl,
  codigo,
}: {
  alumnoNombre: string;
  cursoTitulo: string;
  duracion: string;
  area: string;
  fechaLabel: string;
  qrDataUrl: string;
  codigo: string;
}) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.headerRow}>
          <Text style={styles.brand}>
            E<Text style={styles.brandAccent}>W</Text> ACADEMIA
          </Text>
          <Text style={styles.tagline}>TECNOLOGÍA CON PROPÓSITO</Text>
        </View>

        <Text style={styles.title}>CERTIFICADO DE FINALIZACIÓN</Text>
        <View style={styles.titleRule} />

        <Text style={styles.lead}>EW Academia otorga el presente certificado a</Text>
        <Text style={styles.nombre}>{alumnoNombre}</Text>
        <View style={styles.nombreRule} />

        <Text style={styles.lead2}>Por haber completado satisfactoriamente el curso de</Text>
        <Text style={styles.curso}>{cursoTitulo.toUpperCase()}</Text>

        <View style={styles.infoBox}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>DURACIÓN</Text>
            <Text style={styles.infoValue}>{duracion}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>FECHA DE FINALIZACIÓN</Text>
            <Text style={styles.infoValue}>{fechaLabel}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>MODALIDAD</Text>
            <Text style={styles.infoValue}>Online</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>ÁREA</Text>
            <Text style={styles.infoValue}>{area}</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureName}>Matías Miró</Text>
            <View style={styles.signatureRule} />
            <Text style={styles.signatureLabel}>Matías Miró</Text>
            <Text style={styles.signatureSub}>Director Académico — EW Academia</Text>
          </View>

          <View style={styles.signatureBlock}>
            <Text style={styles.signatureName}>Equipo EW Academia</Text>
            <View style={styles.signatureRule} />
            <Text style={styles.signatureLabel}>Equipo EW Academia</Text>
            <Text style={styles.signatureSub}>Coordinación Académica</Text>
          </View>

          <View style={styles.qrBlock}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image style={styles.qrImage} src={qrDataUrl} />
            <Text style={styles.qrLabel}>Verificá la autenticidad — código {codigo}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
