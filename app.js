const express = require("express");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const say = require("say");
const bodyParser = require("body-parser");
const moment = require("moment");

// Configuración de la aplicación
const app = express();
const PORT = process.env.PORT || 3000;
const PHOTOS_DIR = path.join(__dirname, "photos");

process.on("uncaughtException", (error) => {
  console.error("Error no manejado:", error);
});

// Asegúrate de que exista el directorio de fotos
if (!fs.existsSync(PHOTOS_DIR)) {
  fs.mkdirSync(PHOTOS_DIR);
}

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/photos", express.static(PHOTOS_DIR));

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Endpoint para obtener todas las fotos
app.get("/api/photos", (req, res) => {
  fs.readdir(PHOTOS_DIR, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Error al leer las fotos" });
    }

    // Filtra solo archivos de imagen
    const photos = files
      .filter((file) => file.endsWith(".jpg"))
      .map((file) => ({
        filename: file,
        url: `/photos/${file}`,
        timestamp: fs.statSync(path.join(PHOTOS_DIR, file)).mtime,
      }))
      .sort((a, b) => b.timestamp - a.timestamp); // Ordenar por más reciente primero

    res.json(photos);
  });
});

// Y reemplaza la función de captura de foto con esta:
app.post("/api/capture", (req, res) => {
  const timestamp = moment().format("YYYYMMDD-HHmmss");
  const filename = `photo_${timestamp}.jpg`;
  const outputPath = path.join(PHOTOS_DIR, filename);

  try {
    // Comando para reproducir audio
    console.log("Ejecutando comando de audio...");
    exec(
      'espeak "Digan whiskey" -s 130 -a 200',
      (speakError, speakStdout, speakStderr) => {
        if (speakError) {
          console.error("Error al reproducir audio:", speakError);
          console.error("stderr:", speakStderr);
        }

        console.log("Audio reproducido, esperando para tomar foto...");

        // Esperar un poco después del sonido
        setTimeout(() => {
          try {
            // Comando para capturar la foto
            const command = `raspistill -o "${outputPath}" -t 1000 -w 1280 -h 720 -n`;
            console.log("Ejecutando comando:", command);

            exec(command, (error, stdout, stderr) => {
              if (error) {
                console.error(`Error al ejecutar raspistill:`, error);
                console.error("stderr:", stderr);
                return res.status(500).json({
                  error: "Error al tomar la foto",
                  details: error.message,
                });
              }

              console.log(`Foto guardada en: ${outputPath}`);
              res.json({
                success: true,
                filename: filename,
                url: `/photos/${filename}`,
              });
            });
          } catch (execError) {
            console.error(
              "Error al ejecutar el comando de la cámara:",
              execError
            );
            res.status(500).json({
              error: "Error interno al tomar la foto",
              details: execError.message,
            });
          }
        }, 1500);
      }
    );
  } catch (outerError) {
    console.error("Error general en el endpoint de captura:", outerError);
    res.status(500).json({
      error: "Error interno del servidor",
      details: outerError.message,
    });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor en funcionamiento en http://localhost:${PORT}`);
});
