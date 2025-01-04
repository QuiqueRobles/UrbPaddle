import { serve } from "https://deno.land/std@0.188.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.3.0/mod.ts";

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: "Método no permitido" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { communityName, address, contactName, phoneNumber } = await req.json();

    if (!communityName || !address || !contactName || !phoneNumber) {
      return new Response(
        JSON.stringify({ error: "Faltan datos requeridos" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const username = Deno.env.get("SMTP_USERNAME");
    const password = Deno.env.get("SMTP_PASSWORD");
    const toEmail = Deno.env.get("TO_EMAIL");

    if (!username || !password || !toEmail) {
      throw new Error("Faltan variables de entorno requeridas");
    }

    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: username,
          password: password,
        },
      },
    });

    const currentDate = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    await client.send({
      from: username,
      to: toEmail,
      subject: "🏘️ Nueva Solicitud de Registro de Comunidad",
      content: "text/html",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <!-- Encabezado -->
            <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0;">
              <h1 style="color: #2c5282; margin: 0; font-size: 24px;">Nueva Solicitud de Registro</h1>
              <p style="color: #718096; margin: 10px 0 0 0;">Recibida el ${currentDate}</p>
            </div>

            <!-- Contenido Principal -->
            <div style="padding: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <strong style="color: #4a5568;">Nombre de la Comunidad:</strong>
                    <div style="margin-top: 4px; color: #2d3748;">${communityName}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <strong style="color: #4a5568;">Dirección:</strong>
                    <div style="margin-top: 4px; color: #2d3748;">${address}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <strong style="color: #4a5568;">Nombre de Contacto:</strong>
                    <div style="margin-top: 4px; color: #2d3748;">${contactName}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <strong style="color: #4a5568;">Número de Teléfono:</strong>
                    <div style="margin-top: 4px; color: #2d3748;">${phoneNumber}</div>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Pie de página -->
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #f0f0f0; text-align: center;">
              <p style="color: #718096; font-size: 14px;">
                Este es un email automático generado por el sistema de registro de UrbPaddle.
              </p>
              <div style="margin-top: 10px;">
                <span style="display: inline-block; padding: 8px 16px; background-color: #2c5282; color: white; border-radius: 4px; text-decoration: none; font-size: 14px;">
                  Solicitud #${Math.random().toString(36).substr(2, 6).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    await client.close();

    return new Response(
      JSON.stringify({ message: "Correo enviado con éxito" }),
      { headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error al enviar el correo:", error);
    return new Response(
      JSON.stringify({ 
        error: "Error al enviar el correo", 
        details: error.message 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});