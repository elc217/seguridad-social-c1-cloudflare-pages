# Memoria del proyecto
## LGSS Seguridad Social C1

**Autor:** Luis Enrique Algueró Martín  
**Destinataria:** Comunidad de Alumnos de «Escuela Ciudadana de Administración Pública» (ECAP)  
**Año:** 2026

## 1. Objeto

Este proyecto proporciona una herramienta multiplataforma para estudiar la Ley General de la Seguridad Social de forma estructurada, con biblioteca legal, tarjetas de recuerdo, tests y seguimiento del avance.

La aplicación se distribuye como PWA, aplicación Android, aplicación iOS, aplicación Windows y aplicaciones macOS para Intel y Apple Silicon.

## 2. Alcance funcional

La versión unificada contiene 470 unidades de estudio, con sus textos, jerarquía, referencias al BOE y banco de preguntas asociado. El contenido se mantiene local para permitir el estudio sin conexión y evitar duplicar la legislación en servicios externos.

Las funciones principales son:

- Biblioteca con búsqueda y filtros.
- Consulta de artículos y disposiciones.
- Enlaces al precepto correspondiente del BOE.
- Tarjetas con respuesta literal y evidencia textual.
- Tests de 12, 25 o 50 preguntas.
- Preguntas de literalidad y comprensión.
- Corrección con explicación y cita exacta.
- Estados de unidad: pendiente, en estudio y dominada.
- Estadísticas de avance y resultados.
- Historial de sesiones.
- Exportación e importación de progreso JSON.
- Funcionamiento offline.

## 3. Progreso y privacidad

El progreso se guarda inicialmente en el dispositivo mediante la clave independiente de esta versión. No se modifica el almacenamiento de la versión original.

La sincronización opcional con Google Drive utiliza el espacio privado `appDataFolder` de la cuenta del usuario. Solo se sincronizan estados de estudio, tarjetas y resultados; no se suben la biblioteca, la legislación ni el banco de preguntas.

La autorización requiere una acción explícita del usuario y el permiso mínimo de Google Drive. Si el usuario no conecta Google Drive, la aplicación continúa funcionando localmente.

## 4. Arquitectura

La aplicación está construida con HTML, CSS y JavaScript ESM sin framework de interfaz. Capacitor empaqueta la aplicación web en Android e iOS. Electron empaqueta la misma aplicación en Windows y macOS.

El dominio del progreso está separado de la interfaz y dispone de validación, combinación conservadora y deduplicación de sesiones. El núcleo de Google Drive trabaja con un envoltorio versionado para poder evolucionar el formato sin perder datos.

## 5. Distribución

Los builds se generan mediante GitHub Actions:

- Android: APK de depuración.
- iOS: IPA de compilación sin firma de distribución.
- Windows: instalador NSIS.

Los DMG de macOS se generan localmente para:

- Intel x64.
- Apple Silicon arm64.

La firma de código y la distribución oficial en App Store, Google Play o Microsoft Store requieren credenciales de plataforma adicionales.

## 6. Calidad y validación

La suite automatizada valida:

- Integridad de las 470 unidades.
- Estabilidad de identificadores.
- Evidencia exacta de las preguntas.
- Evaluación de tildes y puntuación.
- Distribución de tests.
- Importación y combinación de progreso.
- Marcadores BOE.
- Formato de sincronización Google Drive.

El estado de referencia contiene 18 pruebas superadas.

## 7. Autoría institucional

La aplicación identifica de forma visible y discreta:

> Autor: Luis Enrique Algueró Martín  
> Elaborado para la Comunidad de Alumnos de «Escuela Ciudadana de Administración Pública» (ECAP) · 2026

Se incorpora el logotipo ECAP como recurso local en el pie de la aplicación para mantenerlo visible sin interferir con el estudio.

## 8. Limitaciones

La fecha de la legislación corresponde a la instantánea incorporada. La aplicación no sustituye la consulta del BOE ni constituye un temario oficial validado.

El IPA iOS sin firma no se instala directamente en un dispositivo físico sin un proceso de firma. La sincronización nativa de Android, iOS y Electron requiere completar sus adaptadores OAuth específicos; la PWA dispone del flujo web de autorización.

## 9. Continuidad del proyecto

Punto de recuperación anterior:

```text
checkpoint/google-drive-oauth-config
```

La siguiente fase técnica consiste en completar los callbacks OAuth nativos y regenerar los instaladores finales con las credenciales de cada plataforma.
