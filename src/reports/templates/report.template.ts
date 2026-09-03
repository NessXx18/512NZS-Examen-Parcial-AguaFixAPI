import { CreateReportDto } from '../dto/create-report.dto';

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

export function generateReportTemplate(dto: CreateReportDto): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Nueva fuga reportada</title></head>
<body style="margin:0;background:#f3f6f8;font-family:Arial,sans-serif;color:#18344a">
  <main style="max-width:620px;margin:24px auto;background:#fff;border:1px solid #d9e3e8;border-radius:8px;overflow:hidden">
    <header style="padding:20px 24px;background:#0077b6;color:#fff"><h1 style="margin:0;font-size:22px">Nueva fuga de agua reportada</h1></header>
    <section style="padding:24px"><p style="margin-top:0">Se ha registrado un nuevo reporte ciudadano.</p>
      <table style="width:100%;border-collapse:collapse;font-size:15px">
        <tr><th style="text-align:left;padding:10px;background:#eaf5fb;border:1px solid #d9e3e8">Dirección</th><td style="padding:10px;border:1px solid #d9e3e8">${escapeHtml(dto.address)}</td></tr>
        <tr><th style="text-align:left;padding:10px;background:#eaf5fb;border:1px solid #d9e3e8">Descripción</th><td style="padding:10px;border:1px solid #d9e3e8">${escapeHtml(dto.description)}</td></tr>
        <tr><th style="text-align:left;padding:10px;background:#eaf5fb;border:1px solid #d9e3e8">Severidad</th><td style="padding:10px;border:1px solid #d9e3e8">${escapeHtml(dto.severity)}</td></tr>
        <tr><th style="text-align:left;padding:10px;background:#eaf5fb;border:1px solid #d9e3e8">Teléfono de contacto</th><td style="padding:10px;border:1px solid #d9e3e8">${escapeHtml(dto.reporterPhone)}</td></tr>
      </table>
    </section>
  </main>
</body></html>`;
}
