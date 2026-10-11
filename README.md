# Señas LSP

Un juego web para aprender y practicar letras estáticas de la Lengua de Señas Peruana (LSP), paso a paso y jugando.

> **Importante:** el juego incluye una primera calibración aproximada de letras estáticas, hecha con la cámara midiendo solo la flexión de los dedos. Aún no se ha validado con una persona señante de LSP ni con una guía oficial. Consulta y confirma cada seña con una persona conocedora y con la guía del [MINEDU](https://repositorio.minedu.gob.pe/handle/20.500.12799/5545) antes de usarla para enseñar.

## Privacidad

La cámara se usa solo en este dispositivo. No grabamos ni enviamos tu video a ningún lado. La detección de manos y el cálculo de las señas ocurren en el navegador; no hay servidor de la aplicación.

Al abrir la página se descargan desde internet el modelo de detección de Google y los archivos WebAssembly de MediaPipe (desde Google Cloud y jsDelivr). Esos archivos son el modelo, no el video de la cámara. Para usar la cámara, permite el acceso cuando el navegador lo pregunte; los navegadores requieren una conexión segura o `localhost`.

## Empezar

Necesitas una versión reciente de Node.js y npm. Desde la carpeta del proyecto:

```sh
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) y permite el uso de la cámara. El juego también puede compilarse para publicarlo como sitio estático:

```sh
npm run build
```

## Calibrar una letra

La calibración está pensada para profes y personas que conocen LSP. Para guardar una seña en este navegador:

1. Consulta una fuente confiable, como la [guía de LSP del MINEDU](https://repositorio.minedu.gob.pe/handle/20.500.12799/5545), y confirma la seña con una persona conocedora.
2. Entra en **Calibración rápida** y permite el acceso a la cámara. También puedes abrir directamente `/#calibrar`.
3. Elige una letra con un botón o presiona su tecla.
4. Cuando aparezca la cuenta atrás 3-2-1, prepara la seña. Mantén la mano quieta durante los 3 segundos de grabación.
5. La letra se guarda sola. La cámara mide únicamente cuánto se doblan los cinco dedos.

Desde esa pantalla también puedes copiar el JSON de todas las letras para compartirlo, importar un archivo JSON o borrar tu versión de una letra. **Borrador** indica que la seña aún no se ha confirmado; no la uses como referencia oficial.

## Combinar calibraciones de varias personas

Cada persona calibra las letras que quiera y pulsa **Descargar JSON** para guardar sus calibraciones en un archivo. Luego comparte ese archivo; la otra persona pulsa **Combinar JSON de otra persona** para sumarlo a sus letras. Al combinar, los rangos se ensanchan para aceptar ambas manos. Si dos letras empiezan a confundirse, vuelve a calibrarlas.

## Letras y niveles

El conjunto inicial trae las 24 letras estáticas A, B, C, D, E, F, G, H, I, K, L, M, N, O, P, Q, R, S, T, U, V, W, X e Y. Se calibraron con la cámara usando únicamente la flexión de los dedos; sus medidas son aproximadas y aún no se validaron con una persona señante de LSP ni con la guía del MINEDU. J y Z se dejan fuera porque requieren movimiento. Los niveles muestran las palabras que se pueden formar con las letras disponibles; una palabra con letras aún no calibradas no se puede jugar.

Las calibraciones y el progreso (estrellas y mejor puntaje por nivel) se guardan en el navegador. No se envían a ningún servicio.

## Cómo funciona el puntaje

La cámara compara varias características de la mano con los rangos de la letra elegida y muestra qué tan parecida es la seña. Para aceptar una letra, el parecido debe ser de al menos 90% y mantenerse durante 2 segundos seguidos. Cada letra acertada da hasta 10 puntos; el tiempo solo baja un poco los puntos y nunca los reduce por debajo de 3. Saltar una letra no da puntos. Al completar una palabra se reciben 3 estrellas si no se saltó ninguna, 2 si se saltó una y 1 si se saltaron varias. No hay cuenta regresiva ni castigo por tardar.

## Publicar gratis en Vercel

1. Entra en [vercel.com](https://vercel.com) y elige **Continue with GitHub**.
2. Selecciona **Add New → Project** e importa el repositorio `senas-lsp`.
3. Vercel detecta Vite automáticamente. Usa `npm run build` como comando de compilación y `dist` como carpeta de salida.
4. Pulsa **Deploy**. Vercel publicará la rama `main`; la dirección HTTPS permite usar la cámara.

## Carpetas principales

- `src/geometry/`: puntos de la mano, normalización y características.
- `src/scoring/`: condiciones de las letras, comparación y estabilidad.
- `src/vision/`: cámara y detección local de manos con MediaPipe.
- `src/letters/`: señas iniciales y almacenamiento/importación local.
- `src/calibration/`: propuestas de rangos a partir de muestras.
- `src/game/`: niveles, palabras y puntajes.
- `src/components/`: piezas compartidas de la interfaz.
- `src/screens/`: inicio, niveles, juego, práctica y calibración.

## Comandos

```sh
npm run dev        # iniciar el servidor local
npm run lint       # revisar estilo y errores comunes
npm run typecheck  # comprobar los tipos de TypeScript
npm test           # ejecutar las pruebas de lógica
npm run build      # comprobar tipos y crear la versión de producción
```

La idea del juego se inspiró en [fingerspelling.xyz](https://fingerspelling.xyz/). Este proyecto no copia su código.
