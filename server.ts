import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '20mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Vales Bonpreu Esclat API' });
});

// Scan Bonpreu Esclat Coupon with Gemini 3.8 Flash
app.post('/api/scan-coupon', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'No se ha proporcionado imagen del vale' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY no configurada. Puedes ingresar los datos del vale manualmente en el formulario.'
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        },
        `Analiza este vale de descuento o tique de compra de los supermercados Bonpreu o Esclat (Cataluña).
Extrae la información estructurada con la máxima precisión para guardarlo en la app de gestión de vales:
- title: Título conciso del descuento (ej: "5€ de descompte en compra superior a 50€", "6€ a Carnisseria i Xarcuteria", "-20% en Peixateria fresca", "10% de descompte total", "Bonpreu EsclatOil 5cts/litre").
- discountType: "fixed" para importes directos en euros (ej 5€, 6€), "percentage" para porcentajes (ej 15%, 20%), o "promo" para promociones especiales (ej 2x1, 2a unitat al 70%, carburante).
- discountAmount: Número principal (ej: 5 si son 5€, 20 si es 20%, 0 si es texto libre).
- minPurchase: Gasto mínimo requerido en euros si existe (ej. 50 para "compra mínima 50€"). Si no hay compra mínima, pon 0.
- section: Elige la sección del supermercado más adecuada entre: "general", "carnisseria", "peixateria", "fruita", "formatgeria", "fleca", "celler", "drogueria", "esclatoil", "altres".
- expiryDate: Fecha límite de caducidad en formato YYYY-MM-DD. Si solo ves día y mes (ej. "Caduca el 24/11" o "fins al 15 de novembre"), calcula el año más coherente (2024-2026).
- validFrom: Fecha de inicio de validez si viene indicada en formato YYYY-MM-DD, o cadena vacía "".
- barcode: Código numérico del vale para generar el código de barras en caja (suele ser una serie de 8 a 16 dígitos que acompaña al código de barras o código EAN impreso). Si no es legible, pon cadena vacía "".
- notes: Condiciones especiales o letra pequeña relevante (ej. "Presentar amb la targeta client Bonpreu", "Exclou secció basar").`
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            discountType: { type: Type.STRING, enum: ['fixed', 'percentage', 'promo'] },
            discountAmount: { type: Type.NUMBER },
            minPurchase: { type: Type.NUMBER },
            section: {
              type: Type.STRING,
              enum: ['general', 'carnisseria', 'peixateria', 'fruita', 'formatgeria', 'fleca', 'celler', 'drogueria', 'esclatoil', 'altres']
            },
            expiryDate: { type: Type.STRING },
            validFrom: { type: Type.STRING },
            barcode: { type: Type.STRING },
            notes: { type: Type.STRING },
          },
          required: ['title', 'discountType', 'discountAmount', 'section', 'expiryDate'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, coupon: parsed });
  } catch (error: any) {
    console.error('Error analizando vale con Gemini:', error);
    return res.status(500).json({
      error: error.message || 'No se pudo leer la imagen del vale con claridad. Puedes añadirlo manualmente.'
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
