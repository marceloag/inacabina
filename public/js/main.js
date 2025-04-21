document.addEventListener("DOMContentLoaded", function () {
  // Elementos del DOM
  const captureBtn = document.getElementById("capture-btn");
  const previewImage = document.getElementById("preview-image");
  const photosContainer = document.getElementById("photos-container");
  const countdownOverlay = document.getElementById("countdown");
  const countdownNumber = document.getElementById("countdown-number");
  const flashOverlay = document.getElementById("flash");

  // Cargar fotos existentes al iniciar
  loadPhotos();

  // Evento para capturar una foto
  captureBtn.addEventListener("click", capturePhoto);

  // Función para comenzar la cuenta regresiva y tomar una foto
  function capturePhoto() {
    // Deshabilitar el botón durante el proceso
    captureBtn.disabled = true;
    captureBtn.style.opacity = "0.5";

    // Mostrar cuenta regresiva
    startCountdown(3, () => {
      // Mostrar efecto de flash
      flashEffect(() => {
        // Hacer la petición al servidor para tomar la foto
        fetch("/api/capture", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              // Actualizar la imagen de previsualización con la nueva foto
              previewImage.src = data.url + "?t=" + new Date().getTime(); // Evitar caché

              // Recargar la galería de fotos
              loadPhotos();

              // Notificar al usuario
              showNotification("¡Foto tomada con éxito!", "success");
            } else {
              showNotification("Error al tomar la foto", "error");
            }
          })
          .catch((error) => {
            console.error("Error:", error);
            showNotification("Error de conexión", "error");
          })
          .finally(() => {
            // Re-habilitar el botón
            captureBtn.disabled = false;
            captureBtn.style.opacity = "1";
          });
      });
    });
  }

  // Función para iniciar la cuenta regresiva
  function startCountdown(seconds, callback) {
    countdownOverlay.classList.add("active");
    let remainingSeconds = seconds;

    countdownNumber.textContent = remainingSeconds;

    const countdownInterval = setInterval(() => {
      remainingSeconds--;

      if (remainingSeconds <= 0) {
        clearInterval(countdownInterval);
        countdownOverlay.classList.remove("active");
        callback();
      } else {
        countdownNumber.textContent = remainingSeconds;
      }
    }, 1000);
  }

  // Función para el efecto de flash
  function flashEffect(callback) {
    flashOverlay.classList.add("active");

    setTimeout(() => {
      flashOverlay.classList.remove("active");
      callback();
    }, 200);
  }

  // Función para cargar las fotos desde el servidor
  function loadPhotos() {
    photosContainer.innerHTML = '<div class="loading">Cargando fotos...</div>';

    fetch("/api/photos")
      .then((response) => response.json())
      .then((photos) => {
        if (photos.length === 0) {
          photosContainer.innerHTML =
            '<div class="loading">No hay fotos todavía</div>';
          return;
        }

        photosContainer.innerHTML = "";

        // Mostrar las fotos en la galería
        photos.forEach((photo, index) => {
          const photoElement = document.createElement("div");
          photoElement.className = "photo-item fade-in";
          photoElement.style.animationDelay = `${index * 0.1}s`;

          const img = document.createElement("img");
          img.src = photo.url;
          img.alt = "Foto";
          img.loading = "lazy";

          photoElement.appendChild(img);
          photosContainer.appendChild(photoElement);

          // Evento para ver la foto en grande al hacer clic
          photoElement.addEventListener("click", () => {
            previewImage.src = photo.url;
          });
        });
      })
      .catch((error) => {
        console.error("Error al cargar las fotos:", error);
        photosContainer.innerHTML =
          '<div class="loading">Error al cargar las fotos</div>';
      });
  }

  // Función para mostrar notificaciones
  function showNotification(message, type) {
    // Crear el elemento de notificación
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Añadir al DOM
    document.body.appendChild(notification);

    // Mostrar con animación
    setTimeout(() => {
      notification.style.transform = "translateX(0)";
      notification.style.opacity = "1";
    }, 10);

    // Eliminar después de un tiempo
    setTimeout(() => {
      notification.style.transform = "translateX(100%)";
      notification.style.opacity = "0";

      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  // Añadir estilos de notificación dinámicamente
  const styleElement = document.createElement("style");
  styleElement.textContent = `
    .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-weight: bold;
      z-index: 1000;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      transform: translateX(100%);
      opacity: 0;
      transition: transform 0.3s ease, opacity 0.3s ease;
    }
    
    .notification.success {
      background-color: #4caf50;
    }
    
    .notification.error {
      background-color: #f44336;
    }
    
    .notification.info {
      background-color: #2196f3;
    }
  `;
  document.head.appendChild(styleElement);
});
