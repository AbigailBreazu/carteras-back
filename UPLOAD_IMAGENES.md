# 📸 Sistema de Subida de Imágenes - Backend

## 🎯 Configuración Completada

El backend ahora soporta la subida de hasta **10 imágenes por producto**.

---

## 📋 Cambios Implementados

### 1. **Entidad Producto Actualizada**
Ahora tiene un campo array para múltiples imágenes:
- `imagenes` (array con hasta 10 URLs de imágenes)

### 2. **Endpoints de Upload Disponibles**

---

## 🔗 Endpoints para el Frontend

### 1️⃣ Subir una Imagen Individual
```http
POST /upload/image
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

FormData:
- image: File

Response 200:
{
  "message": "Imagen subida exitosamente",
  "filename": "image-1734471234567-123456789.jpg",
  "url": "http://localhost:3000/uploads/image-1734471234567-123456789.jpg"
}
```

### 2️⃣ Subir Múltiples Imágenes (Máximo 10)
```http
POST /upload/images
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

FormData:
- images: File[] (máximo 10 archivos)

Response 200:
{
  "message": "Imágenes subidas exitosamente",
  "files": [
    {
      "filename": "images-1734471234567-123456789.jpg",
      "url": "http://localhost:3000/uploads/images-1734471234567-123456789.jpg"
    },
    {
      "filename": "images-1734471234568-987654321.jpg",
      "url": "http://localhost:3000/uploads/images-1734471234568-987654321.jpg"
    }
    // ... hasta 10 imágenes
  ]
}
```

### 3️⃣ Crear/Actualizar Producto con Imágenes
```http
POST /productos
Authorization: Bearer <admin_token>
Content-Type: application/json

Body:
{
  "nombre": "Cartera Elegante",
  "descripcion": "Cartera de cuero premium",
  "precio": 25000,
  "tipo": "cartera",
  "imagenes": [
    "http://localhost:3000/uploads/image-123.jpg",
    "http://localhost:3000/uploads/image-456.jpg",
    "http://localhost:3000/uploads/image-789.jpg"
  ],
  "stock": 10,
  "activo": true
}

Response 201:
{
  "message": "Producto creado exitosamente",
  "producto": {
    "id": "uuid",
    "nombre": "Cartera Elegante",
    "descripcion": "Cartera de cuero premium",
    "precio": 25000,
    "tipo": "cartera",
    "imagenes": [
      "http://localhost:3000/uploads/image-123.jpg",
      "http://localhost:3000/uploads/image-456.jpg",
      "http://localhost:3000/uploads/image-789.jpg"
    ],
    "stock": 10,
    "activo": true,
    "created_at": "2025-12-17T20:00:00Z",
    "updated_at": "2025-12-17T20:00:00Z"
  }
}
```

---

## 💻 Ejemplos de Código para el Frontend

### React - Subir Una Imagen
```javascript
const uploadImage = async (file) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('http://localhost:3000/upload/image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();
  return data.url; // URL de la imagen subida
};
```

### React - Subir Múltiples Imágenes (hasta 10)
```javascript
const uploadImages = async (files) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  
  // Agregar hasta 10 archivos
  files.slice(0, 10).forEach(file => {
    formData.append('images', file);
  });

  const response = await fetch('http://localhost:3000/upload/images', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();
  return data.files; // Array con las URLs de las imágenes
};
```

### React - Crear Producto con Imágenes
```javascript
const createProductWithImages = async (productData, imageFiles) => {
  const token = localStorage.getItem('token');

  // 1. Primero subir las imágenes
  const uploadedImages = await uploadImages(imageFiles);

  // 2. Luego crear el producto con las URLs de las imágenes
  const imagenesUrls = uploadedImages.map(img => img.url);
  
  const response = await fetch('http://localhost:3000/productos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      ...productData,
      imagenes: imagenesUrls
    })
  });

  return await response.json();
};
```

### React - Componente Completo de Formulario
```jsx
import { useState } from 'react';

function ProductForm() {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    tipo: 'cartera',
    stock: 0,
    activo: true
  });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    setImages(files);

    // Crear previews
    const previewUrls = files.map(file => URL.createObjectURL(file));
    setPreviews(previewUrls);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1. Subir imágenes
      let imageUrls = [];
      if (images.length > 0) {
        const uploadedImages = await uploadImages(images);
        imageUrls = uploadedImages.map(img => img.url);
      }

      // 2. Crear producto
      const productData = {
        ...formData,
        imagen_url: imageUrls[0] || null,
        imagen_url_2: imageUrls[1] || null
      };

      const result = await createProductWithImages(productData, images);
      console.log('Producto creado:', result);
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        descripcion: '',
        precio: 0,
        tipo: 'cartera',
        stock: 0,
        activo: true
      });
      setImages([]);
      setPreviews([]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nombre"
        value={formData.nombre}
        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
      />

      <textarea
        placeholder="Descripción"
        value={formData.descripcion}
        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
      />

      <input
        type="number"
        placeholder="Precio"
        value={formData.precio}
        onChange={(e) => setFormData({ ...formData, precio: Number(e.target.value) })}
      />

      <select
        value={formData.tipo}
        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
      >
        <option value="cartera">Cartera</option>
        <option value="rinonera">Riñonera</option>
        <option value="mater">Mater</option>
        <option value="combo">Combo</option>
        <option value="mochila">Mochila</option>
      </select>

      <input
        type="number"
        placeholder="Stock"
        value={formData.stock}
        onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
      />

      {/* Input para imágenes */}
      <div>
        <label>Imágenes (máximo 2)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          max="2"
        />
        
        {/* Preview de imágenes */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          {previews.map((preview, index) => (
            <img
              key={index}
              src={preview}
              alt={`Preview ${index + 1}`}
              style={{ width: '100px', height: '100px', objectFit: 'cover' }}
            />
          ))}
        </div>
      </div>

      <button type="submit">Crear Producto</button>
    </form>
  );
}

export default ProductForm;
```

---

## 📁 Estructura de Archivos

Las imágenes se guardan en:
```
/uploads/
  ├── image-1734471234567-123456789.jpg
  ├── image-1734471234568-987654321.jpg
  └── images-1734471234569-456789123.png
```

Y son accesibles públicamente en:
```
http://localhost:3000/uploads/nombre-del-archivo.jpg
```

---

## ⚙️ Configuración

### Variables de Entorno
```env
UPLOADS_FOLDER=./uploads
MAX_FILE_SIZE=5000000
BACKEND_URL=http://localhost:3000
```

### Restricciones
- **Formatos permitidos**: jpg, jpeg, png, gif, webp
- **Tamaño máximo por archivo**: 5MB (configurable)
- **Máximo de archivos**: 2 imágenes por producto
- **Autenticación**: Solo usuarios con rol `admin` pueden subir imágenes

---

## 🔒 Seguridad

- ✅ Solo administradores pueden subir imágenes
- ✅ Validación de tipo de archivo (solo imágenes)
- ✅ Límite de tamaño de archivo
- ✅ Nombres de archivo únicos (timestamp + random)
- ✅ Carpeta uploads protegida por configuración

---

## 🚀 Flujo Completo de Trabajo

### Para crear un producto con imágenes:

1. **Usuario selecciona las imágenes** en el formulario (máximo 2)
2. **Frontend muestra preview** de las imágenes seleccionadas
3. **Usuario completa el formulario** con los datos del producto
4. **Al hacer submit:**
   - Frontend sube las imágenes a `/upload/images`
   - Backend devuelve las URLs de las imágenes
   - Frontend crea el producto con las URLs en `/productos`
5. **Producto creado** con ambas imágenes

### Para actualizar imágenes de un producto existente:

1. **Obtener el producto actual** (`GET /productos/:id`)
2. **Si el usuario sube nuevas imágenes:**
   - Subir nuevas imágenes a `/upload/images`
   - Actualizar el producto con las nuevas URLs (`PUT /productos/:id`)
3. **Si solo modifica una imagen:**
   - Mantener la otra URL existente
   - Solo subir la imagen nueva

---

## 📊 Response de Productos con Imágenes

Cuando obtengas productos, ahora incluyen ambas imágenes:

```json
{
  "productos": [
    {
      "id": "uuid",
      "nombre": "Cartera Elegante",
      "descripcion": "Cartera de cuero premium",
      "precio": 25000,
      "tipo": "cartera",
      "imagen_url": "http://localhost:3000/uploads/image-123.jpg",
      "imagen_url_2": "http://localhost:3000/uploads/image-456.jpg",
      "stock": 10,
      "activo": true
    }
  ]
}
```

---

## 🎨 Ejemplo de Galería en el Frontend

```jsx
function ProductGallery({ producto }) {
  const [currentImage, setCurrentImage] = useState(0);
  const images = [producto.imagen_url, producto.imagen_url_2].filter(Boolean);

  return (
    <div>
      {/* Imagen principal */}
      <img 
        src={images[currentImage]} 
        alt={producto.nombre}
        style={{ width: '100%', maxWidth: '500px' }}
      />

      {/* Thumbnails */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        {images.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`${producto.nombre} - ${index + 1}`}
            onClick={() => setCurrentImage(index)}
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'cover',
              cursor: 'pointer',
              border: currentImage === index ? '2px solid blue' : 'none'
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## ✅ Todo Listo!

El backend está completamente configurado para:
- ✅ Subir hasta 2 imágenes por producto
- ✅ Validar tipos y tamaños de archivo
- ✅ Servir imágenes públicamente
- ✅ Proteger endpoints con autenticación de admin
- ✅ Retornar URLs completas de las imágenes

**El frontend solo necesita implementar el formulario y la lógica de subida mostrada arriba!** 🎉
