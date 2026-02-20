# 🛒 E-Commerce Recommendation System Engine

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Pandas](https://img.shields.io/badge/Pandas-2.0+-150458?style=for-the-badge&logo=pandas&logoColor=white)

Un motor de recomendaciones inteligente y dashboard analítico para E-commerce, desarrollado con un enfoque híbrido de **Filtro Colaborativo** y **Reglas de Asociación**.

## ✨ Características Principales

- **Dashboard Moderno**: Interfaz interactiva construida con React, Vite y Lucide Icons.
- **Recomendaciones Personalizadas**: Motor basado en SVD (Singular Value Decomposition) para sugerencias personalizadas por usuario.
- **Market Basket Analysis**: Reglas de asociación (Apriori) para detectar productos que se compran juntos frecuentemente.
- **Soporte Bilingüe (EN/ES)**: Traducción automática de todo el catálogo de productos utilizando Google Translate API.
- **Búsqueda Inteligente**: Autocompletado de productos y usuarios en tiempo real.
- **Visualización Analítica**: Gráficos interactivos de rendimiento, distribución de ventas y KPIs.

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/lucianolabudia/ecommerce-recsys-engine.git
cd ecommerce-recsys-engine
```

### 2. Configurar el Backend (Python)

```bash
# Crear entorno virtual
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # Windows

# Instalar dependencias
pip install -r requirements.txt
pip install deep-translator  # Para el motor de traducción
```

### 3. Configurar el Frontend (React)

```bash
cd dashboard
npm install
```

### 4. Preparar los Datos y Modelos

El sistema descarga automáticamente el dataset usando `kagglehub`. Ejecuta los notebooks en orden para entrenar los modelos o corre el script de traducción:

```bash
# Traducir catálogo al español
python scripts/translate_catalog.py
```

## 🛠️ Uso del Sistema

### Iniciar el Servidor API (Backend)

Desde la raíz del proyecto:

```bash
python -m uvicorn app.main:app --reload
```

Acceso a Swagger UI: `http://localhost:8000/docs`

### Iniciar el Dashboard (Frontend)

Desde la carpeta `dashboard`:

```bash
npm run dev
```

Acceso al Dashboard: `http://localhost:5173`

## 📊 Estructura del Proyecto

```
ecommerce-recsys-engine/
├── app/
│   ├── api/            # Endpoints de la API (Dashboard, Recs, Search)
│   ├── services/       # Lógica del motor y modelos entrenados (.pkl)
│   └── main.py         # Punto de entrada FastAPI
├── dashboard/          # Aplicación Frontend React + Vite
├── scripts/            # Scripts de traducción y validación
├── notebooks/          # Exploración y entrenamiento de modelos
├── requirements.txt    # Dependencias de Python
└── README.md           # Documentación
```

## ✅ Validación del Sistema

Puedes ejecutar el script de validación para asegurar que todos los servicios responden correctamente:

```bash
python scripts/validate_system.py
```

## 🤝 Contribución

Las contribuciones son bienvenidas. Siéntete libre de abrir un Pull Request o Issue.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
