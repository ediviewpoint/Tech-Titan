# Product Backlog - Tech-Titan

## Visión del Proyecto
Desarrollar **"Tech-Titan"**, una plataforma e-commerce de alto rendimiento especializada en hardware y componentes de PC, con un sistema avanzado de validación de compatibilidad de piezas (ej: Sockets de CPU, Watts de la fuente).

---

## Sprint 0 - Setup Inicial y Arquitectura Base

| ID | Historia de Usuario | Criterios de Aceptación | Prioridad |
|----|---------------------|--------------------------|-----------|
| **US-01** | Como **Arquitecto de Software**, quiero **establecer la estructura base del monorepo (Presentación, Negocio, Datos)** para **asegurar la separación de responsabilidades, escalabilidad y aplicar principios SOLID desde el día uno.** | - Estructura de 3 capas creada (`/capa-presentacion`, `/capa-negocio`, `/capa-datos`).<br>- Documentación inicial creada.<br>- Repositorio configurado. | Alta (Sprint 0) |
| **US-02** | Como **DevOps/Scrum Master**, quiero **configurar la infraestructura base con Docker Compose** para **contar con entornos de base de datos (PostgreSQL) y caché (Redis) reproducibles e idénticos en desarrollo y producción.** | - Archivo `docker-compose.yml` funcional.<br>- PostgreSQL y Redis levantan sin errores de puertos.<br>- Volúmenes persistentes configurados. | Alta (Sprint 0) |

## Sprint 1 - Funcionalidades Core (Catálogo y Metadatos Técnicos)

| ID | Historia de Usuario | Criterios de Aceptación | Prioridad |
|----|---------------------|--------------------------|-----------|
| **US-03** | Como **Administrador de Catálogo**, quiero **definir los modelos de datos de componentes en PostgreSQL con campos técnicos específicos (ej. Sockets, Watts, Factor de Forma)** para **almacenar de manera estructurada las especificaciones necesarias para validar compatibilidad.** | - Esquema relacional diseñado bajo principios de Clean Code.<br>- Migraciones (MedusaJS/TypeORM) creadas para la tabla `Products` y sus metadatos.<br>- Restricciones de integridad referencial aplicadas. | Alta |
| **US-04** | Como **Desarrollador Backend**, quiero **desarrollar una API RESTful escalable utilizando MedusaJS y Node.js** para **exponer el catálogo de hardware a la capa de presentación, integrando Redis para respuestas en caché de alto rendimiento.** | - Endpoints implementados (`GET /store/products`).<br>- Respuesta incluye metadatos técnicos estructurados.<br>- Redis integrado: Tiempo de respuesta en caché menor a 100ms. | Alta |
| **US-05** | Como **Cliente Gamer/Entusiasta PC**, quiero **visualizar la ficha técnica de un componente en una interfaz web moderna y rápida (Next.js con Tailwind CSS)** para **conocer sus características clave (como Watts requeridos o Socket compatible) y tomar una decisión de compra informada.** | - Componente UI desarrollado en Next.js con Tailwind CSS (Responsive).<br>- Consumo asíncrono y seguro de la API de catálogo.<br>- Las especificaciones técnicas son claramente visibles con una jerarquía visual impecable. | Alta |
